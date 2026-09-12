import { Ionicons } from '@expo/vector-icons';
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
      <Ionicons
        name="time-outline"
        size={16}
        color={urgent ? colors.danger : colors.navy}
      />
      <AppText variant="bodyStrong" color={urgent ? colors.danger : colors.navy}>
        {formatCountdown(remainingSeconds)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navySoft,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  urgent: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F4C7C3',
  },
});
