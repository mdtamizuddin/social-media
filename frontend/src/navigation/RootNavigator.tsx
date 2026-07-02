import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

// Types
import { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CommentsScreen } from '../screens/CommentsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: 'Home',
          // Icons will be added in layout phase using vector icons
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'Explore',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {user === null ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{
                headerShown: true,
                headerTitle: 'Create Post',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
              }}
            />
            <RootStack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Post',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
              }}
            />
            <RootStack.Screen
              name="Comments"
              component={CommentsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Comments',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
