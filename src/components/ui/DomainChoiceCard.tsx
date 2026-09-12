import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { DOMAIN_LABELS, DOMAIN_SUMMARIES, type DomainId } from '@/types/domain';
import type { PracticeDomainFilter } from '@/types/session';
import { colors, domainThemes, radii, spacing } from '@/theme/tokens';

const ICONS: Record<PracticeDomainFilter, keyof typeof Ionicons.glyphMap> = {
  all: 'apps-outline',
  cloud_concepts: 'cloud-outline',
  architecture_services: 'server-outline',
  management_governance: 'shield-checkmark-outline',
};

interface DomainChoiceCardProps {
  domain: PracticeDomainFilter;
  selected: boolean;
  onPress: () => void;
}

export function DomainChoiceCard({ domain, selected, onPress }: DomainChoiceCardProps) {
  const theme =
    domain === 'all'
      ? { fg: colors.navy, bg: colors.navySoft, border: colors.borderStrong }
      : domainThemes[domain as DomainId];
  const title = domain === 'all' ? 'All Domains' : DOMAIN_LABELS[domain];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${DOMAIN_SUMMARIES[domain]}`}
      style={[styles.card, selected && { borderColor: theme.fg, backgroundColor: theme.bg }]}>
      <View style={[styles.icon, { backgroundColor: selected ? colors.surface : theme.bg }]}>
        <Ionicons name={ICONS[domain]} size={20} color={theme.fg} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color={colors.inkSecondary}>
          {DOMAIN_SUMMARIES[domain]}
        </AppText>
      </View>
      <View style={[styles.radio, selected && { borderColor: theme.fg, backgroundColor: theme.fg }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});
