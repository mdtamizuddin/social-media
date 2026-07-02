import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export type BadgeTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

/** Small status pill — encodes state (new / online / pending) at a glance. */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'accent', style }) => {
  const theme = useTheme();
  const { bg, fg } = tonePalette(theme.colors, tone);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 3,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="overline" color={fg}>
        {label}
      </Text>
    </View>
  );
};

function tonePalette(c: ReturnType<typeof useTheme>['colors'], tone: BadgeTone) {
  switch (tone) {
    case 'success':
      return { bg: withAlpha(c.success, 0.16), fg: c.success };
    case 'warning':
      return { bg: withAlpha(c.warning, 0.18), fg: c.warning };
    case 'danger':
      return { bg: withAlpha(c.danger, 0.16), fg: c.danger };
    case 'neutral':
      return { bg: c.surfaceAlt, fg: c.textSecondary };
    case 'accent':
    default:
      return { bg: c.accentWeak, fg: c.accent };
  }
}

/** Overlay a hex color at the given alpha (0–1) onto a translucent pill background. */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
