import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export interface AvatarProps {
  uri?: string | null;
  /** Display name — used to derive the initial fallback. */
  name?: string;
  size?: number;
  /** Show the story-style gradient fill behind the initial. */
  gradient?: boolean;
  style?: ViewStyle;
}

/** User avatar — image when available, initial fallback otherwise. */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 40,
  gradient = false,
  style,
}) => {
  const theme = useTheme();
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initial = (name?.trim()?.charAt(0) ?? '?').toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={[dimension, style] as StyleProp<ImageStyle>} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        dimension,
        { backgroundColor: gradient ? '#8A3AB9' : theme.colors.accentWeak },
        style,
      ]}
    >
      <Text
        color={gradient ? theme.colors.white : theme.colors.accent}
        weight="700"
        style={{ fontSize: size * 0.42 }}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
