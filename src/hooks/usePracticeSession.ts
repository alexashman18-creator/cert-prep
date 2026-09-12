import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { useRepositories } from '@/hooks/useRepositories';
import { missedQuestionIdsFromAnswers } from '@/lib/sessionMistakes';
import { selectPracticeQuestionIds, alignSessionQuestions } from '@/lib/sessionIntegrity';
import { buildSessionResults } from '@/lib/scoring';
import { useUiStore } from '@/stores/uiStore';
import type { DomainId } from '@/types/domain';
import type { Question } from '@/types/question';
import type {
  PracticeDomainFilter,
  PracticeSession,
  SessionAnswer,
  SessionResults,
} from '@/types/session';

export function useStartPractice() {
  const repos = useRepositories();

  return useCallback(
    async (input: {
      certificationId?: string;
      domainFilter: PracticeDomainFilter;
      requestedCount: number;
    }) => {
      const certificationId = input.certificationId ?? DEFAULT_CERTIFICATION_ID;
      const all = await repos.questions.getEligible({ certificationId });
      const pool =
        input.domainFilter === 'all'
          ? all
          : all.filter((question) => question.domain === input.domainFilter);
      const questionIds = selectPracticeQuestionIds(
        pool.map((question) => question.id),
        input.requestedCount,
      );
      if (questionIds.length === 0) {
        throw new Error('No questions are available for this selection.');
      }
      return repos.practice.create({
        certificationId,
        domainFilter: input.domainFilter,
        questionIds,
      });
    },
    [repos],
  );
}

export function useStartMistakePractice() {
  const repos = useRepositories();

  return useCallback(
    async (certificationId: string = DEFAULT_CERTIFICATION_ID) => {
      const ids = await repos.mistakes.getQuestionIds(certificationId);
      if (ids.length === 0) {
        throw new Error('You have no saved mistakes to review yet.');
      }
      return repos.practice.create({
        certificationId,
        domainFilter: 'all',
        questionIds: ids,
      });
    },
    [repos],
  );
}

export function useStartSessionMistakePractice() {
  const repos = useRepositories();

  return useCallback(
    async (sessionId: string) => {
      const answers = await repos.practice.getAnswers(sessionId);
      const session = await repos.practice.getById(sessionId);
      const uniqueIds = missedQuestionIdsFromAnswers(answers);
      if (uniqueIds.length === 0) {
        throw new Error('This session has no missed questions to review.');
      }
      return repos.practice.create({
        certificationId: session?.certificationId ?? DEFAULT_CERTIFICATION_ID,
        domainFilter: 'all',
        questionIds: uniqueIds,
      });
    },
    [repos],
  );
}

