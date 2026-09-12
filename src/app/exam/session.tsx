import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { QuestionNavigator } from '@/components/exam/QuestionNavigator';
import { TimerBadge } from '@/components/exam/TimerBadge';
import { QuestionPrompt } from '@/components/question/QuestionPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlagControl } from '@/components/ui/FlagControl';
import { Screen } from '@/components/ui/Screen';
import { useExamSession } from '@/hooks/useExamSession';
import { firstParam } from '@/lib/searchParams';
import { useUiStore } from '@/stores/uiStore';
import { colors, radii, spacing } from '@/theme/tokens';

export default function ExamSessionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = firstParam(params.id);
  const navigatorOpen = useUiStore((state) => state.examNavigatorOpen);
  const setNavigatorOpen = useUiStore((state) => state.setExamNavigatorOpen);
  const {
    session,
    questions,
    currentQuestion,
    answers,
    flaggedIds,
    remainingSeconds,
    selectedOptionId,
    saveSelection,
    goToIndex,
    toggleFlag,
    finalize,
    expired,
    alreadyFinished,
    error,
  } = useExamSession(id);

  useEffect(() => {
    if (!session) {
      return;
    }
    if (alreadyFinished) {
      router.replace({ pathname: '/exam/results', params: { id: session.id } });
      return;
    }
    if (expired) {
      void finalize('expired').then(() => {
        router.replace({ pathname: '/exam/results', params: { id: session.id } });
      });
    }
  }, [alreadyFinished, expired, finalize, session]);

  const finish = () => {
    const run = async () => {
      if (!session) {
        return;
      }
      await finalize('completed');
      router.replace({ pathname: '/exam/results', params: { id: session.id } });
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Finish exam? Answers stay hidden until results.')
          : true;
      if (confirmed) {
        void run();
      }
      return;
    }

    Alert.alert(
      'Finish exam?',
      'You can still change answers until you finish. Answers are not revealed during the exam.',
      [
        { text: 'Keep working', style: 'cancel' },
        { text: 'Finish exam', onPress: () => void run() },
      ],
    );
  };

  if (error) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Unable to open exam" body={error} icon="alert-circle-outline" />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState
          title="Restoring exam"
          body="Reloading your questions, answers, flags, and timer."
          icon="sync-outline"
        />
      </Screen>
    );
  }

  const flagged = flaggedIds.includes(currentQuestion.id);
  const answeredIndexes = new Set(
    questions
      .map((question, index) =>
        answers.some((answer) => answer.questionId === question.id && answer.selectedOptionId)
          ? index
          : -1,
      )
      .filter((index) => index >= 0),
  );
  const flaggedIndexes = new Set(
    questions
      .map((question, index) => (flaggedIds.includes(question.id) ? index : -1))
      .filter((index) => index >= 0),
  );

  return (
    <Screen
      edges={['right', 'bottom', 'left']}
      contentStyle={styles.content}
      footer={
        <>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppButton
                label="Previous"
                variant="secondary"
                icon="arrow-back"
                onPress={() => void goToIndex(Math.max(0, session.currentIndex - 1))}
                disabled={session.currentIndex === 0}
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                label="Next"
                icon="arrow-forward"
                onPress={() =>
                  void goToIndex(Math.min(questions.length - 1, session.currentIndex + 1))
                }
                disabled={session.currentIndex >= questions.length - 1}
              />
            </View>
          </View>
          <AppButton label="Finish Exam" variant="secondary" onPress={finish} />
          <AppText variant="caption" color={colors.inkTertiary} align="center">
            Answers stay hidden until you finish. The timer keeps running if you leave or close the
            app, like a real exam.
          </AppText>
        </>
      }>
      <View style={styles.toolbar}>
        <TimerBadge remainingSeconds={remainingSeconds ?? 0} />
        <Pressable
          onPress={() => setNavigatorOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open question navigator"
          hitSlop={8}
          style={styles.navButton}>
          <Ionicons name="grid-outline" size={16} color={colors.accent} />
          <AppText variant="bodyStrong" color={colors.accent}>
            Navigator
          </AppText>
        </Pressable>
      </View>

      <QuestionPrompt
        question={currentQuestion}
        index={session.currentIndex}
        total={questions.length}
        selectedOptionId={selectedOptionId}
        submitted={false}
        onSelect={(optionId) => void saveSelection(optionId)}
      />

      <FlagControl flagged={flagged} onPress={() => void toggleFlag()} />

      <QuestionNavigator
        visible={navigatorOpen}
        total={questions.length}
        currentIndex={session.currentIndex}
        answeredIds={answeredIndexes}
        flaggedIds={flaggedIndexes}
        onSelect={(index) => void goToIndex(index)}
        onClose={() => setNavigatorOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
