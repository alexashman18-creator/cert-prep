import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AZ900_MOCK_EXAM,
  CERTIFICATIONS,
  DEFAULT_CERTIFICATION_ID,
  assertAvailableCertification,
  getCertification,
  getCertificationByExamCode,
  getMockExamConfig,
  listAvailableCertifications,
  requireMockExamConfig,
  resolveCertificationId,
} from '@/certifications';

test('catalog includes the requested Microsoft tracks and only AZ-900 is available', () => {
  const codes = CERTIFICATIONS.map((item) => item.examCode);
  assert.deepEqual(codes, [
    'AZ-900',
    'DP-900',
    'AI-901',
    'AZ-104',
    'AI-200',
    'SC-500',
    'DP-300',
    'DP-700',
    'AI-103',
    'AZ-305',
    'AZ-400',
  ]);
  assert.deepEqual(
    listAvailableCertifications().map((item) => item.id),
    [DEFAULT_CERTIFICATION_ID],
  );
  assert.ok(CERTIFICATIONS.filter((item) => item.status === 'coming_soon').length === 10);
});

test('AZ-900 keeps the current mock-exam configuration', () => {
  const az900 = getCertification('az900');
  assert.ok(az900);
  assert.equal(az900.status, 'available');
  assert.equal(az900.examDurationMinutes, 45);
  assert.equal(az900.targetMockQuestionCount, 40);
  assert.deepEqual(az900.mockExam, AZ900_MOCK_EXAM);
  assert.equal(AZ900_MOCK_EXAM.domainWeights.cloud_concepts, 0.27);
  assert.equal(AZ900_MOCK_EXAM.domainWeights.architecture_services, 0.38);
  assert.equal(AZ900_MOCK_EXAM.domainWeights.management_governance, 0.35);
  assert.equal(az900.domains.length, 3);
});

test('catalog display names match current official credential names', () => {
  assert.deepEqual(
    Object.fromEntries(CERTIFICATIONS.map((item) => [item.examCode, item.displayName])),
    {
      'AZ-900': 'Azure Fundamentals',
      'DP-900': 'Azure Data Fundamentals',
      'AI-901': 'Azure AI Fundamentals',
      'AZ-104': 'Azure Administrator Associate',
      'AI-200': 'Azure AI Cloud Developer Associate',
      'SC-500': 'Cloud and AI Security Engineer Associate',
      'DP-300': 'Azure Database Administrator Associate',
      'DP-700': 'Fabric Data Engineer Associate',
      'AI-103': 'Azure AI Apps and Agents Developer Associate',
      'AZ-305': 'Azure Solutions Architect Expert',
      'AZ-400': 'DevOps Engineer Expert',
    },
  );
});

test('coming-soon certifications do not invent mock-exam parameters', () => {
  for (const item of CERTIFICATIONS.filter((cert) => cert.id !== 'az900')) {
    assert.equal(item.status, 'coming_soon');
    assert.equal(item.mockExam, null);
    assert.equal(item.examDurationMinutes, null);
    assert.equal(item.targetMockQuestionCount, null);
    assert.deepEqual(item.domains, []);
    assert.equal(getMockExamConfig(item.id), null);
  }
});

test('resolveCertificationId accepts ids and exam codes', () => {
  assert.equal(resolveCertificationId('AZ-900'), 'az900');
  assert.equal(resolveCertificationId('az900'), 'az900');
  assert.equal(resolveCertificationId('dp-900'), 'dp900');
  assert.equal(resolveCertificationId('unknown'), null);
});

test('only available certifications can be opened', () => {
  assert.equal(assertAvailableCertification('az900').examCode, 'AZ-900');
  assert.throws(() => assertAvailableCertification('dp900'), /not available yet/);
  assert.throws(() => requireMockExamConfig('dp900'), /Mock exam configuration has not been added/);
  assert.equal(requireMockExamConfig('az900').targetQuestionCount, 40);
  assert.equal(getCertificationByExamCode('DP-900')?.id, 'dp900');
});
