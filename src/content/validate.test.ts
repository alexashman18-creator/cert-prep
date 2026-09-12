import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateQuestionBankFile } from '@/content/validate';

function validQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'az900-2024-cc-001',
    certificationId: 'az900',
    examVersion: 'AZ-900-2024',
    domain: 'cloud_concepts',
    objective: 'Describe cloud concepts',
    subobjective: 'Describe cloud computing',
    difficulty: 'beginner',
    questionText: 'Which option is correct?',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
    ],
    correctAnswerId: 'b',
    overallExplanation: 'B is correct.',
    optionExplanations: { a: 'no', b: 'yes', c: 'no', d: 'no' },
    sourceUrl: 'https://learn.microsoft.com/azure',
    sourceTitle: 'Microsoft Learn',
    verifiedDate: '2026-09-12',
    questionVersion: 1,
    contentStatus: 'verified',
    ...overrides,
  };
}

function bank(questions: unknown[], extras: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    exam: 'AZ-900',
    batchId: 'test-batch',
    questions,
    ...extras,
  };
}

function messages(raw: unknown): string[] {
  return validateQuestionBankFile(raw, { fileLabel: 'bank' }).issues.map(
    (item) => `${item.path}: ${item.message}`,
  );
}

test('accepts a valid verified question bank', () => {
  const result = validateQuestionBankFile(bank([validQuestion()]));
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test('accepts an empty questions array', () => {
  assert.equal(validateQuestionBankFile(bank([])).ok, true);
});

test('rejects duplicate IDs', () => {
  const result = validateQuestionBankFile(bank([validQuestion(), validQuestion()]));
  assert.equal(result.ok, false);
  assert.ok(messages(bank([validQuestion(), validQuestion()])).some((item) => item.includes('duplicate ID')));
  assert.ok(result.issues.length >= 1);
});

test('rejects fewer or more than four answers', () => {
  const three = validQuestion({
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
    ],
  });
  const five = validQuestion({
    id: 'az900-2024-cc-002',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
  });
  assert.ok(messages(bank([three])).some((item) => item.includes('exactly four answers')));
  assert.ok(messages(bank([five])).some((item) => item.includes('exactly four answers')));
});

test('rejects a missing correct answer and a correctAnswerId that does not match an option', () => {
  const missing = validQuestion({ correctAnswerId: '' });
  const unknown = validQuestion({ id: 'az900-2024-cc-002', correctAnswerId: 'z' });
  assert.ok(messages(bank([missing])).some((item) => item.includes('correctAnswerId is required')));
  assert.ok(
    messages(bank([unknown])).some((item) => item.includes('does not match an option')),
  );
});

test('rejects missing explanations', () => {
  const missingOverall = validQuestion({ overallExplanation: '' });
  const missingOption = validQuestion({
    id: 'az900-2024-cc-002',
    optionExplanations: { a: 'no', b: 'yes', c: 'no' },
  });
  assert.ok(messages(bank([missingOverall])).some((item) => item.includes('overallExplanation')));
  assert.ok(messages(bank([missingOption])).some((item) => item.includes('missing explanation for option d')));
});

test('rejects an invalid domain', () => {
  assert.ok(
    messages(bank([validQuestion({ domain: 'networking' })])).some((item) => item.includes('invalid domain')),
  );
});

test('rejects verified questions missing source URL or verification date', () => {
  const noUrl = validQuestion({ sourceUrl: '' });
  const noDate = validQuestion({ id: 'az900-2024-cc-002', verifiedDate: null });
  assert.ok(messages(bank([noUrl])).some((item) => item.includes('sourceUrl is required for verified')));
  assert.ok(messages(bank([noDate])).some((item) => item.includes('verifiedDate is required for verified')));
});

test('rejects unsupported content status', () => {
  assert.ok(
    messages(bank([validQuestion({ contentStatus: 'published' })])).some((item) =>
      item.includes('unsupported contentStatus'),
    ),
  );
});

test('rejects reserved development IDs in production files', () => {
  assert.ok(
    messages(bank([validQuestion({ id: 'az900-dev-cc-001' })])).some((item) =>
      item.includes('reserved for bundled development samples'),
    ),
  );
});

test('does not silently accept a malformed bank', () => {
  const result = validateQuestionBankFile({ exam: 'AZ-900', questions: [validQuestion()] });
  assert.equal(result.ok, false);
  assert.ok(result.issues.length > 0);
});

test('accepts an empty coming-soon bank and official blueprint domain ids', () => {
  assert.equal(
    validateQuestionBankFile({
      schemaVersion: 1,
      exam: 'DP-900',
      certificationId: 'dp900',
      questions: [],
    }).ok,
    true,
  );
  assert.equal(
    validateQuestionBankFile({
      schemaVersion: 1,
      exam: 'DP-900',
      certificationId: 'dp900',
      questions: [
        validQuestion({
          id: 'dp900-001',
          certificationId: 'dp900',
          domain: 'describe_core_data_concepts',
        }),
      ],
    }).ok,
    true,
  );
  assert.ok(
    messages({
      schemaVersion: 1,
      exam: 'DP-900',
      certificationId: 'dp900',
      questions: [validQuestion({ id: 'dp900-001', certificationId: 'dp900', domain: 'cloud_concepts' })],
    }).some((item) => item.includes('invalid domain')),
  );
});

test('rejects an unknown exam code', () => {
  assert.ok(messages(bank([validQuestion()], { exam: 'MS-999' })).some((item) => item.includes('unknown exam')));
});
