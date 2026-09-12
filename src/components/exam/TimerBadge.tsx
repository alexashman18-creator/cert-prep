import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatCountdown } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';

interface TimerBadgeProps {
  remainingSeconds: number;
}

export function TimerBadge({ remainingSeconds }: TimerBadgeProps) {
  const urgent = remainingSeconds <= 5 * 60;
  return (
    <View
      style={[styles.badge, urgent && styles.urgent]}
      accessibilityRole="timer"
      accessibilityLabel={`${urgent ? 'Less than five minutes remaining. ' : ''}Exam timer ${formatCountdown(remainingSeconds)}. The timer keeps running if you leave the app.`}>
      <AppText variant="bodyStrong" color={urgent ? colors.danger : colors.navy}>
        {formatCountdown(remainingSeconds)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  urgent: {
    backgroundColor: colors.dangerSoft,
  },
});
