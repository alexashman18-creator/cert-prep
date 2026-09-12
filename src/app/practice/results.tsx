import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ResultsSummary } from '@/components/results/ResultsSummary';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { usePracticeResults, useStartPractice, useStartSessionMistakePractice } from '@/hooks/usePracticeSession';
import { firstParam } from '@/lib/searchParams';
import { colors, spacing } from '@/theme/tokens';
import type { PracticeDomainFilter } from '@/types/session';

export default function PracticeResultsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = firstParam(params.id);
  const { results, error, domainFilter, missedQuestionIds } = usePracticeResults(id);
  const startPractice = useStartPractice();
  const startSessionMistakes = useStartSessionMistakePractice();

  const practiceAgain = async () => {
    try {
      const session = await startPractice({
        domainFilter: domainFilter as PracticeDomainFilter,
        requestedCount: results?.total ?? 10,
      });
      router.replace({ pathname: '/practice/session', params: { id: session.id } });
    } catch {
      router.push('/practice/setup');
    }
  };

  const reviewMistakes = async () => {
    if (!id || missedQuestionIds.length === 0) {
      return;
    }
    try {
      const session = await startSessionMistakes(id);
      router.replace({ pathname: '/practice/session', params: { id: session.id } });
    } catch {
      router.push('/review');
    }
  };

  if (!results && !error) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Loading results" body="Calculating your practice performance." />
      </Screen>
    );
  }

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
        <AppText variant="caption" color={colors.inkSecondary}>
          Review Mistakes here covers only this session. All outstanding misses stay in Review
          Mistakes on Home.
        </AppText>
        <AppButton
          label={
            missedQuestionIds.length > 0
              ? `Review these mistakes (${missedQuestionIds.length})`
              : 'Review Mistakes'
          }
          onPress={() => void reviewMistakes()}
          disabled={missedQuestionIds.length === 0}
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
