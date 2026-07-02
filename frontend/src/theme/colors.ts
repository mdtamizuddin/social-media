import { darkColors, reactions } from './tokens';

/**
 * Back-compatible static color object.
 *
 * Screens not yet migrated to the `useTheme()` hook keep importing `Colors`.
 * It now maps onto the Phase-0 dark palette (see tokens.ts), so legacy screens
 * pick up the refined colors for free while staying dark until migrated.
 *
 * New code should prefer `useTheme()` from '../theme/ThemeContext'.
 */
export const Colors = {
  background: darkColors.background,
  surface: darkColors.surface,
  surfaceCard: darkColors.surfaceAlt,
  primary: darkColors.accent,
  secondary: '#E86AA6',
  text: darkColors.text,
  textMuted: darkColors.textSecondary,
  textDim: darkColors.textMuted,
  border: darkColors.border,
  borderLight: darkColors.borderStrong,
  error: darkColors.danger,
  success: darkColors.success,
  white: darkColors.white,

  // Reactions
  like: reactions.LIKE,
  love: reactions.LOVE,
  haha: reactions.HAHA,
  wow: reactions.WOW,
  sad: reactions.SAD,
  angry: reactions.ANGRY,
};
