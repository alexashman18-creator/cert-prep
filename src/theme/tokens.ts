import { Platform, type ViewStyle } from 'react-native';

import type { DomainId } from '@/types/domain';

export const colors = {
  background: '#E8EEF5',
  backgroundWarm: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#E4EDF5',
  surfaceNavy: '#0B2A4A',
  ink: '#10233A',
  inkSecondary: '#4A5F75',
  inkTertiary: '#7A8B9C',
  inkOnAccent: '#F7FBFF',
  border: '#D3DEE8',
  borderStrong: '#B7C7D6',
  accent: '#0A6CBD',
  accentPressed: '#085A9E',
  accentDeep: '#064A84',
  accentSoft: '#D9EAF8',
  accentMuted: '#EEF5FB',
  success: '#1B7F4E',
  successSoft: '#E5F6ED',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#9A4B0F',
  warningSoft: '#FEF4E6',
  flag: '#9A3412',
  navy: '#0B2A4A',
  navySoft: '#E4EAF1',
  overlay: 'rgba(11, 42, 74, 0.46)',
  heroOrb: 'rgba(10, 108, 189, 0.28)',
  heroOrbLight: 'rgba(255, 255, 255, 0.08)',
} as const;

export const domainThemes: Record<
  DomainId,
  { fg: string; bg: string; border: string }
> = {
  cloud_concepts: {
    fg: '#0A6CBD',
    bg: '#D9EAF8',
    border: '#B5D4EF',
  },
  architecture_services: {
    fg: '#0F6A6A',
    bg: '#E3F3F2',
    border: '#B9D9D7',
  },
  management_governance: {
    fg: '#5B4B8A',
    bg: '#EEEAF6',
    border: '#D0C8E4',
  },
};

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
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
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
    letterSpacing: 0.15,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },
} as const;

export const shadows: Record<'none' | 'card' | 'raised' | 'button', ViewStyle> = {
  none: Platform.select<ViewStyle>({
    web: { boxShadow: 'none' },
    default: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  })!,
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0 8px 20px rgba(16, 35, 58, 0.06)' },
    default: {
      shadowColor: '#10233A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 2,
    },
  })!,
  raised: Platform.select<ViewStyle>({
    web: { boxShadow: '0 12px 28px rgba(16, 35, 58, 0.1)' },
    default: {
      shadowColor: '#10233A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
  })!,
  button: Platform.select<ViewStyle>({
    web: { boxShadow: '0 6px 14px rgba(10, 108, 189, 0.22)' },
    default: {
      shadowColor: '#0A6CBD',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 3,
    },
  })!,
};

export const layout = {
  maxContentWidth: 560,
  screenPadding: spacing.xl,
} as const;
