export const CERTIFICATION_STATUSES = ['available', 'coming_soon', 'inactive'] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export const DIFFICULTY_LEVELS = ['fundamentals', 'associate', 'expert', 'specialty'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export interface CertificationDomain {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
}

export interface MockExamConfig {
  examDurationMinutes: number;
  targetQuestionCount: number;
  domainWeights: Record<string, number>;
}

export interface CertificationTheme {
  accent: string;
  accentSoft: string;
}

export interface Certification {
  id: string;
  examCode: string;
  displayName: string;
  shortName: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  provider: 'Microsoft';
  studyGuideUrl: string | null;
  examDurationMinutes: number | null;
  targetMockQuestionCount: number | null;
  contentVersion: string;
  status: CertificationStatus;
  domains: CertificationDomain[];
  mockExam: MockExamConfig | null;
  theme: CertificationTheme;
}

export function certificationTitle(certification: Pick<Certification, 'examCode' | 'displayName'>): string {
  return `${certification.examCode} — ${certification.displayName}`;
}

export function isCertificationAvailable(certification: Pick<Certification, 'status'>): boolean {
  return certification.status === 'available';
}
