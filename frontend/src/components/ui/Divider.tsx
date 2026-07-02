import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface DividerProps {
  spacing?: number;
  style?: ViewStyle;
}

/** Hairline separator. */
export const Divider: React.FC<DividerProps> = ({ spacing, style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: spacing ?? theme.spacing.md,
        },
        style,
      ]}
    />
  );
};
