import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../api/storage';
import { apolloClient } from '../api/apollo-client';
import { gql } from '@apollo/client';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  isPrivate: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ME_QUERY = gql`
  query Me {
    me {
      _id
      username
      email
      displayName
      bio
      avatarUrl
      coverPhotoUrl
      isPrivate
    }
  }
`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = await getSecureItem('access_token');
      if (token) {
        // Fetch current user details via Apollo
        const { data } = await apolloClient.query<any>({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        });
        if (data && data.me) {
          setUser(data.me);
        } else {
          await logout();
        }
      }
    } catch (e) {
      // Clear tokens if token validation failed
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string, loggedUser: User) => {
    await setSecureItem('access_token', accessToken);
    await setSecureItem('refresh_token', refreshToken);
    setUser(loggedUser);
  };

  const logout = async () => {
    await deleteSecureItem('access_token');
    await deleteSecureItem('refresh_token');
    setUser(null);
    await apolloClient.clearStore();
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
