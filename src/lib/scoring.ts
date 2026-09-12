import type { DomainId } from '@/types/domain';
import { DOMAIN_IDS } from '@/types/domain';
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
  const domainTotals = new Map<DomainId, { answered: number; correct: number }>();

  for (const domain of DOMAIN_IDS) {
    domainTotals.set(domain, { answered: 0, correct: 0 });
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

  const domainPerformance: DomainPerformance[] = DOMAIN_IDS.filter((domain) => {
    return questions.some((question) => question.domain === domain);
  }).map((domain) => {
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
