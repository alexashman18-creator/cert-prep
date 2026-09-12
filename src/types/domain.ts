import { DEFAULT_CERTIFICATION_ID, findDomain, findDomainLabel, findDomainShortLabel } from '@/certifications';

export const AZ900_DOMAIN_IDS = [
  'cloud_concepts',
  'architecture_services',
  'management_governance',
] as const;

/** AZ-900 domain IDs. Other certifications define their own domain strings. */
export const DOMAIN_IDS = AZ900_DOMAIN_IDS;

export type Az900DomainId = (typeof AZ900_DOMAIN_IDS)[number];
export type DomainId = string;

export const DOMAIN_LABELS: Record<Az900DomainId, string> = {
  cloud_concepts: 'Cloud Concepts',
  architecture_services: 'Azure Architecture & Services',
  management_governance: 'Azure Management & Governance',
};

export const DOMAIN_SHORT_LABELS: Record<Az900DomainId, string> = {
  cloud_concepts: 'Cloud Concepts',
  architecture_services: 'Architecture & Services',
  management_governance: 'Management & Governance',
};

export const DOMAIN_SUMMARIES: Record<Az900DomainId | 'all', string> = {
  all: 'Questions from every domain in this certification',
  cloud_concepts: 'Cloud models, benefits, and shared responsibility',
  architecture_services: 'Compute, networking, storage, and identity',
  management_governance: 'Cost, policy, and resource management',
};

export function isAz900DomainId(value: string): value is Az900DomainId {
  return (AZ900_DOMAIN_IDS as readonly string[]).includes(value);
}

export function isDomainId(value: string): value is DomainId {
  return isAz900DomainId(value);
}

export function domainLabel(domainId: string, certificationId: string = DEFAULT_CERTIFICATION_ID): string {
  return findDomainLabel(domainId, certificationId);
}

export function domainShortLabel(domainId: string, certificationId: string = DEFAULT_CERTIFICATION_ID): string {
  return findDomainShortLabel(domainId, certificationId);
}

export function domainSummary(domainId: string, certificationId: string = DEFAULT_CERTIFICATION_ID): string {
  if (domainId === 'all') {
    return DOMAIN_SUMMARIES.all;
  }
  return findDomain(certificationId, domainId)?.summary ?? '';
}
