import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/hooks/useRepositories';
import { completeExamSession } from '@/lib/completeExam';
import { accuracyPercent } from '@/lib/scoring';
import { remainingFromDeadline, shouldExpire } from '@/lib/timer';
import type { ExamSession, PracticeSession, UserProgress } from '@/types/session';

export interface HomeData {
  progress: UserProgress;
  accuracy: number;
  mistakeCount: number;
  questionBankSize: number;
  inProgressPractice: PracticeSession | null;
  inProgressExam: ExamSession | null;
}

export function useHomeData() {
  const repos = useRepositories();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [progress, mistakeIds, questionBankSize, inProgressPractice, maybeExam] =
        await Promise.all([
          repos.progress.get(),
          repos.mistakes.getQuestionIds(),
          repos.questions.countByDomain(),
          repos.practice.getInProgress(),
          repos.exams.getInProgress(),
        ]);

      let inProgressExam = maybeExam;
      if (maybeExam) {
        const remaining = remainingFromDeadline(maybeExam.startedAt, maybeExam.durationSeconds);
        if (shouldExpire(remaining)) {
          const [questions, answers] = await Promise.all([
            repos.questions.getByIds(maybeExam.questionIds),
            repos.exams.getAnswers(maybeExam.id),
          ]);
          await completeExamSession(repos, {
            sessionId: maybeExam.id,
            questions,
            answers,
            status: 'expired',
          });
          inProgressExam = null;
        }
      }

      setData({
        progress,
        accuracy: accuracyPercent(progress.questionsCorrect, progress.questionsAnswered),
        mistakeCount: mistakeIds.length,
        questionBankSize,
        inProgressPractice,
        inProgressExam,
      });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load progress.');
    }
  }, [repos]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, refresh };
}
