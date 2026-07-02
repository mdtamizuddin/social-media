import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
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
  }
`;

export const LoginScreen = ({ navigation }: any) => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onError: (err: any) => {
      Alert.alert('Login Failed', err.message);
    },
  });

  const handleLogin = async () => {
    if (!identity || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { data } = await loginMutation({
        variables: {
          input: {
            identity,
            password,
          },
        },
      });

      const loginData = (data as any)?.login;
      if (loginData) {
        const { accessToken, refreshToken, user } = loginData;
        await login(accessToken, refreshToken, user);
      }
    } catch {
      // Handled by onError
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.logo}>Antigravity</Text>
          <Text style={styles.subtitle}>Connect with the world in real-time</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username or email"
              placeholderTextColor={Colors.textDim}
              value={identity}
              onChangeText={setIdentity}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={Colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});