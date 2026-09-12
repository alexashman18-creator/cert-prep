import {
  certificationTitle,
  type Certification,
  type CertificationDomain,
  type MockExamConfig,
} from '@/certifications/types';

export const DEFAULT_CERTIFICATION_ID = 'az900';

const AZURE_THEME = {
  accent: '#0A6CBD',
  accentSoft: '#D9EAF8',
} as const;

const AZ900_DOMAINS: CertificationDomain[] = [
  {
    id: 'cloud_concepts',
    label: 'Cloud Concepts',
    shortLabel: 'Cloud Concepts',
    summary: 'Cloud models, benefits, and shared responsibility',
  },
  {
    id: 'architecture_services',
    label: 'Azure Architecture & Services',
    shortLabel: 'Architecture & Services',
    summary: 'Compute, networking, storage, and identity',
  },
  {
    id: 'management_governance',
    label: 'Azure Management & Governance',
    shortLabel: 'Management & Governance',
    summary: 'Cost, policy, and resource management',
  },
];

export const AZ900_MOCK_EXAM: MockExamConfig = {
  examDurationMinutes: 45,
  targetQuestionCount: 40,
  domainWeights: {
    cloud_concepts: 0.27,
    architecture_services: 0.38,
    management_governance: 0.35,
  },
};

function comingSoon(input: {
  id: string;
  examCode: string;
  displayName: string;
  difficultyLevel: Certification['difficultyLevel'];
  description: string;
  studyGuideUrl: string | null;
}): Certification {
  return {
    ...input,
    shortName: input.examCode,
    provider: 'Microsoft',
    examDurationMinutes: null,
    targetMockQuestionCount: null,
    contentVersion: 'pending',
    status: 'coming_soon',
    domains: [],
    mockExam: null,
    theme: AZURE_THEME,
  };
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: DEFAULT_CERTIFICATION_ID,
    examCode: 'AZ-900',
    displayName: 'Azure Fundamentals',
    shortName: 'AZ-900',
    description: 'Cloud concepts, Azure architecture, and governance — practiced offline on this device.',
    difficultyLevel: 'fundamentals',
    provider: 'Microsoft',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/azure-fundamentals/',
    examDurationMinutes: AZ900_MOCK_EXAM.examDurationMinutes,
    targetMockQuestionCount: AZ900_MOCK_EXAM.targetQuestionCount,
    contentVersion: 'az900-2024',
    status: 'available',
    domains: AZ900_DOMAINS,
    mockExam: AZ900_MOCK_EXAM,
    theme: AZURE_THEME,
  },
  comingSoon({
    id: 'dp900',
    examCode: 'DP-900',
    displayName: 'Azure Data Fundamentals',
    difficultyLevel: 'fundamentals',
    description: 'Core data concepts and Azure data services. Question bank not added yet.',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/azure-data-fundamentals/',
  }),
  comingSoon({
    id: 'ai901',
    examCode: 'AI-901',
    displayName: 'Azure AI Fundamentals',
    difficultyLevel: 'fundamentals',
    description: 'Foundational Azure AI concepts. Exam specification and question bank are pending.',
    studyGuideUrl: null,
  }),
  comingSoon({
    id: 'az104',
    examCode: 'AZ-104',
    displayName: 'Azure Administrator',
    difficultyLevel: 'associate',
    description: 'Administer Azure identities, compute, storage, and networking. Question bank not added yet.',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/azure-administrator/',
  }),
  comingSoon({
    id: 'ai200',
    examCode: 'AI-200',
    displayName: 'Azure AI Cloud Developer',
    difficultyLevel: 'associate',
    description: 'Build AI-powered Azure solutions. Exam specification and question bank are pending.',
    studyGuideUrl: null,
  }),
  comingSoon({
    id: 'sc500',
    examCode: 'SC-500',
    displayName: 'Cloud and AI Security Engineer',
    difficultyLevel: 'associate',
    description: 'Secure cloud and AI workloads. Exam specification and question bank are pending.',
    studyGuideUrl: null,
  }),
  comingSoon({
    id: 'dp300',
    examCode: 'DP-300',
    displayName: 'Azure Database Administrator',
    difficultyLevel: 'associate',
    description: 'Operate relational databases on Azure. Question bank not added yet.',
    studyGuideUrl:
      'https://learn.microsoft.com/credentials/certifications/azure-database-administrator-associate/',
  }),
  comingSoon({
    id: 'dp700',
    examCode: 'DP-700',
    displayName: 'Fabric Data Engineer',
    difficultyLevel: 'associate',
    description: 'Implement data engineering workloads in Microsoft Fabric. Question bank not added yet.',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/fabric-data-engineer-associate/',
  }),
  comingSoon({
    id: 'ai103',
    examCode: 'AI-103',
    displayName: 'Azure AI Engineer',
    difficultyLevel: 'associate',
    description: 'Design and implement Azure AI solutions. Exam specification and question bank are pending.',
    studyGuideUrl: null,
  }),
  comingSoon({
    id: 'az305',
    examCode: 'AZ-305',
    displayName: 'Azure Solutions Architect',
    difficultyLevel: 'expert',
    description: 'Design Azure infrastructure, applications, and governance. Question bank not added yet.',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/azure-solutions-architect/',
  }),
  comingSoon({
    id: 'az400',
    examCode: 'AZ-400',
    displayName: 'DevOps Engineer',
    difficultyLevel: 'expert',
    description: 'Design and implement DevOps practices on Azure. Question bank not added yet.',
    studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/devops-engineer/',
  }),
];

