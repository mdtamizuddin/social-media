import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Button, Card, Text, TextField } from '../components/ui';

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
  const theme = useTheme();
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
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: theme.spacing.xxl,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.huge }}>
          <Text variant="display" color="accent" style={{ letterSpacing: 1 }}>
            Antigravity
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
            Connect with the world in real-time
          </Text>
        </View>

        <Card padded="xxl" style={{ borderRadius: theme.radius.lg }}>
          <TextField
            label="Username or Email"
            placeholder="Enter username or email"
            value={identity}
            onChangeText={setIdentity}
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <TextField
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <Button
            label="Log In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: theme.spacing.xxl,
            }}
          >
            <Text variant="body" color="textSecondary">
              Don&apos;t have an account?{' '}
            </Text>
            <Text
              variant="bodyStrong"
              color="accent"
              onPress={() => navigation.navigate('Register')}
            >
              Sign Up
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
