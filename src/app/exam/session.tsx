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
import { Screen } from '@/components/ui/Screen';
import { useExamSession } from '@/hooks/useExamSession';
import { useUiStore } from '@/stores/uiStore';
import { colors, spacing } from '@/theme/tokens';

export default function ExamSessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
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
    error,
  } = useExamSession(id);

  useEffect(() => {
    if (!expired || !session) {
      return;
    }
    void finalize('expired').then(() => {
      router.replace({ pathname: '/exam/results', params: { id: session.id } });
    });
  }, [expired, finalize, session]);

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
        <EmptyState title="Unable to open exam" body={error} />
        <AppButton label="Home" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Screen edges={['right', 'bottom', 'left']}>
        <EmptyState title="Restoring exam" body="Reloading your questions, answers, flags, and timer." />
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
    <Screen edges={['right', 'bottom', 'left']}>
      <View style={styles.toolbar}>
        <TimerBadge remainingSeconds={remainingSeconds} />
        <Pressable onPress={() => setNavigatorOpen(true)} style={styles.navButton}>
          <Ionicons name="grid-outline" size={18} color={colors.accent} />
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

      <Pressable onPress={() => void toggleFlag()} style={styles.flag}>
        <Ionicons
          name={flagged ? 'flag' : 'flag-outline'}
          size={18}
          color={flagged ? colors.flag : colors.inkSecondary}
        />
        <AppText variant="bodyStrong" color={flagged ? colors.flag : colors.inkSecondary}>
          {flagged ? 'Flagged for review' : 'Flag for review'}
        </AppText>
      </Pressable>

      <View style={styles.actions}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppButton
              label="Previous"
              variant="secondary"
              onPress={() => void goToIndex(Math.max(0, session.currentIndex - 1))}
              disabled={session.currentIndex === 0}
            />
          </View>
          <View style={styles.flex}>
            <AppButton
              label="Next"
              onPress={() =>
                void goToIndex(Math.min(questions.length - 1, session.currentIndex + 1))
              }
              disabled={session.currentIndex >= questions.length - 1}
            />
          </View>
        </View>
        <AppButton label="Finish Exam" variant="secondary" onPress={finish} />
        <AppText variant="caption" color={colors.inkTertiary} align="center">
          Answers stay hidden until you finish. Progress is saved on this device.
        </AppText>
      </View>

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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
