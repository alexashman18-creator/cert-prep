import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  muted?: boolean;
}

export function Card({ children, style, padded = true, muted = false }: CardProps) {
  return (
    <View style={[styles.card, muted && styles.muted, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  padded: {
    padding: spacing.xl,
  },
});
