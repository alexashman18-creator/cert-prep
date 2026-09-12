import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, layout, radii, spacing } from '@/theme/tokens';

interface HeroPanelProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function HeroPanel({ children, style }: HeroPanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.orbLarge} />
      <View style={styles.orbSmall} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: spacing.xxl,
    minHeight: 168,
    justifyContent: 'flex-end',
  },
  content: {
    gap: spacing.sm,
    maxWidth: layout.maxContentWidth,
    zIndex: 1,
  },
  orbLarge: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: colors.heroOrb,
    pointerEvents: 'none',
  },
  orbSmall: {
    position: 'absolute',
    bottom: -42,
    left: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.heroOrbLight,
    pointerEvents: 'none',
  },
});
