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

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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

export const RegisterScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION, {
    onError: (err: any) => {
      Alert.alert('Registration Failed', err.message);
    },
  });

  const handleRegister = async () => {
    if (!username || !email || !displayName || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            username: username.toLowerCase().trim(),
            email: email.trim(),
            displayName: displayName.trim(),
            password,
          },
        },
      });

      if (data && data.register) {
        const { accessToken, refreshToken, user } = data.register;
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
          <Text style={styles.subtitle}>Create an account to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. johndoe"
              placeholderTextColor={Colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor={Colors.textDim}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. john@example.com"
              placeholderTextColor={Colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
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
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
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
    marginBottom: 30,
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
    marginBottom: 16,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    marginBottom: 6,
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
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.secondary,
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
    marginTop: 20,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
