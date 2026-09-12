import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { buildSessionResults } from '@/lib/scoring';
import type { Repositories } from '@/repositories/createRepositories';
import type { Question } from '@/types/question';
import type { SessionAnswer, SessionResults } from '@/types/session';

export function classifyExamAnswers(
  questions: Question[],
  answers: SessionAnswer[],
): { missedIds: string[]; correctIds: string[] } {
  const missedIds: string[] = [];
  const correctIds: string[] = [];
  for (const question of questions) {
    const selected = answers.find((answer) => answer.questionId === question.id)?.selectedOptionId;
    if (!selected) {
      continue;
    }
    if (selected === question.correctAnswerId) {
      correctIds.push(question.id);
    } else {
      missedIds.push(question.id);
    }
  }
  return { missedIds, correctIds };
}

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

  const { missedIds, correctIds } = classifyExamAnswers(input.questions, input.answers);
  const session = await repos.exams.getById(input.sessionId);
  const certificationId =
    session?.certificationId ?? input.questions[0]?.certificationId ?? DEFAULT_CERTIFICATION_ID;

  await repos.transaction(async () => {
    await repos.exams.complete(input.sessionId, results.correct, input.status);
    await repos.mistakes.recordMany(certificationId, missedIds, input.sessionId);
    for (const questionId of correctIds) {
      await repos.mistakes.resolve(questionId);
    }
    await repos.progress.recordExamCompletion(certificationId, {
      questionsAnswered: results.correct + results.incorrect,
      questionsCorrect: results.correct,
      percent: results.percent,
    });
  });

  return results;
}
