import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './src/api/apollo-client';
import { AuthProvider } from './src/context/AuthContext';
import { RealTimeProvider } from './src/context/RealTimeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Logger } from './src/utils/logger';

export default function App() {
  useEffect(() => {
    Logger.info('App', 'App initialized');

    // ErrorUtils is a React Native global (not exported from 'react-native')
    const utils = (global as any).ErrorUtils;
    if (utils) {
      const prevHandler = utils.getGlobalHandler();
      utils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        Logger.error('App', `${isFatal ? '[FATAL]' : '[ERROR]'} Unhandled exception`, error);
        prevHandler?.(error, isFatal);
      });
      return () => utils.setGlobalHandler(prevHandler);
    }
  }, []);

  return (
    <ErrorBoundary screenName="App">
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <RealTimeProvider>
            <SafeAreaProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </SafeAreaProvider>
          </RealTimeProvider>
        </AuthProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
