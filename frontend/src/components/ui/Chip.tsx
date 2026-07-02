import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Selectable pill — hashtags, filters, quick picks. */
export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress, style }) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: selected ? theme.colors.accentWeak : theme.colors.surface,
          borderColor: selected ? theme.colors.accent : theme.colors.borderStrong,
          borderWidth: 1,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text variant="label" color={selected ? 'accent' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
};