const BY_ID = new Map(CERTIFICATIONS.map((item) => [item.id, item]));
const BY_EXAM_CODE = new Map(CERTIFICATIONS.map((item) => [item.examCode.toUpperCase(), item]));

export function getCertification(id: string): Certification | null {
  return BY_ID.get(id) ?? null;
}

export function getCertificationByExamCode(examCode: string): Certification | null {
  return BY_EXAM_CODE.get(examCode.trim().toUpperCase()) ?? null;
}

export function listCertifications(): Certification[] {
  return CERTIFICATIONS;
}

export function listAvailableCertifications(): Certification[] {
  return CERTIFICATIONS.filter((item) => item.status === 'available');
}

export function listComingSoonCertifications(): Certification[] {
  return CERTIFICATIONS.filter((item) => item.status === 'coming_soon');
}

export function normalizeCertificationKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveCertificationId(value: string): string | null {
  const exact = getCertification(value);
  if (exact) {
    return exact.id;
  }
  const byCode = getCertificationByExamCode(value);
  if (byCode) {
    return byCode.id;
  }
  const normalized = normalizeCertificationKey(value);
  return CERTIFICATIONS.find((item) => normalizeCertificationKey(item.id) === normalized)?.id ?? null;
}

export function requireCertification(id: string): Certification {
  const certification = getCertification(id);
  if (!certification) {
    throw new Error(`Unknown certification: ${id}`);
  }
  return certification;
}

export function assertAvailableCertification(id: string): Certification {
  const certification = requireCertification(id);
  if (certification.status !== 'available') {
    throw new Error(`${certificationTitle(certification)} is not available yet.`);
  }
  return certification;
}

export function getMockExamConfig(id: string): MockExamConfig | null {
  return getCertification(id)?.mockExam ?? null;
}

export function requireMockExamConfig(id: string): MockExamConfig {
  const config = getMockExamConfig(id);
  if (!config) {
    const certification = requireCertification(id);
    throw new Error(`Mock exam configuration has not been added for ${certificationTitle(certification)}.`);
  }
  return config;
}

export function findDomain(certificationId: string, domainId: string): CertificationDomain | null {
  return getCertification(certificationId)?.domains.find((domain) => domain.id === domainId) ?? null;
}

export function findDomainLabel(domainId: string, certificationId?: string): string {
  if (certificationId) {
    const match = findDomain(certificationId, domainId);
    if (match) {
      return match.label;
    }
  }
  for (const certification of CERTIFICATIONS) {
    const match = certification.domains.find((domain) => domain.id === domainId);
    if (match) {
      return match.label;
    }
  }
  return domainId;
}

export function findDomainShortLabel(domainId: string, certificationId?: string): string {
  if (certificationId) {
    const match = findDomain(certificationId, domainId);
    if (match) {
      return match.shortLabel;
    }
  }
  for (const certification of CERTIFICATIONS) {
    const match = certification.domains.find((domain) => domain.id === domainId);
    if (match) {
      return match.shortLabel;
    }
  }
  return domainId;
}

export function developmentIdPrefix(certificationId: string): string {
  return `${certificationId}-dev-`;
}
