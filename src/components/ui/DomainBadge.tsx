import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { DOMAIN_LABELS, DOMAIN_SHORT_LABELS, type DomainId } from '@/types/domain';
import { domainThemes, radii, spacing } from '@/theme/tokens';

interface DomainBadgeProps {
  domain: DomainId;
}

export function DomainBadge({ domain }: DomainBadgeProps) {
  const theme = domainThemes[domain];
  return (
    <View
      style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}
      accessibilityRole="text"
      accessibilityLabel={DOMAIN_LABELS[domain]}>
      <AppText variant="label" color={theme.fg}>
        {DOMAIN_SHORT_LABELS[domain].toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
