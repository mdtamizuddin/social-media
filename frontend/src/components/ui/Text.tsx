import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ColorToken, TypographyVariant } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  /** Typographic variant from the type scale. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Semantic color token, or a raw color string. Defaults to `text`. */
  color?: ColorToken | string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
}

/** Themed text primitive — the base for all copy in the app. */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'text',
  align,
  weight,
  style,
  ...rest
}) => {
  const theme = useTheme();
  const resolvedColor =
    color in theme.colors ? theme.colors[color as ColorToken] : (color as string);

  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: resolvedColor },
        align ? { textAlign: align } : null,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...rest}
    />
  );
};
