import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

/** Labeled text input with a focus ring and error state. */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.accent
      : theme.colors.borderStrong;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor,
            borderWidth: 1,
            borderRadius: theme.radius.sm,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            color: theme.colors.text,
            fontSize: 16,
          },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});
