import { Platform, TextStyle } from 'react-native';

// System font configuration
export const FONT_FAMILY = Platform.OS === 'ios' ? 'System' : 'Roboto';

// Font weights
export const FONT_WEIGHTS = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Letter spacing
export const LETTER_SPACING = {
  normal: 0,
  heading: -0.32, // -0.02em converted to absolute (assuming 16px base)
  button: -0.32,
};

// Typography styles
export const typography = {
  // Body text styles
  body: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  // Heading styles
  h1: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 32,
    letterSpacing: LETTER_SPACING.heading,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 24,
    letterSpacing: LETTER_SPACING.heading,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 20,
    letterSpacing: LETTER_SPACING.heading,
  },
  h4: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 18,
    letterSpacing: LETTER_SPACING.heading,
  },
  
  // Button styles
  button: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 16,
    letterSpacing: LETTER_SPACING.button,
  },
  buttonLarge: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 18,
    letterSpacing: LETTER_SPACING.button,
  },
  
  // Label styles
  label: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 14,
  },
  
  // Caption styles
  caption: {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: 12,
  },
};
