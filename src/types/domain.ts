export const DOMAIN_IDS = [
  'cloud_concepts',
  'architecture_services',
  'management_governance',
] as const;

export type DomainId = (typeof DOMAIN_IDS)[number];

export const DOMAIN_LABELS: Record<DomainId, string> = {
  cloud_concepts: 'Cloud Concepts',
  architecture_services: 'Azure Architecture & Services',
  management_governance: 'Azure Management & Governance',
};

export const DOMAIN_SHORT_LABELS: Record<DomainId, string> = {
  cloud_concepts: 'Cloud Concepts',
  architecture_services: 'Architecture & Services',
  management_governance: 'Management & Governance',
};

export const DOMAIN_SUMMARIES: Record<DomainId | 'all', string> = {
  all: 'Questions from every AZ-900 domain',
  cloud_concepts: 'Cloud models, benefits, and shared responsibility',
  architecture_services: 'Compute, networking, storage, and identity',
  management_governance: 'Cost, policy, and resource management',
};

export function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}
