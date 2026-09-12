import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { domainLabel, domainShortLabel, type DomainId } from '@/types/domain';
import { domainTheme, radii, spacing } from '@/theme/tokens';

interface DomainBadgeProps {
  domain: DomainId;
  certificationId?: string;
}

export function DomainBadge({ domain, certificationId }: DomainBadgeProps) {
  const theme = domainTheme(domain);
  return (
    <View
      style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}
      accessibilityRole="text"
      accessibilityLabel={domainLabel(domain, certificationId)}>
      <AppText variant="label" color={theme.fg}>
        {domainShortLabel(domain, certificationId).toUpperCase()}
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
