import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ResultsSummary } from '@/components/results/ResultsSummary';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { usePracticeResults, useStartMistakePractice, useStartPractice } from '@/hooks/usePracticeSession';
import { spacing } from '@/theme/tokens';
import type { PracticeDomainFilter } from '@/types/session';

export default function PracticeResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { results, error, domainFilter } = usePracticeResults(id);
  const startPractice = useStartPractice();
  const startMistakes = useStartMistakePractice();

  const practiceAgain = async () => {
    const session = await startPractice({
      domainFilter: domainFilter as PracticeDomainFilter,
      requestedCount: results?.total ?? 10,
    });
    router.replace({ pathname: '/practice/session', params: { id: session.id } });
  };

  const reviewMistakes = async () => {
    if (!results || results.incorrect === 0) {
      router.push('/review');
      return;
    }
    const session = await startMistakes();
    router.replace({ pathname: '/practice/session', params: { id: session.id } });
  };

  if (error || !results) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Results unavailable" body={error ?? 'This session has no results yet.'} />
        <AppButton label="Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <ResultsSummary
        results={results}
        caption={`${results.correct} of ${results.total} correct. This is practice performance, not a Microsoft scaled score.`}
      />
      <View style={styles.actions}>
        <AppButton
          label="Review Mistakes"
          onPress={() => void reviewMistakes()}
          disabled={results.incorrect === 0}
        />
        <AppButton label="Practice Again" variant="secondary" onPress={() => void practiceAgain()} />
        <AppButton label="Home" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
