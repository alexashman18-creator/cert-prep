import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { SAMPLE_CONTENT_NOTICE } from '@/data/sampleQuestions';
import { useHomeData } from '@/hooks/useHomeData';
import { useStartExam } from '@/hooks/useExamSession';
import { formatCount, formatPercent } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { data, error, refresh } = useHomeData();
  const startExam = useStartExam();
  const [startingExam, setStartingExam] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openExam = async () => {
    setStartingExam(true);
    setActionError(null);
    try {
      if (data?.inProgressExam) {
        router.push({ pathname: '/exam/session', params: { id: data.inProgressExam.id } });
        return;
      }
      if ((data?.questionBankSize ?? 0) === 0) {
        setActionError('No questions are available for a mock exam yet.');
        return;
      }
      const session = await startExam();
      router.push({ pathname: '/exam/session', params: { id: session.id } });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to start a mock exam.');
    } finally {
      setStartingExam(false);
    }
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
            Your previous exam is saved locally, including answers, flags, and remaining time.
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
          subtitle="40 questions · 45-minute timer"
          onPress={() => void openExam()}
          disabled={startingExam}
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
          {SAMPLE_CONTENT_NOTICE}
          {data ? ` Question bank: ${data.questionBankSize} development samples.` : ''}
        </AppText>
      </Card>
      {error || actionError ? (
        <AppText variant="caption" color={colors.danger}>
          {actionError ?? error}
        </AppText>
      ) : null}
    </Screen>
  );
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
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card>
        <View style={styles.actionRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.actionCopy}>
            <AppText variant="subtitle">{title}</AppText>
            <AppText variant="body" color={colors.inkSecondary}>
              {subtitle}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.inkTertiary} />
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
