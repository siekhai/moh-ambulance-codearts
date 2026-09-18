/**
 * MoH Ambulance Mini App — TypeScript Design Token Definitions
 * -----------------------------------------------------------------------------
 * Typed constants matching the CSS custom properties in `tokens.css`.
 * Import these for compile-time safety in TS/TSX components; use the CSS
 * variables directly in stylesheets.
 *
 * Source: Figma extract (specs/2026-09-17-moh-ambulance/figma-extract.md)
 *
 * @example
 * import { color, text } from '@/styles/tokens';
 * const style: React.CSSProperties = { color: color.brand, ...text.h3 };
 */

// =============================================================================
// Types
// =============================================================================

/** A CSS custom property reference, e.g. `var(--color-brand)`. */
type CssVar = `var(--${string})`;

/** Named font shorthand tokens (weight + size + line-height + family). */
export interface TextStyle {
  readonly fontWeight: number;
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly fontFamily: string;
  readonly css: CssVar;
}

// =============================================================================
// Color tokens (40+)
// =============================================================================

export const color = {
  // Brand (red — ambulance / emergency)
  brand: 'var(--color-brand)',
  brandButton: 'var(--color-brand-button)',
  brandDark: 'var(--color-brand-dark)',
  brandDeep: 'var(--color-brand-deep)',
  brandMuted: 'var(--color-brand-muted)',

  // Brand red tints / backgrounds
  brandTint1: 'var(--color-brand-tint-1)',
  brandTint2: 'var(--color-brand-tint-2)',
  brandTint3: 'var(--color-brand-tint-3)',
  brandTint4: 'var(--color-brand-tint-4)',
  brandTint5: 'var(--color-brand-tint-5)',
  brandTranslucent: 'var(--color-brand-translucent)',
  brandOverlay10: 'var(--color-brand-overlay-10)',

  // Neutrals / grays
  white: 'var(--color-white)',
  black: 'var(--color-black)',
  nearBlack: 'var(--color-near-black)',
  ink: 'var(--color-ink)',
  grayRoute: 'var(--color-gray-route)',
  graySecondary: 'var(--color-gray-secondary)',
  grayStatus: 'var(--color-gray-status)',
  grayMuted: 'var(--color-gray-muted)',
  grayMid: 'var(--color-gray-mid)',
  grayDarkText: 'var(--color-gray-dark-text)',
  gray800: 'var(--color-gray-800)',
  gray300: 'var(--color-gray-300)',
  gray200: 'var(--color-gray-200)',
  gray100: 'var(--color-gray-100)',
  gray50: 'var(--color-gray-50)',
  grayBorder: 'var(--color-gray-border)',

  // Blue
  blue: 'var(--color-blue)',
  blueLight: 'var(--color-blue-light)',
  blueIos: 'var(--color-blue-ios)',
  blueAccent: 'var(--color-blue-accent)',
  blueOverlay20: 'var(--color-blue-overlay-20)',

  // Green (success)
  success: 'var(--color-success)',

  // Warning / orange
  warning: 'var(--color-warning)',
  warningBg: 'var(--color-warning-bg)',

  // Yellow
  yellowBg: 'var(--color-yellow-bg)',

  // Decorative
  teal: 'var(--color-teal)',
  sky: 'var(--color-sky)',

  // Translucent overlays
  blackOverlay20: 'var(--color-black-overlay-20)',
  grayOverlay40: 'var(--color-gray-overlay-40)',
  whiteOverlay20: 'var(--color-white-overlay-20)',
  whiteOverlay10: 'var(--color-white-overlay-10)',

  // Semantic (composed)
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceMuted: 'var(--color-surface-muted)',
  surfaceCard: 'var(--color-surface-card)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textDisabled: 'var(--color-text-disabled)',
  textInverse: 'var(--color-text-inverse)',
  textLink: 'var(--color-text-link)',
  border: 'var(--color-border)',
  borderSubtle: 'var(--color-border-subtle)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
} as const;

export type ColorToken = keyof typeof color;

// =============================================================================
// Gradient tokens
// =============================================================================

export const gradient = {
  brandButton: 'var(--gradient-brand-button)',
  brandBg: 'var(--gradient-brand-bg)',
  skeuomorphic: 'var(--gradient-skeuomorphic)',
} as const;

// =============================================================================
// Font family tokens
// =============================================================================

export const fontFamily = {
  khmer: 'var(--font-khmer)',
  latin: 'var(--font-latin)',
  roboto: 'var(--font-roboto)',
  ios: 'var(--font-ios)',
} as const;

