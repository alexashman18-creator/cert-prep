import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { DOMAIN_SHORT_LABELS, type DomainId } from '@/types/domain';
import { colors, radii, spacing } from '@/theme/tokens';

interface DomainBadgeProps {
  domain: DomainId;
}

export function DomainBadge({ domain }: DomainBadgeProps) {
  return (
    <View style={styles.badge}>
      <AppText variant="label" color={colors.accent}>
        {DOMAIN_SHORT_LABELS[domain].toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
