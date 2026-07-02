import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  style,
  ...rest
}) => {
  const theme = useTheme();
  const palette = variantPalette(theme, variant);
  const isDisabled = disabled || loading;
  const pad = size === 'sm' ? theme.spacing.sm : theme.spacing.md;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: theme.radius.pill,
          paddingVertical: pad,
          paddingHorizontal: theme.spacing.xl,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View> : null}
          <Text
            variant={size === 'sm' ? 'label' : 'bodyStrong'}
            color={palette.fg}
            weight="600"
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

function variantPalette(theme: Theme, variant: ButtonVariant) {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return { bg: 'transparent', border: c.accent, fg: c.accent };
    case 'ghost':
      return { bg: c.surfaceAlt, border: c.borderStrong, fg: c.text };
    case 'danger':
      return { bg: c.danger, border: c.danger, fg: c.white };
    case 'primary':
    default:
      return { bg: c.accent, border: c.accent, fg: c.onAccent };
  }
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
