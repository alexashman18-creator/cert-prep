import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/hooks/useRepositories';
import { accuracyPercent } from '@/lib/scoring';
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
      const [progress, mistakeIds, questionBankSize, inProgressPractice, inProgressExam] =
        await Promise.all([
          repos.progress.get(),
          repos.mistakes.getQuestionIds(),
          repos.questions.countByDomain(),
          repos.practice.getInProgress(),
          repos.exams.getInProgress(),
        ]);

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