// =============================================================================
// Font weight tokens
// =============================================================================

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  iosEmphasized: 590,
} as const;

// =============================================================================
// Font size tokens (px)
// =============================================================================

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  xl2: '28px',
  display: '52px',
} as const;

// =============================================================================
// Typography scale (30+ text styles)
// =============================================================================

/**
 * Each text style exposes the raw CSS shorthand token (`css`) plus decomposed
 * fields for use in inline style objects / JS-in-CSS.
 */
export const text = {
  // Kantumruy Pro (primary Khmer)
  h3: { fontWeight: 600, fontSize: '28px', lineHeight: '1.39', fontFamily: fontFamily.khmer, css: 'var(--text-h3)' },
  h5SemiBold: { fontWeight: 600, fontSize: '20px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-h5-semibold)' },
  h5Medium: { fontWeight: 500, fontSize: '20px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-h5-medium)' },
  h6SemiBold: { fontWeight: 600, fontSize: '18px', lineHeight: '1.33', fontFamily: fontFamily.khmer, css: 'var(--text-h6-semibold)' },
  h6Medium: { fontWeight: 500, fontSize: '18px', lineHeight: '1.33', fontFamily: fontFamily.khmer, css: 'var(--text-h6-medium)' },
  h6Desktop: { fontWeight: 600, fontSize: '20px', lineHeight: '1.6', fontFamily: fontFamily.khmer, css: 'var(--text-h6-desktop)' },
  labelLMedium: { fontWeight: 500, fontSize: '16px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-l-medium)' },
  labelLRegular: { fontWeight: 400, fontSize: '16px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-l-regular)' },
  labelMMedium: { fontWeight: 500, fontSize: '14px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-m-medium)' },
  labelMRegular: { fontWeight: 400, fontSize: '14px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-m-regular)' },
  labelSSemiBold: { fontWeight: 600, fontSize: '12px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-s-semibold)' },
  labelSMedium: { fontWeight: 500, fontSize: '12px', lineHeight: '1.4', fontFamily: fontFamily.khmer, css: 'var(--text-label-s-medium)' },
  paragraphM: { fontWeight: 400, fontSize: '16px', lineHeight: '1.5', fontFamily: fontFamily.khmer, css: 'var(--text-paragraph-m)' },
  paragraphS: { fontWeight: 400, fontSize: '14px', lineHeight: '1.43', fontFamily: fontFamily.khmer, css: 'var(--text-paragraph-s)' },
  paragraphSMedium: { fontWeight: 500, fontSize: '14px', lineHeight: '1.43', fontFamily: fontFamily.khmer, css: 'var(--text-paragraph-s-medium)' },
  paragraphXs: { fontWeight: 400, fontSize: '12px', lineHeight: '1.67', fontFamily: fontFamily.khmer, css: 'var(--text-paragraph-xs)' },

  // Inter (Latin / numbers)
  interDisplay: { fontWeight: 500, fontSize: '52px', lineHeight: '1.16', fontFamily: fontFamily.latin, css: 'var(--text-inter-display)' },
  interLabelL: { fontWeight: 500, fontSize: '16px', lineHeight: '1.13', fontFamily: fontFamily.latin, css: 'var(--text-inter-label-l)' },
  interLabelM: { fontWeight: 500, fontSize: '14px', lineHeight: '1.14', fontFamily: fontFamily.latin, css: 'var(--text-inter-label-m)' },
  interLabelMSemiBold: { fontWeight: 600, fontSize: '14px', lineHeight: '1.14', fontFamily: fontFamily.latin, css: 'var(--text-inter-label-m-semibold)' },
  interParagraphXs: { fontWeight: 400, fontSize: '12px', lineHeight: '1.67', fontFamily: fontFamily.latin, css: 'var(--text-inter-paragraph-xs)' },

  // Roboto (secondary)
  robotoH6: { fontWeight: 600, fontSize: '18px', lineHeight: '1.33', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-h6)' },
  robotoLabelM: { fontWeight: 400, fontSize: '14px', lineHeight: '1.13', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-label-m)' },
  robotoLabelMMedium: { fontWeight: 500, fontSize: '14px', lineHeight: '1.13', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-label-m-medium)' },
  robotoLabelS: { fontWeight: 400, fontSize: '12px', lineHeight: '16px', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-label-s)' },
  robotoParagraphS: { fontWeight: 500, fontSize: '14px', lineHeight: '1.43', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-paragraph-s)' },
  robotoParagraphM: { fontWeight: 500, fontSize: '16px', lineHeight: '1.5', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-paragraph-m)' },
  robotoParagraphXs: { fontWeight: 400, fontSize: '12px', lineHeight: '1.67', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-paragraph-xs)' },
  robotoTitle1: { fontWeight: 600, fontSize: '16px', lineHeight: '1.4', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-title1)' },
  robotoTitle2: { fontWeight: 400, fontSize: '14px', lineHeight: '1.4', fontFamily: fontFamily.roboto, css: 'var(--text-roboto-title2)' },

  // SF Pro / iOS keyboard
  iosKey: { fontWeight: 400, fontSize: '17px', lineHeight: '22px', fontFamily: fontFamily.ios, css: 'var(--text-ios-key)' },
  iosCallout: { fontWeight: 590, fontSize: '16px', lineHeight: '21px', fontFamily: fontFamily.ios, css: 'var(--text-ios-callout)' },
  iosKeyChar: { fontWeight: 400, fontSize: '23px', lineHeight: '1', fontFamily: fontFamily.ios, css: 'var(--text-ios-key-char)' },
  iosKeySub: { fontWeight: 400, fontSize: '16px', lineHeight: '1', fontFamily: fontFamily.ios, css: 'var(--text-ios-key-sub)' },
} as const satisfies Record<string, TextStyle>;

