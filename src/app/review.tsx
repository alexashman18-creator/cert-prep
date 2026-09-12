import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { DomainBadge } from '@/components/ui/DomainBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useRepositories } from '@/hooks/useRepositories';
import { useStartMistakePractice } from '@/hooks/usePracticeSession';
import type { Question } from '@/types/question';
import type { MistakeRecord } from '@/types/session';
import { colors, spacing } from '@/theme/tokens';

export default function ReviewMistakesScreen() {
  const repos = useRepositories();
  const startMistakes = useStartMistakePractice();
  const [items, setItems] = useState<{ mistake: MistakeRecord; question: Question }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const mistakes = await repos.mistakes.list();
    const questions = await repos.questions.getByIds(mistakes.map((item) => item.questionId));
    const byId = new Map(questions.map((question) => [question.id, question]));
    setItems(
      mistakes.flatMap((mistake) => {
        const question = byId.get(mistake.questionId);
        return question ? [{ mistake, question }] : [];
      }),
    );
    setLoaded(true);
  }, [repos]);

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Unable to load mistakes.');
      setLoaded(true);
    });
  }, [load]);

  const start = async () => {
    setBusy(true);
    try {
      const session = await startMistakes();
      router.replace({ pathname: '/practice/session', params: { id: session.id } });
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState
          title="Loading mistakes"
          body="Checking your locally saved incorrect answers."
          icon="sync-outline"
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Unable to load mistakes" body={error} icon="alert-circle-outline" />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState
          title="No mistakes saved yet"
          body="Incorrect practice and exam answers are stored locally so you can retry them here."
          icon="checkmark-circle-outline"
        />
        <AppButton
          label="Start practice"
          icon="book-outline"
          onPress={() => router.push('/practice/setup')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <AppText variant="body" color={colors.inkSecondary} style={styles.intro}>
        These question IDs were persisted after incorrect answers. Practice them offline at any time.
      </AppText>
      <AppButton
        label={`Practice missed questions (${items.length})`}
        icon="refresh-outline"
        onPress={() => void start()}
        disabled={busy}
      />
      <View style={styles.list}>
        {items.map(({ mistake, question }) => (
          <Card key={question.id}>
            <DomainBadge domain={question.domain} />
            <AppText variant="bodyStrong" style={styles.prompt}>
              {question.questionText}
            </AppText>
            <AppText variant="caption" color={colors.inkSecondary}>
              Missed {mistake.timesMissed} time{mistake.timesMissed === 1 ? '' : 's'}
            </AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  prompt: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
