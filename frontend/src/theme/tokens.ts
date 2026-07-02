import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens — Phase 0 foundation.
 *
 * The single source of truth for color, type, spacing, radius, and elevation.
 * Everything visual in the app should derive from here (directly, or via the
 * `useTheme()` hook in ThemeContext) rather than hardcoding values.
 *
 * Design direction: media-rich but calm and legible — Instagram polish on the
 * media, LinkedIn restraint on the chrome, Facebook breadth in the surface.
 */

/* ------------------------------------------------------------------ *
 * Mode-independent tokens
 * ------------------------------------------------------------------ */

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Typographic scale. Uses the platform system font (SF on iOS, Roboto on Android). */
export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 16 },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Reaction colors — shared across light and dark. */
export const reactions = {
  LIKE: '#3B82F6',
  LOVE: '#F0435C',
  HAHA: '#F5A623',
  WOW: '#16B8A6',
  SAD: '#7C83FF',
  ANGRY: '#F5701A',
} as const;

/** Instagram-style story-ring gradient stops — reserved for story rings only (Phase 4). */
export const storyGradient = ['#F9A825', '#F65D3B', '#E6237A', '#8A3AB9'] as const;

/** Soft shadow levels. `elevation` drives Android; the shadow* props drive iOS. */
export const elevation = {
  e1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  e2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  e3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
} satisfies Record<string, ViewStyle>;

/* ------------------------------------------------------------------ *
 * Color palettes (light / dark)
 * ------------------------------------------------------------------ */

/** Semantic color roles. Both palettes share the same keys so components stay mode-agnostic. */
export const darkColors = {
  background: '#0D1015',
  surface: '#161A20',
  surfaceAlt: '#1D222A',
  border: '#282F39',
  borderStrong: '#3A424E',

  text: '#EEF1F5',
  textSecondary: '#A3ABB7',
  textMuted: '#6B7480',

  accent: '#6E7CFF',
  accentWeak: '#21283F',
  onAccent: '#FFFFFF',

  success: '#2CB985',
  warning: '#E8A020',
  danger: '#F0575C',

  white: '#FFFFFF',
} as const;

export const lightColors: Record<keyof typeof darkColors, string> = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFCFE',
  border: '#E4E8EF',
  borderStrong: '#D2D8E2',

  text: '#14171C',
  textSecondary: '#58616E',
  textMuted: '#8B94A2',

  accent: '#5B6CFF',
  accentWeak: '#EAECFF',
  onAccent: '#FFFFFF',

  success: '#17A673',
  warning: '#E0900B',
  danger: '#E5484D',

  white: '#FFFFFF',
};

export type ThemeColors = typeof darkColors;
export type ColorToken = keyof ThemeColors;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: typeof elevation;
  reactions: typeof reactions;
}

export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : (lightColors as ThemeColors),
    spacing,
    radius,
    typography,
    elevation,
    reactions,
  };
}
