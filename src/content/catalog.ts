import { mapSourceQuestions } from '@/content/mapSource';
import { DEVELOPMENT_QUESTION_ID_PREFIX, type QuestionBankFile } from '@/content/types';
import { assertValidQuestionBank, validateQuestionBankFile } from '@/content/validate';
import productionQuestionBank from '@/data/generated/productionQuestionBank.json';
import { sampleQuestions } from '@/data/sampleQuestions';
import type { Question } from '@/types/question';

export function loadProductionQuestionsFromBank(raw: unknown, fileLabel = 'productionQuestionBank'): Question[] {
  const result = validateQuestionBankFile(raw, { fileLabel, allowDevelopmentIds: false });
  assertValidQuestionBank(result, fileLabel);
  return mapSourceQuestions((raw as QuestionBankFile).questions);
}

export function mergeQuestionCatalog(
  developmentQuestions: readonly Question[],
  productionQuestions: readonly Question[],
): Question[] {
  const seen = new Map<string, string>();
  const merged: Question[] = [];

  for (const question of developmentQuestions) {
    seen.set(question.id, 'development samples');
    merged.push(question);
  }

  for (const question of productionQuestions) {
    const previous = seen.get(question.id);
    if (previous) {
      throw new Error(
        `Question bank was rejected: duplicate ID "${question.id}" already exists in ${previous}.`,
      );
    }
    if (question.id.startsWith(DEVELOPMENT_QUESTION_ID_PREFIX)) {
      throw new Error(
        `Question bank was rejected: "${question.id}" uses the reserved development prefix.`,
      );
    }
    seen.set(question.id, 'production content');
    merged.push(question);
  }

  return merged;
}

export function loadBundledQuestionCatalog(): Question[] {
  return mergeQuestionCatalog(
    sampleQuestions,
    loadProductionQuestionsFromBank(productionQuestionBank, 'src/data/generated/productionQuestionBank.json'),
  );
}
