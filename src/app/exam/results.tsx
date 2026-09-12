import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ResultsSummary } from '@/components/results/ResultsSummary';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useExamResults } from '@/hooks/useExamSession';
import { colors, spacing } from '@/theme/tokens';

export default function ExamResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { results, error } = useExamResults(id);

  if (error || !results) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Results unavailable" body={error ?? 'This exam has no results yet.'} />
        <AppButton label="Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <ResultsSummary
        results={results}
        caption="Percentage accuracy for this practice exam. This is not a Microsoft 700/1000 scaled score."
      />
      <AppText variant="caption" color={colors.inkSecondary} style={styles.note}>
        Microsoft’s official AZ-900 score is scaled. A 70% raw score here is not equivalent to 700.
      </AppText>
      <View style={styles.actions}>
        <AppButton
          label="Review Answers"
          onPress={() => router.push({ pathname: '/exam/review', params: { id: results.sessionId } })}
        />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
