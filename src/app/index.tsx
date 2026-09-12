import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ChoiceDialog } from '@/components/ui/ChoiceDialog';
import { HeroPanel } from '@/components/ui/HeroPanel';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile } from '@/components/ui/StatTile';
import { certificationTitle } from '@/certifications';
import { PRODUCT_NAME } from '@/constants/product';
import { SAMPLE_CONTENT_NOTICE } from '@/data/sampleQuestions';
import { useHomeData, type HomeData } from '@/hooks/useHomeData';
import { useSelectedCertification } from '@/hooks/useSelectedCertification';
import { useStartExam } from '@/hooks/useExamSession';
import { mockExamSubtitle } from '@/lib/examCopy';
import { formatCount, formatPercent } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { certification, error: certificationError } = useSelectedCertification();
  const { data, error, refresh } = useHomeData(certification?.id ?? null);
  const startExam = useStartExam();
  const [startingExam, setStartingExam] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [examChoiceOpen, setExamChoiceOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const navigateToExam = async (forceNew = false) => {
    setStartingExam(true);
    setActionError(null);
    try {
      if ((data?.questionBankSize ?? 0) === 0) {
        setActionError('No questions are available for a mock exam yet.');
        return;
      }
      const session = await startExam({
        certificationId: certification?.id,
        forceNew,
      });
      router.push({ pathname: '/exam/session', params: { id: session.id } });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to start a mock exam.');
    } finally {
      setStartingExam(false);
      setExamChoiceOpen(false);
      setDiscardConfirmOpen(false);
    }
  };

  const openExam = () => {
    setActionError(null);
    if (!data) {
      return;
    }
    if (data.inProgressExam) {
      setExamChoiceOpen(true);
      return;
    }
    void navigateToExam(false);
  };

  const resumeExam = () => {
    if (!data?.inProgressExam) {
      return;
    }
    setExamChoiceOpen(false);
    router.push({ pathname: '/exam/session', params: { id: data.inProgressExam.id } });
  };

  return (
    <Screen>
      <HeroPanel style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <AppText variant="label" color={colors.inkOnAccent}>
              {certification?.examCode ?? PRODUCT_NAME}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/certifications')}
            accessibilityRole="button"
            accessibilityLabel="Browse certifications"
            style={styles.changeCert}>
            <AppText variant="label" color={colors.inkOnAccent}>
              CHANGE
            </AppText>
          </Pressable>
        </View>
        <AppText variant="display" color={colors.inkOnAccent}>
          {certification ? certificationTitle(certification) : PRODUCT_NAME}
        </AppText>
        <AppText variant="body" color="rgba(247, 251, 255, 0.82)">
          {certification?.description ?? 'Offline practice and timed mock exams, stored on this device.'}
        </AppText>
      </HeroPanel>

      <View style={styles.section}>
        <SectionHeader title="Your progress" subtitle="Saved on this device" />
        <View style={styles.stats}>
          <StatTile label="Questions answered" value={formatCount(data?.progress.questionsAnswered ?? 0)} />
          <StatTile
            label="Accuracy"
            value={data && data.progress.questionsAnswered > 0 ? formatPercent(data.accuracy) : '—'}
          />
          <StatTile
            label="Mock exam best"
            value={formatPercent(data?.progress.mockExamBestPercent ?? null)}
          />
        </View>
      </View>

      {data?.inProgressExam ? (
        <Card tone="accent" style={styles.resume}>
          <AppText variant="label" color={colors.accent}>
            IN PROGRESS
          </AppText>
          <AppText variant="subtitle">Resume mock exam</AppText>
          <AppText variant="body" color={colors.inkSecondary}>
            Your previous exam is saved locally, including answers, flags, and remaining time. The
            timer keeps running while the app is closed.
          </AppText>
          <AppButton
            label="Continue exam"
            icon="play"
            onPress={() =>
              router.push({ pathname: '/exam/session', params: { id: data.inProgressExam!.id } })
            }
          />
        </Card>
      ) : null}

      {data?.inProgressPractice ? (
        <Card style={styles.resume}>
          <AppText variant="label" color={colors.accent}>
            IN PROGRESS
          </AppText>
          <AppText variant="subtitle">Resume practice</AppText>
          <AppText variant="body" color={colors.inkSecondary}>
            {data.inProgressPractice.currentIndex >= data.inProgressPractice.questionCount - 1
              ? `You're on the last question of ${data.inProgressPractice.questionCount}.`
              : `Question ${data.inProgressPractice.currentIndex + 1} of ${data.inProgressPractice.questionCount} is waiting.`}
          </AppText>
          <AppButton
            label="Continue practice"
            variant="secondary"
            icon="play-outline"
            onPress={() =>
              router.push({
                pathname: '/practice/session',
                params: { id: data.inProgressPractice!.id },
              })
            }
          />
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Study" subtitle="Practice, sit a timed exam, or retry misses" />
        <View style={styles.actions}>
          <ActionCard
            icon="book-outline"
            title="Practice"
            subtitle="Choose a domain and session length"
            tone="practice"
            onPress={() => router.push('/practice/setup')}
          />
          <ActionCard
            icon="timer-outline"
            title="Mock Exam"
            subtitle={
              data && certification?.mockExam
                ? mockExamSubtitle(data.questionBankSize, certification.mockExam)
                : certification && !certification.mockExam
                  ? 'Mock exam configuration is not available yet'
                  : 'Loading available questions…'
            }
            tone="exam"
            onPress={openExam}
            disabled={startingExam || !data || !certification?.mockExam}
          />
          <ActionCard
            icon="refresh-outline"
            title="Review Mistakes"
            subtitle={
              data && data.mistakeCount > 0
                ? `${data.mistakeCount} saved question${data.mistakeCount === 1 ? '' : 's'}`
                : 'Practice questions you missed'
            }
            tone="review"
            badge={data && data.mistakeCount > 0 ? String(data.mistakeCount) : undefined}
            onPress={() => router.push('/review')}
          />
        </View>
      </View>

      <Card muted style={styles.notice}>
        <AppText variant="caption" color={colors.inkSecondary}>
          Local-first. Progress is stored on this device and works offline.
          {'\n'}
          {data && data.developmentQuestionCount > 0 ? `${SAMPLE_CONTENT_NOTICE}\n` : ''}
          {data ? questionBankNotice(data) : ''}
        </AppText>
      </Card>
      {error || actionError || certificationError ? (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {actionError ?? error ?? certificationError}
        </AppText>
      ) : null}

      <ChoiceDialog
        visible={examChoiceOpen}
        title="Unfinished mock exam"
        body="You already have an exam in progress on this device. The timer continues while the app is closed."
        onCancel={() => setExamChoiceOpen(false)}
        actions={[
          { label: 'Resume Exam', variant: 'primary', onPress: resumeExam },
          {
            label: 'Start New Exam',
            variant: 'secondary',
            onPress: () => {
              setExamChoiceOpen(false);
              setDiscardConfirmOpen(true);
            },
          },
        ]}
      />
      <ChoiceDialog
        visible={discardConfirmOpen}
        title="Discard unfinished exam?"
        body="Starting a new exam abandons the current one. Saved answers, flags, and remaining time for that attempt will not be kept."
        onCancel={() => setDiscardConfirmOpen(false)}
        actions={[
          {
            label: 'Start New Exam',
            variant: 'danger',
            onPress: () => void navigateToExam(true),
          },
        ]}
      />
    </Screen>
  );
}

function questionBankNotice(data: HomeData): string {
  if (data.verifiedQuestionCount > 0 && data.developmentQuestionCount > 0) {
    return `Eligible bank: ${data.verifiedQuestionCount} verified + ${data.developmentQuestionCount} development.`;
  }
  if (data.verifiedQuestionCount > 0) {
    return `Question bank: ${data.verifiedQuestionCount} verified questions.`;
  }
  if (data.developmentQuestionCount > 0) {
    return `Question bank: ${data.developmentQuestionCount} development samples.`;
  }
  return 'No eligible questions are available in this build.';
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  tone,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  tone: 'practice' | 'exam' | 'review';
  badge?: string;
}) {
  const iconWrap = {
    practice: { backgroundColor: colors.accentSoft, color: colors.accent },
    exam: { backgroundColor: colors.navy, color: colors.inkOnAccent },
    review: { backgroundColor: colors.warningSoft, color: colors.flag },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card elevated={tone === 'exam'}>
        <View style={styles.actionRow}>
          <View
            style={[styles.iconWrap, { backgroundColor: iconWrap.backgroundColor }]}
            importantForAccessibility="no-hide-descendants">
            <Ionicons name={icon} size={22} color={iconWrap.color} />
          </View>
          <View style={styles.actionCopy}>
            <View style={styles.actionTitleRow}>
              <AppText variant="subtitle">{title}</AppText>
              {badge ? (
                <View style={styles.badge}>
                  <AppText variant="label" color={colors.flag}>
                    {badge}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="body" color={colors.inkSecondary}>
              {subtitle}
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.inkTertiary}
            style={styles.actionChevron}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xxl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeCert: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 52,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  actionChevron: {
    alignSelf: 'center',
  },
  resume: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  notice: {
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
});
