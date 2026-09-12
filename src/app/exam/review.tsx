import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FeedbackPanel } from '@/components/question/FeedbackPanel';
import { QuestionPrompt } from '@/components/question/QuestionPrompt';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useExamResults } from '@/hooks/useExamSession';
import { firstParam } from '@/lib/searchParams';
import { colors, spacing } from '@/theme/tokens';

export default function ExamReviewScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = firstParam(params.id);
  const { results, questions, answersByQuestionId, error } = useExamResults(id);

  if (!results && !error) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Loading review" body="Restoring your answers and explanations." />
      </Screen>
    );
  }

  if (error || !results) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Review unavailable" body={error ?? 'This exam could not be loaded.'} />
      </Screen>
    );
  }

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <AppText variant="body" color={colors.inkSecondary} style={styles.intro}>
        Review every item from this mock exam. Correct answers are shown because the exam is complete.
      </AppText>
      <View style={styles.list}>
        {questions.map((question, index) => {
          const selected = answersByQuestionId[question.id] ?? null;
          return (
            <View key={question.id} style={styles.item}>
              <QuestionPrompt
                question={question}
                index={index}
                total={questions.length}
                selectedOptionId={selected}
                submitted
                disabled
                onSelect={() => undefined}
              />
              {selected ? <FeedbackPanel question={question} selectedOptionId={selected} /> : (
                <AppText variant="caption" color={colors.warning}>
                  You did not answer this question.
                </AppText>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.huge,
  },
  item: {
    gap: spacing.md,
  },
});
