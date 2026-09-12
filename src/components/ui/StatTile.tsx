import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

type StatTone = 'default' | 'success' | 'danger' | 'muted';

interface StatTileProps {
  label: string;
  value: string;
  tone?: StatTone;
}

const VALUE_COLOR: Record<StatTone, string> = {
  default: colors.navy,
  success: colors.success,
  danger: colors.danger,
  muted: colors.inkSecondary,
};

export function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  return (
    <View
      style={[styles.tile, styles[tone]]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title" color={VALUE_COLOR[tone]} maxFontSizeMultiplier={1.3} align="center">
        {value}
      </AppText>
      <AppText variant="caption" color={colors.inkSecondary} align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 92,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#C7E8D4',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F4C7C3',
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
});
