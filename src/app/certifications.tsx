import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  certificationTitle,
  listAvailableCertifications,
  listComingSoonCertifications,
  type Certification,
} from '@/certifications';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { HeroPanel } from '@/components/ui/HeroPanel';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/constants/product';
import { useSelectedCertification } from '@/hooks/useSelectedCertification';
import { colors, radii, spacing } from '@/theme/tokens';

export default function CertificationsScreen() {
  const { certification, select, error } = useSelectedCertification();
  const available = listAvailableCertifications();
  const comingSoon = listComingSoonCertifications();

  const choose = async (item: Certification) => {
    if (item.status !== 'available') {
      return;
    }
    await select(item.id);
    router.replace('/');
  };

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <HeroPanel style={styles.hero}>
        <AppText variant="label" color={colors.inkOnAccent}>
          {PRODUCT_NAME.toUpperCase()}
        </AppText>
        <AppText variant="display" color={colors.inkOnAccent}>
          Choose a certification
        </AppText>
        <AppText variant="body" color="rgba(247, 251, 255, 0.82)">
          {PRODUCT_TAGLINE} AZ-900 is ready now. Other tracks stay visible until their verified
          question banks are added.
        </AppText>
      </HeroPanel>

      <View style={styles.section}>
        <SectionHeader title="Available now" subtitle="Uses the shared practice and mock-exam engine" />
        {available.map((item) => (
          <AvailableCard
            key={item.id}
            certification={item}
            selected={certification?.id === item.id}
            onPress={() => void choose(item)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Coming soon"
          subtitle="Catalog only — no empty practice sessions"
        />
        <Card>
          <View style={styles.comingList}>
            {comingSoon.map((item, index) => (
              <ComingSoonRow key={item.id} certification={item} last={index === comingSoon.length - 1} />
            ))}
          </View>
        </Card>
      </View>

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

function AvailableCard({
  certification,
  selected,
  onPress,
}: {
  certification: Certification;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${certificationTitle(certification)}. ${selected ? 'Currently selected. ' : ''}Open study dashboard.`}>
      <Card elevated tone="accent">
        <View style={styles.availableRow}>
          <View style={styles.availableCopy}>
            <View style={styles.badge}>
              <AppText variant="label" color={colors.accent}>
                {certification.examCode}
              </AppText>
            </View>
            <AppText variant="subtitle">{certificationTitle(certification)}</AppText>
            <AppText variant="body" color={colors.inkSecondary}>
              {certification.description}
            </AppText>
            <AppText variant="caption" color={colors.inkTertiary}>
              {certification.mockExam
                ? `Mock exam target: ${certification.mockExam.targetQuestionCount} unique questions · ${certification.mockExam.examDurationMinutes}-minute timer`
                : 'Study track ready'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.inkTertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

function ComingSoonRow({
  certification,
  last,
}: {
  certification: Certification;
  last: boolean;
}) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${certificationTitle(certification)}. Coming soon.`}
      style={[styles.comingRow, !last && styles.comingDivider]}>
      <View style={styles.comingCopy}>
        <AppText variant="bodyStrong">{certification.examCode}</AppText>
        <AppText variant="caption" color={colors.inkSecondary}>
          {certification.displayName}
        </AppText>
      </View>
      <View style={styles.soonBadge}>
        <AppText variant="label" color={colors.inkTertiary}>
          COMING SOON
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  availableCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  comingList: {
    gap: 0,
  },
  comingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.md,
  },
  comingDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  comingCopy: {
    flex: 1,
    gap: 2,
  },
  soonBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
