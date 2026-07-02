import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const screen = this.props.screenName ?? 'UnknownScreen';
    Logger.error(screen, 'Unhandled render error', error);
    Logger.error(screen, 'Component stack', info.componentStack);
    this.setState({ info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Something went wrong</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error?.message}</Text>
            {__DEV__ && this.state.info && (
              <Text style={styles.stack}>{this.state.info.componentStack}</Text>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#ff6b6b',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scroll: {
    maxHeight: 300,
    marginBottom: 24,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  stack: {
    color: '#aaa',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#6c63ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
