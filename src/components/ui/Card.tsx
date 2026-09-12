import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme/tokens';

export type CardTone = 'default' | 'muted' | 'accent' | 'success' | 'danger' | 'warning' | 'navy';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  muted?: boolean;
  tone?: CardTone;
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padded = true,
  muted = false,
  tone = muted ? 'muted' : 'default',
  elevated = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        styles[tone],
        elevated && shadows.raised,
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    ...shadows.none,
  },
  accent: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentSoft,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#C7E8D4',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F4C7C3',
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: '#F3D7B0',
  },
  navy: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
    ...shadows.raised,
  },
  padded: {
    padding: spacing.xl,
  },
});
