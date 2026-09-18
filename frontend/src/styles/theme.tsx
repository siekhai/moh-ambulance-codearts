/**
 * MoH Ambulance Mini App — Theme Provider & Typed Token Accessors
 * -----------------------------------------------------------------------------
 * Provides a typed accessor surface over the design tokens defined in
 * `tokens.ts` / `tokens.css`. Components consume tokens via the `theme`
 * export or the `useTheme()` hook (context-aware for future dark-mode /
 * RTL support).
 *
 * @example
 * import { useTheme } from '@/styles/theme';
 * function Button() {
 *   const t = useTheme();
 *   return <button style={{ background: t.color.brand, ...t.text.labelLMedium }}>...</button>;
 * }
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import * as tokens from './tokens';

// =============================================================================
// Types
// =============================================================================

export type Theme = tokens.Theme;

export interface ThemeProviderProps {
  /** Optional override of the default theme (for testing / theming). */
  theme?: Partial<Theme>;
  /** Children to render within the theme context. */
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = createContext<Theme>(tokens.theme);

/**
 * ThemeProvider — wraps the app and provides the design-token theme via
 * React context. Reads CSS variables at runtime, so no JS values are
 * hard coded into components.
 */
export function ThemeProvider({ theme: overrides, children }: ThemeProviderProps) {
  const value = useMemo<Theme>(
    () => (overrides ? { ...tokens.theme, ...overrides } : tokens.theme),
    [overrides],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme — returns the current theme token accessor. Falls back to the
 * static `theme` export when used outside a provider (e.g. in tests).
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// =============================================================================
// Typed token accessors (re-exported for direct import)
// =============================================================================

export const theme = tokens.theme;
export const color = tokens.color;
export const gradient = tokens.gradient;
export const fontFamily = tokens.fontFamily;
export const fontWeight = tokens.fontWeight;
export const fontSize = tokens.fontSize;
export const text = tokens.text;
export const letterSpacing = tokens.letterSpacing;
export const spacing = tokens.spacing;
export const layout = tokens.layout;
export const shadow = tokens.shadow;
export const radius = tokens.radius;
export const zIndex = tokens.zIndex;
export const blur = tokens.blur;
export const transition = tokens.transition;

// Convenience type re-exports
export type ColorToken = tokens.ColorToken;
export type TextToken = tokens.TextToken;
export type SpacingToken = tokens.SpacingToken;
export type ShadowToken = tokens.ShadowToken;
export type RadiusToken = tokens.RadiusToken;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert a TextStyle token into a React.CSSProperties object.
 * Useful for inline styles: `style={cssText(text.h3)}`.
 */
export function cssText(style: tokens.TextStyle): React.CSSProperties {
  return {
    fontWeight: style.fontWeight,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontFamily: style.fontFamily,
  };
}

/**
 * Build a spaced gap string from spacing tokens.
 * @example gap(spacing.md, spacing.lg) // 'var(--spacing-md) var(--spacing-lg)'
 */
export function gap(...tokens: string[]): string {
  return tokens.join(' ');
}