export type TextToken = keyof typeof text;

// =============================================================================
// Letter spacing
// =============================================================================

export const letterSpacing = {
  tight: 'var(--letter-spacing-tight)',
  ios: 'var(--letter-spacing-ios)',
  normal: 'var(--letter-spacing-normal)',
} as const;

// =============================================================================
// Spacing tokens
// =============================================================================

export const spacing = {
  '3xs': 'var(--spacing-3xs)',
  '2xs': 'var(--spacing-2xs)',
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
  '3xl': 'var(--spacing-3xl)',
  '4xl': 'var(--spacing-4xl)',
  '5xl': 'var(--spacing-5xl)',
  pageX: 'var(--spacing-page-x)',
} as const;

export type SpacingToken = keyof typeof spacing;

// =============================================================================
// Layout tokens
// =============================================================================

export const layout = {
  contentWidth: 'var(--content-width)',
  frameWidth: 'var(--frame-width)',
  frameHeight: 'var(--frame-height)',
  buttonHeightSm: 'var(--button-height-sm)',
  buttonHeightBase: 'var(--button-height-base)',
  buttonHeightLg: 'var(--button-height-lg)',
  bottomSheetRadius: 'var(--bottom-sheet-radius)',
  safeAreaTop: 'var(--safe-area-top)',
  safeAreaBottom: 'var(--safe-area-bottom)',
} as const;

// =============================================================================
// Shadow tokens (7 named + container + mini-apps)
// =============================================================================

export const shadow = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  lgTop: 'var(--shadow-lg-top)',
  xl: 'var(--shadow-xl)',
  container: 'var(--shadow-container)',
  miniApps: 'var(--shadow-mini-apps)',
  brandM: 'var(--shadow-brand-m)',
} as const;

export type ShadowToken = keyof typeof shadow;

// =============================================================================
// Border radius tokens
// =============================================================================

export const radius = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
  phoneFrame: 'var(--radius-phone-frame)',
  bottomSheet: 'var(--radius-bottom-sheet)',
} as const;

export type RadiusToken = keyof typeof radius;

// =============================================================================
// Z-index tokens
// =============================================================================

export const zIndex = {
  base: 'var(--z-base)',
  content: 'var(--z-content)',
  sticky: 'var(--z-sticky)',
  header: 'var(--z-header)',
  bottomSheet: 'var(--z-bottom-sheet)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
  toast: 'var(--z-toast)',
  tooltip: 'var(--z-tooltip)',
} as const;

// =============================================================================
// Blur / backdrop tokens
// =============================================================================

export const blur = {
  xs: 'var(--blur-xs)',
  ios: 'var(--blur-ios)',
  lg: 'var(--blur-lg)',
  md: 'var(--blur-md)',
  sm: 'var(--blur-sm)',
} as const;

// =============================================================================
// Transition tokens
// =============================================================================

export const transition = {
  fast: 'var(--transition-fast)',
  base: 'var(--transition-base)',
  slow: 'var(--transition-slow)',
  sheet: 'var(--transition-sheet)',
} as const;

// =============================================================================
// Aggregate theme (single import surface)
// =============================================================================

export const theme = {
  color,
  gradient,
  fontFamily,
  fontWeight,
  fontSize,
  text,
  letterSpacing,
  spacing,
  layout,
  shadow,
  radius,
  zIndex,
  blur,
  transition,
} as const;

export type Theme = typeof theme;
