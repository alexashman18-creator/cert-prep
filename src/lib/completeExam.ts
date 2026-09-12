import { buildSessionResults } from '@/lib/scoring';
import type { Repositories } from '@/repositories/createRepositories';
import type { Question } from '@/types/question';
import type { SessionAnswer, SessionResults } from '@/types/session';

export async function completeExamSession(
  repos: Repositories,
  input: {
    sessionId: string;
    questions: Question[];
    answers: SessionAnswer[];
    status: 'completed' | 'expired';
  },
): Promise<SessionResults> {
  const results = buildSessionResults({
    sessionId: input.sessionId,
    questions: input.questions,
    answersByQuestionId: Object.fromEntries(
      input.answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
    ),
  });

  await repos.exams.complete(input.sessionId, results.correct, input.status);

  const missedIds = input.questions
    .filter((question) => {
      const selected = input.answers.find((answer) => answer.questionId === question.id)
        ?.selectedOptionId;
      return Boolean(selected) && selected !== question.correctAnswerId;
    })
    .map((question) => question.id);

  await repos.mistakes.recordMany(missedIds, input.sessionId);
  await repos.progress.recordExamCompletion({
    questionsAnswered: results.correct + results.incorrect,
    questionsCorrect: results.correct,
    percent: results.percent,
  });

  return results;
}
