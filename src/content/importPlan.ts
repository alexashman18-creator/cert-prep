import type { Question } from '@/types/question';

export interface ExistingQuestionVersion {
  id: string;
  questionVersion: number;
}

export type ImportSkipReason = 'older_version' | 'same_version';

export interface ImportPlan {
  insert: Question[];
  update: Question[];
  skip: { question: Question; reason: ImportSkipReason }[];
}

export function planQuestionImport(
  incoming: readonly Question[],
  existing: readonly ExistingQuestionVersion[],
): ImportPlan {
  const current = new Map(existing.map((item) => [item.id, item.questionVersion]));
  const plan: ImportPlan = { insert: [], update: [], skip: [] };

  for (const question of incoming) {
    const storedVersion = current.get(question.id);
    if (storedVersion === undefined) {
      plan.insert.push(question);
      current.set(question.id, question.questionVersion);
      continue;
    }
    if (question.questionVersion > storedVersion) {
      plan.update.push(question);
      current.set(question.id, question.questionVersion);
      continue;
    }
    plan.skip.push({
      question,
      reason: question.questionVersion < storedVersion ? 'older_version' : 'same_version',
    });
  }

  return plan;
}

export function summarizeImportPlan(plan: ImportPlan): {
  inserted: number;
  updated: number;
  skipped: number;
} {
  return {
    inserted: plan.insert.length,
    updated: plan.update.length,
    skipped: plan.skip.length,
  };
}
