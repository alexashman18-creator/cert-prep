import type { DomainPerformance, SessionResults } from '@/types/session';
import type { Question } from '@/types/question';

export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((correct / total) * 1000) / 10;
}

export function buildSessionResults(params: {
  sessionId: string;
  questions: Question[];
  answersByQuestionId: Record<string, string | null | undefined>;
}): SessionResults {
  const { sessionId, questions, answersByQuestionId } = params;
  const domainTotals = new Map<string, { answered: number; correct: number }>();
  const domainOrder: string[] = [];

  for (const question of questions) {
    if (!domainTotals.has(question.domain)) {
      domainTotals.set(question.domain, { answered: 0, correct: 0 });
      domainOrder.push(question.domain);
    }
  }

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const question of questions) {
    const selected = answersByQuestionId[question.id];
    const bucket = domainTotals.get(question.domain) ?? { answered: 0, correct: 0 };

    if (!selected) {
      unanswered += 1;
      domainTotals.set(question.domain, bucket);
      continue;
    }

    bucket.answered += 1;
    if (selected === question.correctAnswerId) {
      correct += 1;
      bucket.correct += 1;
    } else {
      incorrect += 1;
    }
    domainTotals.set(question.domain, bucket);
  }

  const domainPerformance: DomainPerformance[] = domainOrder.map((domain) => {
    const stats = domainTotals.get(domain) ?? { answered: 0, correct: 0 };
    return {
      domain,
      answered: stats.answered,
      correct: stats.correct,
      percent: accuracyPercent(stats.correct, stats.answered),
    };
  });

  return {
    sessionId,
    total: questions.length,
    correct,
    incorrect,
    unanswered,
    percent: accuracyPercent(correct, questions.length),
    domainPerformance,
  };
}
