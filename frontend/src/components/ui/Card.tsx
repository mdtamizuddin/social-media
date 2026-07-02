import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/tokens';

export interface CardProps extends ViewProps {
  /** Shadow level. `none` keeps it flat with just a border. */
  elevation?: 'none' | 'e1' | 'e2' | 'e3';
  /** Inner padding — a named spacing token or a raw number. Defaults to `lg`. */
  padded?: keyof typeof spacing | number;
  style?: ViewStyle | ViewStyle[];
}

/** Surface container — the base for feed posts, list rows, sheets, etc. */
export const Card: React.FC<CardProps> = ({
  elevation = 'e1',
  padded = 'lg',
  style,
  children,
  ...rest
}) => {
  const theme = useTheme();
  const padding =
    typeof padded === 'number' ? padded : theme.spacing[padded] ?? theme.spacing.lg;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          padding,
        },
        elevation !== 'none' ? theme.elevation[elevation] : null,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};