export function usePracticeSession(sessionId: string | undefined) {
  const repos = useRepositories();
  const resetQuestionUi = useUiStore((state) => state.resetQuestionUi);
  const markSubmitted = useUiStore((state) => state.markSubmitted);
  const selectedOptionId = useUiStore((state) => state.selectedOptionId);
  const submitted = useUiStore((state) => state.submitted);
  const selectOption = useUiStore((state) => state.selectOption);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    const loaded = await repos.practice.getById(sessionId);
    if (!loaded) {
      setError('This practice session could not be found.');
      return;
    }
    if (loaded.status === 'abandoned') {
      setError('This practice session was discarded when a new session was started.');
      return;
    }
    if (loaded.status === 'completed') {
      setSession(loaded);
      setQuestions([]);
      return;
    }
    const [loadedQuestions, loadedAnswers, flags] = await Promise.all([
      repos.questions.getByIds(loaded.questionIds),
      repos.practice.getAnswers(loaded.id),
      repos.flags.list(loaded.id, 'practice'),
    ]);
    const aligned = alignSessionQuestions(loaded.questionIds, loadedQuestions, loaded.currentIndex);
    if (aligned.questions.length === 0) {
      setError('This session references questions that are no longer available.');
      return;
    }
    setSession({ ...loaded, currentIndex: aligned.currentIndex, questionIds: aligned.questions.map((q) => q.id) });
    setQuestions(aligned.questions);
    setAnswers(loadedAnswers);
    setFlaggedIds(flags.map((flag) => flag.questionId));
    const currentQuestion = aligned.questions[aligned.currentIndex];
    const existing = loadedAnswers.find((answer) => answer.questionId === currentQuestion?.id);
    resetQuestionUi(existing?.selectedOptionId ?? null, Boolean(existing));
  }, [repos, resetQuestionUi, sessionId]);

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Unable to load practice session.');
    });
  }, [load]);

  const currentQuestion = questions[session?.currentIndex ?? 0] ?? null;
  const answerByQuestionId = useMemo(() => {
    return Object.fromEntries(answers.map((answer) => [answer.questionId, answer.selectedOptionId]));
  }, [answers]);

  const submit = useCallback(async () => {
    if (!session || session.status !== 'in_progress' || !currentQuestion || !selectedOptionId || submitted) {
      return;
    }
    setBusy(true);
    try {
      const isCorrect = selectedOptionId === currentQuestion.correctAnswerId;
      const answer = await repos.transaction(async () => {
        const saved = await repos.practice.saveAnswer({
          sessionId: session.id,
          questionId: currentQuestion.id,
          selectedOptionId,
          isCorrect,
        });
        await repos.progress.recordPracticeAnswer(session.certificationId, isCorrect);
        if (isCorrect) {
          await repos.mistakes.resolve(currentQuestion.id);
        } else {
          await repos.mistakes.record(session.certificationId, currentQuestion.id, session.id);
        }
        return saved;
      });
      setAnswers((current) => [
        ...current.filter((item) => item.questionId !== currentQuestion.id),
        answer,
      ]);
      markSubmitted();
    } finally {
      setBusy(false);
    }
  }, [currentQuestion, markSubmitted, repos, selectedOptionId, session, submitted]);

  const goToIndex = useCallback(
    async (index: number) => {
      if (!session) {
        return;
      }
      await repos.practice.updatePosition(session.id, index);
      const nextQuestion = questions[index];
      const existing = answers.find((answer) => answer.questionId === nextQuestion?.id);
      setSession({ ...session, currentIndex: index, updatedAt: new Date().toISOString() });
      resetQuestionUi(existing?.selectedOptionId ?? null, Boolean(existing));
    },
    [answers, questions, repos.practice, resetQuestionUi, session],
  );

  const complete = useCallback(async (): Promise<SessionResults | null> => {
    if (!session) {
      return null;
    }
    const results = buildSessionResults({
      sessionId: session.id,
      questions,
      answersByQuestionId: answerByQuestionId,
    });
    await repos.practice.complete(session.id, results.correct);
    return results;
  }, [answerByQuestionId, questions, repos.practice, session]);

  const toggleFlag = useCallback(async () => {
    if (!session || !currentQuestion) {
      return;
    }
    const next = !flaggedIds.includes(currentQuestion.id);
    await repos.flags.set({
      sessionId: session.id,
      sessionType: 'practice',
      questionId: currentQuestion.id,
      flagged: next,
    });
    setFlaggedIds((current) =>
      next ? [...current, currentQuestion.id] : current.filter((id) => id !== currentQuestion.id),
    );
  }, [currentQuestion, flaggedIds, repos.flags, session]);

  return {
    session,
    questions,
    currentQuestion,
    answers,
    answerByQuestionId,
    flaggedIds,
    selectedOptionId,
    submitted,
    selectOption,
    submit,
    goToIndex,
    complete,
    toggleFlag,
    error,
    busy,
  };
}

export function usePracticeResults(sessionId: string | undefined) {
  const repos = useRepositories();
  const [results, setResults] = useState<SessionResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<PracticeDomainFilter | DomainId | 'all'>('all');
  const [missedQuestionIds, setMissedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    void (async () => {
      try {
        const session = await repos.practice.getById(sessionId);
        if (!session) {
          setError('Practice results could not be found.');
          return;
        }
        const [questions, answers] = await Promise.all([
          repos.questions.getByIds(session.questionIds),
          repos.practice.getAnswers(session.id),
        ]);
        if (questions.length === 0) {
          setError('This session references questions that are no longer available.');
          return;
        }
        setDomainFilter(session.domainFilter);
        setMissedQuestionIds(missedQuestionIdsFromAnswers(answers));
        setResults(
          buildSessionResults({
            sessionId: session.id,
            questions,
            answersByQuestionId: Object.fromEntries(
              answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
            ),
          }),
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load results.');
      }
    })();
  }, [repos, sessionId]);

  return { results, error, domainFilter, missedQuestionIds };
}
