import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ChoiceDialog } from '@/components/ui/ChoiceDialog';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { SAMPLE_CONTENT_NOTICE } from '@/data/sampleQuestions';
import { useHomeData, type HomeData } from '@/hooks/useHomeData';
import { useStartExam } from '@/hooks/useExamSession';
import { mockExamSubtitle } from '@/lib/examCopy';
import { formatCount, formatPercent } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { data, error, refresh } = useHomeData();
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
      const session = await startExam({ forceNew });
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
      <View style={styles.hero}>
        <AppText variant="label" color={colors.accent}>
          AZ-900
        </AppText>
        <AppText variant="display">AZ-900 Prep</AppText>
        <AppText variant="body" color={colors.inkSecondary}>
          Master Microsoft Azure Fundamentals
        </AppText>
      </View>

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

      {data?.inProgressExam ? (
        <Card style={styles.resume}>
          <AppText variant="subtitle">Resume mock exam</AppText>
          <AppText variant="body" color={colors.inkSecondary}>
            Your previous exam is saved locally, including answers, flags, and remaining time. The
            timer keeps running while the app is closed.
          </AppText>
          <AppButton
            label="Continue exam"
            onPress={() =>
              router.push({ pathname: '/exam/session', params: { id: data.inProgressExam!.id } })
            }
          />
        </Card>
      ) : null}

      {data?.inProgressPractice ? (
        <Card style={styles.resume}>
          <AppText variant="subtitle">Resume practice</AppText>
          <AppText variant="body" color={colors.inkSecondary}>
            {data.inProgressPractice.currentIndex >= data.inProgressPractice.questionCount - 1
              ? `You're on the last question of ${data.inProgressPractice.questionCount}.`
              : `Question ${data.inProgressPractice.currentIndex + 1} of ${data.inProgressPractice.questionCount} is waiting.`}
          </AppText>
          <AppButton
            label="Continue practice"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/practice/session',
                params: { id: data.inProgressPractice!.id },
              })
            }
          />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <ActionCard
          icon="book-outline"
          title="Practice"
          subtitle="Choose a domain and session length"
          onPress={() => router.push('/practice/setup')}
        />
        <ActionCard
          icon="timer-outline"
          title="Mock Exam"
          subtitle={
            data ? mockExamSubtitle(data.questionBankSize) : 'Loading available questions…'
          }
          onPress={openExam}
          disabled={startingExam || !data}
        />
        <ActionCard
          icon="refresh-outline"
          title="Review Mistakes"
          subtitle={
            data && data.mistakeCount > 0
              ? `${data.mistakeCount} saved question${data.mistakeCount === 1 ? '' : 's'}`
              : 'Practice questions you missed'
          }
          onPress={() => router.push('/review')}
        />
      </View>

      <Card muted style={styles.notice}>
        <AppText variant="caption" color={colors.inkSecondary}>
          Local-first. Progress is stored on this device and works offline.
          {'\n'}
          {data && data.developmentQuestionCount > 0 ? `${SAMPLE_CONTENT_NOTICE}\n` : ''}
          {data ? questionBankNotice(data) : ''}
        </AppText>
      </Card>
      {error || actionError ? (
        <AppText variant="caption" color={colors.danger}>
          {actionError ?? error}
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card>
        <View style={styles.actionRow}>
          <View style={styles.iconWrap} importantForAccessibility="no-hide-descendants">
            <Ionicons name={icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.actionCopy}>
            <AppText variant="subtitle">{title}</AppText>
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
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionChevron: {
    alignSelf: 'center',
  },
  resume: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  notice: {
    marginTop: spacing.xxl,
  },
  pressed: {
    opacity: 0.88,
  },
});
