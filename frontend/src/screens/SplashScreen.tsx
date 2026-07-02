import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native';
import { Colors } from '../theme/colors';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>S</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
