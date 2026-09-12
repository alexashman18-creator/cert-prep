import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { FeedbackPanel } from '@/components/question/FeedbackPanel';
import { QuestionPrompt } from '@/components/question/QuestionPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { firstParam } from '@/lib/searchParams';
import { colors, spacing } from '@/theme/tokens';

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
        <EmptyState title="Unable to open practice" body={error} />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Loading practice" body="Restoring your local session." />
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
      footer={
        <>
          {!submitted ? (
            <AppButton
              label="Submit answer"
              onPress={() => void submit()}
              disabled={!selectedOptionId || busy}
            />
          ) : (
            <AppButton label={isLast ? 'See results' : 'Next Question'} onPress={() => void next()} />
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

      <Pressable
        onPress={() => void toggleFlag()}
        accessibilityRole="button"
        accessibilityState={{ selected: flagged }}
        accessibilityLabel={flagged ? 'Remove flag from question' : 'Flag question'}
        hitSlop={8}
        style={styles.flag}>
        <Ionicons
          name={flagged ? 'flag' : 'flag-outline'}
          size={18}
          color={flagged ? colors.flag : colors.inkSecondary}
        />
        <AppText variant="bodyStrong" color={flagged ? colors.flag : colors.inkSecondary}>
          {flagged ? 'Flagged for review' : 'Flag Question'}
        </AppText>
      </Pressable>

      {submitted && selectedOptionId ? (
        <FeedbackPanel question={currentQuestion} selectedOptionId={selectedOptionId} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
