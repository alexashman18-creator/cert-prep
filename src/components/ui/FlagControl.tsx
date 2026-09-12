import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface FlagControlProps {
  flagged: boolean;
  onPress: () => void;
  label?: string;
}

export function FlagControl({ flagged, onPress, label }: FlagControlProps) {
  const text = label ?? (flagged ? 'Flagged for review' : 'Flag for review');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: flagged }}
      accessibilityLabel={flagged ? 'Remove review flag' : 'Flag for review'}
      hitSlop={8}
      style={[styles.flag, flagged && styles.flagged]}>
      <Ionicons
        name={flagged ? 'flag' : 'flag-outline'}
        size={16}
        color={flagged ? colors.flag : colors.inkSecondary}
      />
      <AppText variant="bodyStrong" color={flagged ? colors.flag : colors.inkSecondary}>
        {text}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flagged: {
    backgroundColor: colors.warningSoft,
    borderColor: '#E8C39A',
  },
});
