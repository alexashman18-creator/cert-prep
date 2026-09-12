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

export function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}
