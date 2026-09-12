import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useRepositories } from '@/hooks/useRepositories';
import { completeExamSession } from '@/lib/completeExam';
import { EXAM_DURATION_SECONDS, EXAM_QUESTION_TARGET, selectExamQuestions } from '@/lib/examBlueprint';
import { buildSessionResults } from '@/lib/scoring';
import { restoreRemainingSeconds, shouldExpire } from '@/lib/timer';
import { useUiStore } from '@/stores/uiStore';
import type { Question } from '@/types/question';
import type { ExamSession, SessionAnswer, SessionResults } from '@/types/session';

export function useStartExam() {
  const repos = useRepositories();

  return useCallback(async () => {
    const existing = await repos.exams.getInProgress();
    if (existing) {
      return existing;
    }
    const questions = selectExamQuestions(await repos.questions.getAll(), EXAM_QUESTION_TARGET);
    if (questions.length === 0) {
      throw new Error('No questions are available for a mock exam.');
    }
    return repos.exams.create({
      questionIds: questions.map((question) => question.id),
      durationSeconds: EXAM_DURATION_SECONDS,
    });
  }, [repos]);
}

export function useExamSession(sessionId: string | undefined) {
  const repos = useRepositories();
  const resetQuestionUi = useUiStore((state) => state.resetQuestionUi);
  const selectedOptionId = useUiStore((state) => state.selectedOptionId);
  const selectOption = useUiStore((state) => state.selectOption);

  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(EXAM_DURATION_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const remainingRef = useRef(remainingSeconds);
  const completedRef = useRef(false);

  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  const finalizeInternal = useCallback(
    async (
      currentSession: ExamSession,
      currentQuestions: Question[],
      currentAnswers: SessionAnswer[],
      status: 'completed' | 'expired',
    ): Promise<SessionResults | null> => {
      if (completedRef.current || currentSession.status !== 'in_progress') {
        return null;
      }
      completedRef.current = true;
      await repos.exams.persistTimer(currentSession.id, remainingRef.current);
      return completeExamSession(repos, {
        sessionId: currentSession.id,
        questions: currentQuestions,
        answers: currentAnswers,
        status,
      });
    },
    [repos],
  );

  const load = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    const loaded = await repos.exams.getById(sessionId);
    if (!loaded) {
      setError('This exam session could not be found.');
      return;
    }

    const [loadedQuestions, loadedAnswers, flags] = await Promise.all([
      repos.questions.getByIds(loaded.questionIds),
      repos.exams.getAnswers(loaded.id),
      repos.flags.list(loaded.id, 'exam'),
    ]);

    const restored =
      loaded.status === 'in_progress'
        ? restoreRemainingSeconds(loaded.remainingSeconds, loaded.lastTickAt)
        : loaded.remainingSeconds;

    if (loaded.status === 'in_progress' && shouldExpire(restored)) {
      await finalizeInternal(loaded, loadedQuestions, loadedAnswers, 'expired');
      setSession({ ...loaded, status: 'expired', remainingSeconds: 0 });
      setQuestions(loadedQuestions);
      setAnswers(loadedAnswers);
      setFlaggedIds(flags.map((flag) => flag.questionId));
      setRemainingSeconds(0);
      return;
    }

    if (loaded.status === 'in_progress') {
      await repos.exams.persistTimer(loaded.id, restored);
    }

    completedRef.current = loaded.status !== 'in_progress';
    setSession({ ...loaded, remainingSeconds: restored });
    setQuestions(loadedQuestions);
    setAnswers(loadedAnswers);
    setFlaggedIds(flags.map((flag) => flag.questionId));
    setRemainingSeconds(restored);
    const currentQuestion = loadedQuestions[loaded.currentIndex];
    const existing = loadedAnswers.find((answer) => answer.questionId === currentQuestion?.id);
    resetQuestionUi(existing?.selectedOptionId ?? null, false);
  }, [finalizeInternal, repos, resetQuestionUi, sessionId]);

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Unable to load exam session.');
    });
  }, [load]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    const persistInterval = setInterval(() => {
      void repos.exams.persistTimer(session.id, remainingRef.current);
    }, 5000);

    const handleAppState = (next: AppStateStatus) => {
      if (next !== 'active') {
        void repos.exams.persistTimer(session.id, remainingRef.current);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      clearInterval(interval);
      clearInterval(persistInterval);
      subscription.remove();
      void repos.exams.persistTimer(session.id, remainingRef.current);
    };
  }, [repos.exams, session]);

  const currentQuestion = questions[session?.currentIndex ?? 0] ?? null;

  const saveSelection = useCallback(
    async (optionId: string) => {
      if (!session || !currentQuestion || session.status !== 'in_progress') {
        return;
      }
      selectOption(optionId);
      const answer = await repos.exams.saveAnswer({
        sessionId: session.id,
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      });
      setAnswers((current) => [
        ...current.filter((item) => item.questionId !== currentQuestion.id),
        answer,
      ]);
    },
    [currentQuestion, repos.exams, selectOption, session],
  );

  const goToIndex = useCallback(
    async (index: number) => {
      if (!session) {
        return;
      }
      await repos.exams.updatePosition(session.id, index);
      await repos.exams.persistTimer(session.id, remainingRef.current);
      const nextQuestion = questions[index];
      const existing = answers.find((answer) => answer.questionId === nextQuestion?.id);
      setSession({ ...session, currentIndex: index });
      resetQuestionUi(existing?.selectedOptionId ?? null, false);
    },
    [answers, questions, repos.exams, resetQuestionUi, session],
  );

  const toggleFlag = useCallback(async () => {
    if (!session || !currentQuestion) {
      return;
    }
    const next = !flaggedIds.includes(currentQuestion.id);
    await repos.flags.set({
      sessionId: session.id,
      sessionType: 'exam',
      questionId: currentQuestion.id,
      flagged: next,
    });
    setFlaggedIds((current) =>
      next ? [...current, currentQuestion.id] : current.filter((id) => id !== currentQuestion.id),
    );
  }, [currentQuestion, flaggedIds, repos.flags, session]);

  const finalize = useCallback(
    async (status: 'completed' | 'expired' = 'completed') => {
      if (!session) {
        return null;
      }
      return finalizeInternal(session, questions, answers, status);
    },
    [answers, finalizeInternal, questions, session],
  );

  const expired = remainingSeconds <= 0 && session?.status === 'in_progress';

  return {
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
  };
}

export function useExamResults(sessionId: string | undefined) {
  const repos = useRepositories();
  const [results, setResults] = useState<SessionResults | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    void (async () => {
      try {
        const loaded = await repos.exams.getById(sessionId);
        if (!loaded) {
          setError('Exam results could not be found.');
          return;
        }
        const [loadedQuestions, loadedAnswers] = await Promise.all([
          repos.questions.getByIds(loaded.questionIds),
          repos.exams.getAnswers(loaded.id),
        ]);
        setQuestions(loadedQuestions);
        setAnswers(loadedAnswers);
        setResults(
          buildSessionResults({
            sessionId: loaded.id,
            questions: loadedQuestions,
            answersByQuestionId: Object.fromEntries(
              loadedAnswers.map((answer) => [answer.questionId, answer.selectedOptionId]),
            ),
          }),
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load exam results.');
      }
    })();
  }, [repos, sessionId]);

  const answersByQuestionId = useMemo(
    () => Object.fromEntries(answers.map((answer) => [answer.questionId, answer.selectedOptionId])),
    [answers],
  );

  return { results, questions, answersByQuestionId, error };
}
