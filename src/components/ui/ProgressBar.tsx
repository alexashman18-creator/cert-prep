import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';

type ProgressTone = 'accent' | 'navy' | 'success' | 'warning';
type ProgressSize = 'sm' | 'md';

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: ProgressTone;
  size?: ProgressSize;
}

const FILL: Record<ProgressTone, string> = {
  accent: colors.accent,
  navy: colors.navy,
  success: colors.success,
  warning: colors.warning,
};

export function ProgressBar({ value, max, tone = 'accent', size = 'md' }: ProgressBarProps) {
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <View
      style={[styles.track, size === 'sm' && styles.trackSm]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: FILL[tone] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  trackSm: {
    height: 6,
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
});
