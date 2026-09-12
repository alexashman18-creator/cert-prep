import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  background: '#F3F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0F6',
  ink: '#12263A',
  inkSecondary: '#4A5D73',
  inkTertiary: '#7A8B9C',
  border: '#D7E0EA',
  accent: '#0B5CAB',
  accentPressed: '#094A89',
  accentSoft: '#E6F0F8',
  success: '#1B7F4E',
  successSoft: '#E6F6EE',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#B54708',
  warningSoft: '#FEF4E6',
  flag: '#9A3412',
  navy: '#0F2A44',
  overlay: 'rgba(18, 38, 58, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
  },
} as const;

export const shadows: Record<'card' | 'raised', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0 6px 16px rgba(18, 38, 58, 0.06)' },
    default: {
      shadowColor: '#12263A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
  })!,
  raised: Platform.select<ViewStyle>({
    web: { boxShadow: '0 10px 20px rgba(18, 38, 58, 0.08)' },
    default: {
      shadowColor: '#12263A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 5,
    },
  })!,
};

export const layout = {
  maxContentWidth: 560,
  screenPadding: spacing.xl,
} as const;
