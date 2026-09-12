import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { FeedbackPanel } from '@/components/question/FeedbackPanel';
import { QuestionPrompt } from '@/components/question/QuestionPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlagControl } from '@/components/ui/FlagControl';
import { Screen } from '@/components/ui/Screen';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { firstParam } from '@/lib/searchParams';
import { spacing } from '@/theme/tokens';

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = firstParam(params.id);
  const {
    session,
    questions,
    currentQuestion,
    selectedOptionId,
    submitted,
    selectOption,
    submit,
    goToIndex,
    complete,
    toggleFlag,
    flaggedIds,
    error,
    busy,
  } = usePracticeSession(id);

  useEffect(() => {
    if (session?.status === 'completed') {
      router.replace({ pathname: '/practice/results', params: { id: session.id } });
    }
  }, [session]);

  if (error) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Unable to open practice" body={error} icon="alert-circle-outline" />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Loading practice" body="Restoring your local session." icon="sync-outline" />
      </Screen>
    );
  }

  const isLast = session.currentIndex >= questions.length - 1;
  const flagged = flaggedIds.includes(currentQuestion.id);

  const next = async () => {
    if (!submitted) {
      return;
    }
    if (isLast) {
      await complete();
      router.replace({ pathname: '/practice/results', params: { id: session.id } });
      return;
    }
    await goToIndex(session.currentIndex + 1);
  };

  return (
    <Screen
      edges={['right', 'bottom', 'left']}
      contentStyle={styles.content}
      footer={
        <>
          {!submitted ? (
            <AppButton
              label="Submit answer"
              icon="checkmark"
              onPress={() => void submit()}
              disabled={!selectedOptionId || busy}
            />
          ) : (
            <AppButton
              label={isLast ? 'See results' : 'Next Question'}
              icon={isLast ? 'stats-chart-outline' : 'arrow-forward'}
              onPress={() => void next()}
            />
          )}
          <AppButton label="Home" variant="ghost" onPress={() => router.replace('/')} />
        </>
      }>
      <QuestionPrompt
        question={currentQuestion}
        index={session.currentIndex}
        total={questions.length}
        selectedOptionId={selectedOptionId}
        submitted={submitted}
        onSelect={selectOption}
      />

      <FlagControl
        flagged={flagged}
        onPress={() => void toggleFlag()}
        label={flagged ? 'Flagged for review' : 'Flag Question'}
      />

      {submitted && selectedOptionId ? (
        <FeedbackPanel question={currentQuestion} selectedOptionId={selectedOptionId} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
  },
});
