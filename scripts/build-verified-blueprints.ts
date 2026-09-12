/**
 * Builds verified certification blueprints from official Microsoft Learn
 * study-guide outlines captured on 12 September 2026.
 *
 * Domain weights are normalized midpoints of Microsoft's published ranges
 * so they sum to 1 (required by the validator). Official ranges are stored
 * separately as weightRange. contentTargetCount values are internal
 * content-bank planning totals, not Microsoft exam question counts.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { difficultyMixForLevel } from '@/content/blueprints/launchTargets';
import { BLUEPRINT_SCHEMA_VERSION } from '@/content/blueprints/types';
import { assertValidBlueprint } from '@/content/blueprints/validate';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'content/blueprints');
const VERIFIED_DATE = '2026-09-12';
const EXAM_DURATION_DOC =
  'https://learn.microsoft.com/credentials/support/exam-duration-exam-experience';
const TYPICAL_QUESTION_RANGE_NOTE =
  'Microsoft states that most certification exams typically contain 40–60 questions, and that the number can vary by exam. That is not a per-exam official count.';

interface OutlineObjective {
  label: string;
  subobjectives: string[];
}

interface OutlineDomain {
  label: string;
  range: string;
  objectives: OutlineObjective[];
}

interface CertSpec {
  certificationId: string;
  examCode: string;
  displayName: string;
  level: 'fundamentals' | 'associate' | 'expert';
  contentTargetCount: number;
  skillsOutlineEffectiveDate: string | null;
  studyGuideUrl: string;
  examUrl: string;
  certificationUrl: string;
  officialExamDurationMinutes: number | null;
  notes: string[];
  domains: OutlineDomain[];
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72)
    .replace(/_+$/g, '');
}

function uniqueId(label: string, used: Set<string>): string {
  const base = slug(label) || 'item';
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}_${n++}`;
  }
  used.add(id);
  return id;
}

function parseRange(range: string): { min: number; max: number; mid: number; label: string } {
  const match = range.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (!match) {
    throw new Error(`Cannot parse official weight range: ${range}`);
  }
  const minPct = Number(match[1]);
  const maxPct = Number(match[2]);
  return {
    min: minPct / 100,
    max: maxPct / 100,
    mid: (minPct + maxPct) / 200,
    label: `${minPct}–${maxPct}%`,
  };
}

function normalizeWeights(mids: number[]): number[] {
  const sum = mids.reduce((a, b) => a + b, 0);
  const raw = mids.map((mid) => mid / sum);
  const rounded = raw.map((weight) => Math.round(weight * 1_000_000) / 1_000_000);
  const head = rounded.slice(0, -1);
  const last = Math.round((1 - head.reduce((a, b) => a + b, 0)) * 1_000_000) / 1_000_000;
  return [...head, last];
}

function allocate(total: number, weights: number[]): number[] {
  if (weights.length === 0) {
    return [];
  }
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const normalized = weights.map((weight) => weight / weightSum);
  const exact = normalized.map((weight) => total * weight);
  const floors = exact.map((value) => Math.floor(value));
  const remaining = total - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const result = [...floors];
  for (let i = 0; i < remaining; i += 1) {
    result[order[i % order.length]!.index] += 1;
  }
  return result;
}

function allocatePreferMinOne(total: number, count: number): number[] {
  if (count === 0) {
    return [];
  }
  if (total >= count) {
    const base = Array.from({ length: count }, () => 1);
    const extra = allocate(total - count, Array.from({ length: count }, () => 1));
    return base.map((value, index) => value + extra[index]!);
  }
  return allocate(total, Array.from({ length: count }, () => 1));
}

function studyGuide(code: string): string {
  return `https://learn.microsoft.com/credentials/certifications/resources/study-guides/${code}`;
}

function examUrl(code: string): string {
  return `https://learn.microsoft.com/credentials/certifications/exams/${code}/`;
}

const SPECS: CertSpec[] = [
  {
    certificationId: 'dp900',
    examCode: 'DP-900',
    displayName: 'Azure Data Fundamentals',
    level: 'fundamentals',
    contentTargetCount: 350,
    skillsOutlineEffectiveDate: '2026-07-21',
    studyGuideUrl: studyGuide('dp-900'),
    examUrl: examUrl('dp-900'),
    certificationUrl: 'https://learn.microsoft.com/credentials/certifications/azure-data-fundamentals/',
    officialExamDurationMinutes: 45,
    notes: [
      'Skills outline taken from the official DP-900 study guide heading “Skills measured as of July 21, 2026”.',
      'Domain 4 glance title is “Describe an analytics workload on Azure”; the later H2 omits “on Azure”. The glance/skills-at-a-glance wording is stored as the domain label.',
      'Official certification page states 45 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Describe core data concepts',
        range: '25–30',
        objectives: [
          {
            label: 'Describe ways to represent data',
            subobjectives: [
              'Describe the features of structured data',
              'Describe the features of semi-structured data',
              'Describe the features of unstructured data',
            ],
          },
          {
            label: 'Identify options for data storage',
            subobjectives: [
              'Describe common formats for data files',
              'Describe features of common data stores including databases',
              'Identify Azure datastores for common use cases',
            ],
          },
          {
            label: 'Describe common data workloads',
            subobjectives: [
              'Describe features of transactional workloads',
              'Describe features of analytical workloads',
            ],
          },
          {
            label: 'Identify roles and responsibilities for data workloads',
            subobjectives: [
              'Describe responsibilities for database administrators',
              'Describe responsibilities for data engineers',
              'Describe responsibilities for data analysts',
            ],
          },
        ],
      },
      {
        label: 'Identify considerations for relational data on Azure',
        range: '20–25',
        objectives: [
          {
            label: 'Describe relational concepts',
            subobjectives: [
              'Identify features of relational data',
              'Describe normalization and why it is used',
              'Identify common structured query language (SQL) statements',
              'Identify common database objects',
            ],
          },
          {
            label: 'Describe relational Azure data services',
            subobjectives: [
              'Describe the Azure SQL family of products, including Azure SQL Database, Azure SQL Managed Instance, and SQL Server on Azure Virtual Machines',
              'Identify Azure database services for open-source database systems',
            ],
          },
        ],
      },
      {
        label: 'Describe considerations for working with non-relational data on Azure',
        range: '15–20',
        objectives: [
          {
            label: 'Describe the capabilities of Azure storage',
            subobjectives: [
              'Describe features of Azure Blob storage',
              'Describe features of Azure Files',
              'Describe features of Azure Table storage',
            ],
          },
          {
            label: 'Describe the capabilities and features of Azure Cosmos DB',
            subobjectives: [
              'Identify use cases for Azure Cosmos DB',
              'Describe Azure Cosmos DB APIs',
            ],
          },
        ],
      },
      {
        label: 'Describe an analytics workload on Azure',
        range: '25–30',
        objectives: [
          {
            label: 'Describe common elements of large-scale analytics',
            subobjectives: [
              'Describe considerations for data ingestion and processing',
              'Describe options for analytical data stores',
              'Describe Microsoft cloud services for large-scale analytics, including Azure Databricks and Microsoft Fabric',
            ],
          },
          {
            label: 'Describe considerations for real-time data analytics',
            subobjectives: [
              'Describe the difference between batch and streaming data',
              'Identify Microsoft cloud services for real-time analytics',
            ],
          },
          {
            label: 'Describe data visualization in Microsoft Power BI',
            subobjectives: [
              'Identify the capabilities of Power BI',
              'Describe features of data models in Power BI',
              'Identify appropriate visualizations for data',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'ai901',
    examCode: 'AI-901',
    displayName: 'Azure AI Fundamentals',
    level: 'fundamentals',
    contentTargetCount: 350,
    skillsOutlineEffectiveDate: '2026-04-15',
    studyGuideUrl: studyGuide('ai-901'),
    examUrl: examUrl('ai-901'),
    certificationUrl: 'https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/',
    officialExamDurationMinutes: null,
    notes: [
      'Skills outline taken from the official AI-901 study guide heading “Skills measured as of April 15, 2026”.',
      'AI-900 is the prior Azure AI Fundamentals exam. This blueprint uses the current AI-901 exam only.',
      'The fetched AI-901 exam and certification pages did not state a per-exam duration. Microsoft’s generic fundamentals table lists 45 minutes exam duration / 65 minutes seat duration; that table is not recorded here as an AI-901-specific official value.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Identify AI concepts and capabilities',
        range: '40–45',
        objectives: [
          {
            label: 'Describe principles of responsible AI',
            subobjectives: [
              'Describe considerations for fairness in an AI solution',
              'Describe considerations for reliability and safety in an AI solution',
              'Describe considerations for privacy and security in an AI solution',
              'Describe considerations for inclusiveness in an AI solution',
              'Describe considerations for transparency in an AI solution',
              'Describe considerations for accountability in an AI solution',
            ],
          },
          {
            label: 'Identify AI model components and configurations',
            subobjectives: [
              'Describe how generative AI models work',
              'Identify an appropriate AI model, based on capabilities',
              'Identify appropriate model deployment options and configuration parameters',
            ],
          },
          {
            label: 'Identify AI workloads',
            subobjectives: [
              'Identify scenarios for common AI workloads, including generative and agentic AI, text analysis, speech, computer vision, and information extraction',
              'Describe common text analysis techniques, including keyword extraction, entity detection, sentiment analysis, and summarization',
              'Identify features and capabilities of speech recognition and speech synthesis',
              'Identify features and capabilities of computer vision and image-generation models',
              'Identify techniques to extract information from text, images, audio, and videos',
            ],
          },
        ],
      },
      {
        label: 'Implement AI solutions by using Microsoft Foundry',
        range: '55–60',
        objectives: [
          {
            label: 'Implement generative AI apps and agents by using Foundry',
            subobjectives: [
              'Create effective system and user prompts for generative AI models',
              'Deploy a model and interact with it in the Foundry portal',
              'Create a lightweight chat client application by using the Foundry SDK',
              'Create and test a single-agent solution in the Foundry portal',
              'Create a lightweight client application for an agent',
            ],
          },
          {
            label: 'Implement AI solutions for text and speech by using Foundry',
            subobjectives: [
              'Build a lightweight application that includes text analysis',
              'Respond to spoken prompts by using a deployed multimodal model',
              'Build a lightweight application by using Azure Speech in Foundry Tools',
            ],
          },
          {
            label: 'Implement AI solutions with computer vision and image-generation capabilities by using Foundry',
            subobjectives: [
              'Interpret visual input in prompts by using a deployed multimodal model',
              'Create new visual outputs by using generative models',
              'Build a lightweight application that includes vision capabilities',
            ],
          },
          {
            label: 'Implement AI solutions for information extraction by using Foundry',
            subobjectives: [
              'Extract information from documents and forms by using Azure Content Understanding in Foundry Tools',
              'Extract information from images by using Content Understanding',
              'Extract information from audio and video by using Content Understanding',
              'Build a lightweight application with information extraction capabilities by using Content Understanding',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'az104',
    examCode: 'AZ-104',
    displayName: 'Azure Administrator Associate',
    level: 'associate',
    contentTargetCount: 500,
    skillsOutlineEffectiveDate: '2026-04-17',
    studyGuideUrl: studyGuide('az-104'),
    examUrl: examUrl('az-104'),
    certificationUrl: 'https://learn.microsoft.com/credentials/certifications/azure-administrator/',
    officialExamDurationMinutes: 100,
    notes: [
      'Skills outline taken from the official AZ-104 study guide heading “Skills measured as of April 17, 2026”.',
      'Official certification name is Microsoft Certified: Azure Administrator Associate.',
      'Official certification page states 100 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Manage Azure identities and governance',
        range: '20–25',
        objectives: [
          {
            label: 'Manage Microsoft Entra users and groups',
            subobjectives: [
              'Create users and groups',
              'Manage user and group properties',
              'Manage licenses in Microsoft Entra ID',
              'Manage external users',
              'Configure self-service password reset (SSPR)',
            ],
          },
          {
            label: 'Manage access to Azure resources',
            subobjectives: [
              'Manage built-in Azure roles',
              'Assign roles at different scopes',
              'Interpret access assignments',
            ],
          },
          {
            label: 'Manage Azure subscriptions and governance',
            subobjectives: [
              'Implement and manage Azure Policy',
              'Configure resource locks',
              'Apply and manage tags on resources',
              'Manage resource groups',
              'Manage subscriptions',
              'Manage costs by using alerts, budgets, and Azure Advisor recommendations',
              'Configure management groups',
            ],
          },
        ],
      },
      {
        label: 'Implement and manage storage',
        range: '15–20',
        objectives: [
          {
            label: 'Configure access to storage',
            subobjectives: [
              'Configure Azure Storage firewalls and virtual networks',
              'Create and use shared access signature (SAS) tokens',
              'Configure stored access policies',
              'Manage access keys',
              'Configure identity-based access for Azure Files',
            ],
          },
          {
            label: 'Configure and manage storage accounts',
            subobjectives: [
              'Create and configure storage accounts',
              'Configure Azure Storage redundancy',
              'Configure object replication',
              'Configure storage account encryption',
              'Manage data by using Azure Storage Explorer and AzCopy',
            ],
          },
          {
            label: 'Configure Azure Files and Azure Blob Storage',
            subobjectives: [
              'Create and configure a file share in Azure Files',
              'Create and configure a container in Azure Blob Storage',
              'Configure storage tiers',
              'Configure soft delete for blobs and containers',
              'Configure snapshots and soft delete for Azure Files',
              'Configure blob lifecycle management',
              'Configure blob versioning',
            ],
          },
        ],
      },
      {
        label: 'Deploy and manage Azure compute resources',
        range: '20–25',
        objectives: [
          {
            label: 'Automate deployment of resources by using Azure Resource Manager (ARM) templates or Bicep files',
            subobjectives: [
              'Interpret an Azure Resource Manager template or a Bicep file',
              'Modify an existing Azure Resource Manager template',
              'Modify an existing Bicep file',
              'Deploy resources by using an Azure Resource Manager template or a Bicep file',
              'Export a deployment as an Azure Resource Manager template or convert an Azure Resource Manager template to a Bicep file',
            ],
          },
          {
            label: 'Create and configure virtual machines',
            subobjectives: [
              'Create a virtual machine',
              'Configure encryption at host for Azure virtual machines',
              'Move a virtual machine to another resource group, subscription, or region',
              'Manage virtual machine sizes',
              'Manage virtual machine disks',
              'Deploy virtual machines to availability zones and availability sets',
              'Deploy and configure an Azure Virtual Machine Scale Sets',
            ],
          },
          {
            label: 'Provision and manage containers in the Azure portal',
            subobjectives: [
              'Create and manage an Azure Container Registry',
              'Provision a container by using Azure Container Instances',
              'Provision a container by using Azure Container Apps',
              'Manage sizing and scaling for containers, including Azure Container Instances and Azure Container Apps',
            ],
          },
          {
            label: 'Create and configure Azure App Service',
            subobjectives: [
              'Provision an App Service plan',
              'Configure scaling for an App Service plan',
              'Create an App Service',
              'Configure certificates and Transport Layer Security (TLS) for an App Service',
              'Map an existing custom DNS name to an App Service',
              'Configure backup for an App Service',
              'Configure networking settings for an App Service',
              'Configure deployment slots for an App Service',
            ],
          },
        ],
      },
      {
        label: 'Implement and manage virtual networking',
        range: '15–20',
        objectives: [
          {
            label: 'Configure and manage virtual networks in Azure',
            subobjectives: [
              'Create and configure virtual networks and subnets',
              'Create and configure virtual network peering',
              'Configure public IP addresses',
              'Configure user-defined routes',
              'Troubleshoot network connectivity',
            ],
          },
          {
            label: 'Configure secure access to virtual networks',
            subobjectives: [
              'Create and configure network security groups (NSGs) and application security groups',
              'Evaluate effective security rules in NSGs',
              'Implement Azure Bastion',
              'Configure service endpoints for Azure platform as a service (PaaS)',
              'Configure private endpoints for Azure PaaS',
            ],
          },
          {
            label: 'Configure name resolution and load balancing',
            subobjectives: [
              'Configure Azure DNS',
              'Configure an internal or public load balancer',
              'Troubleshoot load balancing',
            ],
          },
        ],
      },
      {
        label: 'Monitor and maintain Azure resources',
        range: '10–15',
        objectives: [
          {
            label: 'Monitor resources in Azure',
            subobjectives: [
              'Interpret metrics in Azure Monitor',
              'Configure log settings in Azure Monitor',
              'Query and analyze logs in Azure Monitor',
              'Set up alert rules, action groups, and alert processing rules in Azure Monitor',
              'Configure and interpret monitoring of virtual machines, storage accounts, and networks by using Azure Monitor Insights',
              'Use Azure Network Watcher and Connection monitor',
            ],
          },
          {
            label: 'Implement backup and recovery',
            subobjectives: [
              'Create a Recovery Services vault',
              'Create an Azure Backup vault',
              'Create and configure a backup policy',
              'Perform backup and restore operations by using Azure Backup',
              'Configure Azure Site Recovery for Azure resources',
              'Perform a failover to a secondary region by using Site Recovery',
              'Configure and interpret reports and alerts for backups',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'ai200',
    examCode: 'AI-200',
    displayName: 'Azure AI Cloud Developer Associate',
    level: 'associate',
    contentTargetCount: 500,
    skillsOutlineEffectiveDate: null,
    studyGuideUrl: studyGuide('ai-200'),
    examUrl: examUrl('ai-200'),
    certificationUrl:
      'https://learn.microsoft.com/credentials/certifications/azure-ai-cloud-developer-associate/',
    officialExamDurationMinutes: 120,
    notes: [
      'The official AI-200 study guide uses a “Skills measured” heading with no “Skills measured as of DATE” line. skillsOutlineEffectiveDate is therefore null.',
      'Skills-at-a-glance lists “Secure, monitor, troubleshoot Azure solutions”; the later official skills heading is “Secure, monitor, and troubleshoot Azure solutions”. The later official heading is stored as the domain label.',
      'Official certification name is Microsoft Certified: Azure AI Cloud Developer Associate. Exam title is Developing AI Cloud Solutions on Azure.',
      'Official certification page states 120 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Develop containerized solutions on Azure',
        range: '20–25',
        objectives: [
          {
            label: 'Implement container application hosting',
            subobjectives: [
              'Build, store, version, and manage container images by using Azure Container Registry',
              'Build and run images by using Azure Container Registry Tasks',
              'Deploy containers to Azure App Service, including configuring App Service to supply environment variables and secrets',
            ],
          },
          {
            label: 'Implement container-orchestrated solutions',
            subobjectives: [
              'Deploy applications to Azure Container Apps, including environment configuration and revision management',
              'Implement event-driven scaling by using Kubernetes Event-driven Autoscaling (KEDA) in Container Apps',
              'Deploy and manage applications to Azure Kubernetes Service (AKS) by using manifest files',
              'Monitor and troubleshoot solutions on AKS and Container Apps by inspecting logs, events, and end-to-end connectivity',
            ],
          },
        ],
      },
      {
        label: 'Develop AI solutions by using Azure data management services',
        range: '25–30',
        objectives: [
          {
            label: 'Develop AI solutions by using Azure Cosmos DB for NoSQL',
            subobjectives: [
              'Connect to Azure Cosmos DB for NoSQL by using the SDK and run queries',
              'Optimize query performance and Request Units (RUs) consumption by using indexing policies and consistency levels',
              'Store and retrieve embeddings and execute vector similarity search for semantic retrieval',
              'Implement a change feed processor to detect and handle new or updated items',
            ],
          },
          {
            label: 'Develop AI solutions by using Azure Database for PostgreSQL',
            subobjectives: [
              'Connect and query Azure Database for PostgreSQL by using SDKs',
              'Model schemas and implement indexing strategies, including designing tables and choosing appropriate data types',
              'Implement indexing strategies, including optimizing query latency and reducing pgvector compute overhead',
              'Configure compute, memory, and storage resources to support vector workloads',
              'Run vector similarity search, including storing embeddings, semantic retrieval, and implementing retrieval-augmented generation (RAG) patterns by using metadata filter',
              'Implement connection optimization to improve throughput and minimize latency',
            ],
          },
          {
            label: 'Integrate Azure Managed Redis in AI solutions',
            subobjectives: [
              'Implement Azure Managed Redis data operations, including caching, expiration, and invalidation',
              'Implement vector indexing to enable similarity search',
            ],
          },
        ],
      },
      {
        label: 'Connect to and consume Azure services',
        range: '20–25',
        objectives: [
          {
            label: 'Develop event- and message-based AI solutions',
            subobjectives: [
              'Queue and process back-end operations by using Azure Service Bus, including dead-letter queue handling, messages, topics, and subscriptions',
              'Implement event-driven workflows by using Azure Event Grid, including filters, custom events, and retries',
            ],
          },
          {
            label: 'Develop and implement Azure Functions',
            subobjectives: [
              'Build serverless APIs, including implementing triggers and bindings',
              'Configure and deploy function apps',
            ],
          },
        ],
      },
      {
        label: 'Secure, monitor, and troubleshoot Azure solutions',
        range: '20–25',
        objectives: [
          {
            label: 'Implement secure Azure solutions',
            subobjectives: [
              'Secure secrets by using Azure Key Vault, including rotation and retrieval',
              'Store and retrieve app configuration information by using Azure App Configuration',
            ],
          },
          {
            label: 'Monitor and troubleshoot Azure solutions',
            subobjectives: [
              'Trace distributed systems by using OpenTelemetry SDKs',
              'Write KQL queries to analyze logs and metrics',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'sc500',
    examCode: 'SC-500',
    displayName: 'Cloud and AI Security Engineer Associate',
    level: 'associate',
    contentTargetCount: 500,
    skillsOutlineEffectiveDate: null,
    studyGuideUrl: studyGuide('sc-500'),
    examUrl: examUrl('sc-500'),
    certificationUrl:
      'https://learn.microsoft.com/credentials/certifications/cloud-and-ai-security-engineer-associate/',
    officialExamDurationMinutes: 120,
    notes: [
      'The official SC-500 study guide uses a “Skills measured” heading with no “Skills measured as of DATE” line. skillsOutlineEffectiveDate is therefore null.',
      'Official certification name is Microsoft Certified: Cloud and AI Security Engineer Associate. Exam title is Implementing End-to-End Security Controls for Cloud and AI Workloads.',
      'Official certification page states 120 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Manage identity, access, and governance',
        range: '20–25',
        objectives: [
          {
            label: 'Secure access to resources by using Microsoft Entra ID',
            subobjectives: [
              'Implement and configure Privileged Identity Management (PIM)',
              'Implement conditional access policies',
              'Implement and configure authentication methods, including multifactor authentication (MFA) and passwordless',
              'Implement and configure identity for applications, including enterprise applications and app registrations',
              'Manage OAuth permission grants and consent settings',
              'Implement and configure managed identities for Azure resources',
            ],
          },
          {
            label: 'Secure secrets and keys by using Azure Key Vault',
            subobjectives: [
              'Deploy Key Vault',
              'Configure Key Vault settings',
              'Configure access to Key Vault',
              'Configure firewall settings on Key Vault',
              'Manage keys, secrets, and certificates',
              'Scan for secrets by using Defender Cloud Security Posture Management (Defender CSPM)',
              'Implement Defender for Key Vault',
            ],
          },
          {
            label: 'Implement governance to enforce security and regulatory compliance',
            subobjectives: [
              'Implement and configure security controls by using Azure Policy, including built-in and custom policy definitions',
              'Evaluate regulatory compliance by using Microsoft Defender for Cloud',
              'Implement and configure security controls in Defender for Cloud, including security standards and recommendations',
              'Implement resource locks',
              'Manage Azure built-in role assignments',
              'Manage custom roles, including Azure roles and Microsoft Entra roles',
              'Evaluate and remediate overprivileged access assignments by using Azure role-based access control (RBAC)',
              'Configure security controls for backup protection by using Azure Backup security features',
              'Implement and configure security controls by using infrastructure as code',
            ],
          },
        ],
      },
      {
        label: 'Secure storage, databases, and networking',
        range: '25–30',
        objectives: [
          {
            label: 'Implement security for storage accounts',
            subobjectives: [
              'Implement and configure security for storage accounts',
              'Configure Azure Storage firewall rules',
              'Implement Defender for Storage threat protection configurations',
              'Manage access to storage, including access policies',
            ],
          },
          {
            label: 'Implement security for databases',
            subobjectives: [
              'Implement platform-level security configurations in Azure SQL',
              'Configure database auditing for Azure SQL Database and Azure SQL Managed Instance',
              'Configure Defender for Databases protection across Azure database services',
            ],
          },
          {
            label: 'Implement security for Azure network services',
            subobjectives: [
              'Implement and manage network security groups (NSGs) and application security groups (ASGs)',
              'Implement and configure network access policies by using Azure Virtual Network Manager',
              'Configure security for an Azure Virtual WAN',
              'Implement and configure security for virtual private network (VPN) connections',
              'Implement and configure Microsoft Entra Private Access',
              'Configure Azure private endpoints to secure access to Azure platform as a service (PaaS) resources',
              'Configure Azure Private Link services to secure access to network resources',
              'Implement and configure Azure Firewall',
              'Evaluate effective security rules by using Azure Network Watcher diagnostics',
            ],
          },
        ],
      },
      {
        label: 'Secure compute',
        range: '20–25',
        objectives: [
          {
            label: 'Implement security for AI',
            subobjectives: [
              'Identify overexposure of data in SharePoint',
              'Identify risks related to Microsoft Copilot and AI apps by using Microsoft Purview Data Security Posture Management (DSPM)',
              'Enable and configure real-time protection for Microsoft Copilot Studio agents',
              'Implement conditional access for Microsoft Entra Agent ID',
              'Analyze blast radius for security risks related to Entra Agent ID by using Defender XDR',
              'Manage Entra Agent ID access',
              'Configure and deploy AI Gateway in Azure API Management for Microsoft Foundry',
              'Enable Defender for AI Service in Cloud Workload Protection in Defender for Cloud',
              'Configure guardrails for agent security in Foundry',
              'Monitor AI security by using the Data and AI security dashboard in Defender for Cloud',
              'Manage agents in Microsoft 365 admin center',
            ],
          },
          {
            label: 'Implement security for servers and virtual machines (VMs)',
            subobjectives: [
              'Implement and configure disk encryption',
              'Plan and implement Azure Bastion',
              'Enable and enforce use of just-in-time (JIT) VM access',
              'Extend security controls to hybrid and multicloud servers by using Azure Arc',
              'Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios',
              'Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)',
              'Implement and manage agentless scanning for VMs in Defender for Servers',
              'Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type',
              'Enforce security configuration of Azure-managed servers by using Azure Machine Configuration',
            ],
          },
          {
            label: 'Implement security for application platform services',
            subobjectives: [
              'Detect misconfigurations and runtime risks in container workloads by using Defender for Containers',
              'Implement and configure security controls for Azure Kubernetes Service (AKS)',
              'Implement and configure security controls for Azure Container Registry',
              'Implement and configure security controls for Azure Container Instances and Azure Container Apps',
              'Implement and configure security controls for Azure Functions, including authentication and network access',
              'Implement and configure security controls for Azure Logic Apps',
              'Implement and configure security controls for Azure App Service',
              'Implement and configure Azure Web Application Firewall',
              'Implement security policies for back-end API protection by using API Management',
            ],
          },
        ],
      },
      {
        label: 'Manage and monitor security posture',
        range: '20–25',
        objectives: [
          {
            label: 'Manage security posture by using Defender for Cloud',
            subobjectives: [
              'Identify security risks by using Defender CSPM',
              'Evaluate compliance against security frameworks by using Defender for Cloud',
              'Enable and configure Defender for Cloud workload protection plans',
              'Connect hybrid cloud and multicloud environments to Defender for Cloud, including Amazon Web Services (AWS) and Google Cloud Platform (GCP)',
              'Configure Microsoft Defender Vulnerability Management settings for Azure VMs',
              'Discover unprotected assets and vulnerabilities by using Microsoft Defender External Attack Surface Management (EASM)',
            ],
          },
          {
            label: 'Implement activity and event collection in Microsoft Sentinel',
            subobjectives: [
              'Create and connect workspaces in Microsoft Sentinel',
              'Assign roles in Microsoft Sentinel',
              'Implement and use content hub solutions',
              'Configure and use Microsoft data connectors for Azure resources',
              'Implement and configure syslog and Common Event Format (CEF) event collections',
              'Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)',
              'Create custom log tables in the workspace to store ingested data',
              'Implement automation rules and playbooks in Microsoft Sentinel',
              'Implement data retention in Microsoft Sentinel data stores',
              'Query Microsoft Purview Audit in Defender XDR',
            ],
          },
          {
            label: 'Implement Microsoft Security Copilot',
            subobjectives: [
              'Configure workspaces for Security Copilot',
              'Manage permissions and roles in Security Copilot',
              'Enable and configure plugins',
              'Enable and configure Microsoft agents and Security Store agents',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'dp300',
    examCode: 'DP-300',
    displayName: 'Azure Database Administrator Associate',
    level: 'associate',
    contentTargetCount: 450,
    skillsOutlineEffectiveDate: '2026-04-24',
    studyGuideUrl: studyGuide('dp-300'),
    examUrl: examUrl('dp-300'),
    certificationUrl:
      'https://learn.microsoft.com/credentials/certifications/azure-database-administrator-associate/',
    officialExamDurationMinutes: 100,
    notes: [
      'Skills outline taken from the official DP-300 study guide heading “Skills measured as of April 24, 2026”.',
      'Official exam title is Administering Microsoft Azure SQL Solutions.',
      'Official certification page states 100 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Plan and implement data platform resources',
        range: '15–20',
        objectives: [
          {
            label: 'Plan and deploy Azure SQL solutions',
            subobjectives: [
              'Recommend a database offering based on specific requirements',
              'Choose an automated deployment method',
              'Identify use cases for Azure Arc-enabled SQL services',
              'Identify use cases for Azure SQL Database in Microsoft Fabric',
              'Plan for table partitioning',
              'Recommend a database sharding solution',
              'Deploy database offerings on selected platforms',
              'Deploy hybrid SQL Server solutions',
              'Apply patches and updates for hybrid and infrastructure as a service (IaaS) deployment',
            ],
          },
          {
            label: 'Configure resources for scale and performance',
            subobjectives: [
              'Configure Azure SQL Database for scale and performance',
              'Configure Azure SQL Managed Instance for scale and performance',
              'Configure SQL Server on Azure Virtual Machines for scale and performance',
              'Configure table partitioning',
              'Configure data compression',
            ],
          },
          {
            label: 'Plan and implement a migration strategy',
            subobjectives: [
              'Evaluate requirements for a migration',
              'Evaluate offline or online migration strategies',
              'Implement an online migration strategy',
              'Implement an offline migration strategy',
              'Implement a migration to Azure',
              'Implement a migration between Azure SQL services',
              'Implement Azure SQL Managed Instance database copy and move',
              'Troubleshoot a migration',
            ],
          },
        ],
      },
      {
        label: 'Implement a secure environment',
        range: '20–25',
        objectives: [
          {
            label: 'Configure database authentication and authorization',
            subobjectives: [
              'Configure Microsoft Entra ID authentication for Azure SQL Database, Azure SQL Managed Instance, and SQL Server',
              'Configure authentication for SQL on Azure VMs and Azure SQL Managed Instance',
              'Configure security principals',
              'Create users from Microsoft Entra identities',
              'Configure database and object-level permissions using graphical tools',
              'Apply the principle of least privilege for all securables',
              'Troubleshoot authentication and authorization issues',
              'Manage authentication and authorization by using T-SQL',
            ],
          },
          {
            label: 'Implement security for data at rest and data in transit',
            subobjectives: [
              'Implement transparent data encryption (TDE)',
              'Implement object-level encryption',
              'Configure server- and database-level firewall rules',
              'Implement Always Encrypted',
              'Implement Always Encrypted with VBS enclaves',
              'Configure private links and service endpoints',
            ],
          },
          {
            label: 'Implement compliance controls for sensitive data',
            subobjectives: [
              'Apply a data classification strategy',
              'Configure server and database audits',
              'Implement change data tracking',
              'Implement dynamic data masking',
              'Implement ledger in Azure SQL',
              'Implement row-level security',
            ],
          },
        ],
      },
      {
        label: 'Monitor, configure, and optimize database resources',
        range: '20–25',
        objectives: [
          {
            label: 'Monitor resource activity and performance',
            subobjectives: [
              'Prepare an operational performance baseline',
              'Determine sources for performance metrics',
              'Interpret performance metrics',
              'Configure and monitor activity and performance',
              'Monitor by using database watcher',
              'Monitor by using Extended Events',
            ],
          },
          {
            label: 'Monitor and optimize query performance',
            subobjectives: [
              'Configure Query Store',
              'Monitor by using Query Store',
              'Identify and resolve session blocking',
              'Identify performance issues using dynamic management views (DMVs)',
              'Identify and implement index changes for queries',
              'Recommend query construct modifications based on resource usage',
              'Review execution plans',
              'Monitor by using Intelligent Insights',
            ],
          },
          {
            label: 'Configure database solutions for optimal performance',
            subobjectives: [
              'Implement index maintenance tasks',
              'Implement statistics maintenance tasks',
              'Implement database integrity checks',
              'Configure database automatic tuning',
              'Configure server settings for performance',
              'Configure Resource Governor for performance',
              'Implement database-scoped configuration',
              'Configure compute and storage resources for scaling',
              'Identify use cases for intelligent query processing (IQP) features',
            ],
          },
        ],
      },
      {
        label: 'Configure and manage automation of tasks',
        range: '15–20',
        objectives: [
          {
            label: 'Create and manage SQL Server Agent jobs',
            subobjectives: [
              'Manage schedules for regular maintenance jobs',
              'Configure job alerts and notifications',
              'Troubleshoot SQL Server Agent jobs',
            ],
          },
          {
            label: 'Automate deployment of database resources',
            subobjectives: [
              'Automate deployment by using Azure Resource Manager (ARM) and Bicep templates',
              'Automate deployment by using Azure PowerShell',
              'Automate deployment by using Azure CLI',
              'Monitor and troubleshoot deployments',
            ],
          },
          {
            label: 'Create and manage database tasks in Azure',
            subobjectives: [
              'Create and configure elastic jobs',
              'Create and configure database tasks by using automation',
              'Configure alerts and notifications on database tasks',
              'Troubleshoot automated database tasks',
            ],
          },
        ],
      },
      {
        label: 'Plan and configure a high availability and disaster recovery (HA/DR) environment',
        range: '20–25',
        objectives: [
          {
            label: 'Plan an HA/DR strategy for database solutions',
            subobjectives: [
              'Recommend HA/DR strategy based on Recovery Point Objective/Recovery Time Objective (RPO/RTO) requirements',
              'Evaluate HA/DR for hybrid deployments',
              'Evaluate Azure-specific HA/DR solutions',
              'Plan a testing procedure for an HA/DR solution',
            ],
          },
          {
            label: 'Plan and perform backup and restore of a database',
            subobjectives: [
              'Recommend a database backup and restore strategy',
              'Perform a database backup by using native tools',
              'Perform a database restore by using native tools',
              'Perform a database restore to a point in time',
              'Configure long-term backup retention',
              'Backup and restore a database by using T-SQL',
              'Backup to and restore from cloud storage',
            ],
          },
          {
            label: 'Configure HA/DR for database solutions',
            subobjectives: [
              'Configure active geo-replication',
              'Configure Always On availability groups on SQL Managed Instance and Azure virtual machines',
              'Configure failover groups',
              'Configure Always On Failover Cluster Instances on Azure virtual machines',
              'Configure log shipping',
              'Monitor an HA/DR solution',
              'Troubleshoot an HA/DR solution',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'dp700',
    examCode: 'DP-700',
    displayName: 'Fabric Data Engineer Associate',
    level: 'associate',
    contentTargetCount: 450,
    skillsOutlineEffectiveDate: '2026-07-21',
    studyGuideUrl: studyGuide('dp-700'),
    examUrl: examUrl('dp-700'),
    certificationUrl:
      'https://learn.microsoft.com/credentials/certifications/fabric-data-engineer-associate/',
    officialExamDurationMinutes: 100,
    notes: [
      'Skills outline taken from the official DP-700 study guide heading “Skills measured as of July 21, 2026”.',
      'Official exam title is Implementing Data Engineering Solutions Using Microsoft Fabric.',
      'Official certification page states 100 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Implement and manage an analytics solution',
        range: '30–35',
        objectives: [
          {
            label: 'Configure Microsoft Fabric workspace settings',
            subobjectives: [
              'Configure Spark workspace settings',
              'Configure domain workspace settings',
              'Configure OneLake workspace settings',
              'Configure Apache Airflow workspace settings',
            ],
          },
          {
            label: 'Implement lifecycle management in Fabric',
            subobjectives: [
              'Configure version control',
              'Implement database projects',
              'Create and configure deployment pipelines',
            ],
          },
          {
            label: 'Configure security and governance',
            subobjectives: [
              'Implement workspace-level access controls',
              'Implement item-level access controls',
              'Implement row-level, column-level, object-level, and folder/file-level access controls',
              'Implement dynamic data masking',
              'Apply sensitivity labels to items',
              'Endorse items',
              'Implement and use Microsoft Fabric audit logs',
              'Configure and implement OneLake security',
            ],
          },
          {
            label: 'Orchestrate processes',
            subobjectives: [
              'Choose between Dataflow gen 2, a pipeline and a notebook',
              'Design and implement schedules and event-based triggers',
              'Implement orchestration patterns with notebooks and pipelines, including parameters and dynamic expressions',
            ],
          },
        ],
      },
      {
        label: 'Ingest and transform data',
        range: '30–35',
        objectives: [
          {
            label: 'Design and implement loading patterns',
            subobjectives: [
              'Design and implement full and incremental data loads',
              'Prepare data for loading into a dimensional model',
              'Design and implement a loading pattern for streaming data',
            ],
          },
          {
            label: 'Ingest and transform batch data',
            subobjectives: [
              'Choose an appropriate data store',
              'Choose between Dataflows Gen2, notebooks, KQL, and T-SQL for data transformation',
              'Create and manage OneLake shortcuts',
              'Implement mirroring',
              'Ingest data by using pipelines',
              'Transform data by using PySpark, SQL, and KQL',
              'Denormalize data',
              'Group and aggregate data',
              'Handle duplicate, missing, and late-arriving data',
            ],
          },
          {
            label: 'Ingest and transform streaming data',
            subobjectives: [
              'Choose an appropriate streaming engine',
              'Choose between native tables and OneLake shortcuts in Real-Time Intelligence',
              'Choose between Query acceleration for OneLake shortcuts and standard OneLake shortcuts in Real-Time Intelligence',
              'Process data by using Eventstreams',
              'Process data by using Spark structured streaming',
              'Process data by using KQL',
              'Create windowing functions',
            ],
          },
        ],
      },
      {
        label: 'Monitor and optimize an analytics solution',
        range: '30–35',
        objectives: [
          {
            label: 'Monitor Fabric items',
            subobjectives: [
              'Monitor data ingestion',
              'Monitor data transformation',
              'Monitor semantic model refresh',
              'Configure alerts',
            ],
          },
          {
            label: 'Identify and resolve errors',
            subobjectives: [
              'Identify and resolve pipeline errors',
              'Identify and resolve Dataflow Gen2 errors',
              'Identify and resolve notebook errors',
              'Identify and resolve Eventhouse errors',
              'Identify and resolve Eventstream errors',
              'Identify and resolve T-SQL errors',
              'Identify and resolve OneLake shortcut errors',
            ],
          },
          {
            label: 'Optimize performance',
            subobjectives: [
              'Optimize a Lakehouse table',
              'Optimize a pipeline',
              'Optimize a data warehouse',
              'Optimize Eventstreams and Eventhouses',
              'Optimize Spark performance',
              'Optimize query performance',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'ai103',
    examCode: 'AI-103',
    displayName: 'Azure AI Apps and Agents Developer Associate',
    level: 'associate',
    contentTargetCount: 500,
    skillsOutlineEffectiveDate: '2026-04-16',
    studyGuideUrl: studyGuide('AI-103'),
    examUrl: examUrl('ai-103'),
    certificationUrl:
      'https://learn.microsoft.com/credentials/certifications/azure-ai-apps-and-agents-developer-associate/',
    officialExamDurationMinutes: 120,
    notes: [
      'Skills outline taken from the official AI-103 study guide heading “Skills measured as of April 16, 2026”.',
      'Official certification name is Microsoft Certified: Azure AI Apps and Agents Developer Associate. Exam title is Developing AI Apps and Agents on Azure. The product catalog still uses the shorter “Azure AI Engineer” label.',
      'Official certification page states 120 minutes to complete the assessment.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Plan and manage an Azure AI solution',
        range: '25–30',
        objectives: [
          {
            label: 'Choose the appropriate Foundry services for generative AI and agents',
            subobjectives: [
              'Choose an appropriate model for each task, including large language models (LLMs), small language models, multimodal models, and Foundry Tools',
              'Choose the appropriate Foundry services for generative tasks, grounding, vector search, agent workflows, or multimodal processing',
              'Choose an appropriate method for retrieval and indexing',
              'Choose appropriate memory, tool, and knowledge integration services for agent solutions',
            ],
          },
          {
            label: 'Set up AI solutions in Foundry',
            subobjectives: [
              'Design Azure infrastructure for AI apps and agent-based solutions',
              'Choose appropriate deployment options',
              'Configure model and agent deployments',
              'Integrate Foundry projects with continuous integration and continuous deployment (CI/CD) pipelines',
            ],
          },
          {
            label: 'Manage, monitor, and secure AI systems',
            subobjectives: [
              'Manage quotas, scaling, rate limits, and cost footprints for model and agent workloads',
              'Monitor model performance, drift, safety events, and grounding quality',
              'Monitor data ingestion quality, search index health, and relevance performance',
              'Configure security, including managed identity, private networking, keyless credentials, and role policies',
            ],
          },
          {
            label: 'Implement responsible AI across generative AI and agentic systems',
            subobjectives: [
              'Configure safety filters, guardrails, risk detection, and content moderation',
              'Apply responsible AI instrumentation, including evaluators, safety evaluations, and explanation tooling',
              'Implement auditing through trace logging, provenance metadata, and approval workflows',
              'Govern agent behavior with oversight modes, constraints, and tool-access controls',
            ],
          },
        ],
      },
      {
        label: 'Implement generative AI and agentic solutions',
        range: '30–35',
        objectives: [
          {
            label: 'Build generative applications by using Foundry',
            subobjectives: [
              'Deploy and consume LLMs, small models, code models, and multimodal models',
              'Implement retrieval-augmented generation (RAG) in an application',
              'Design workflows, tool-augmented flows, and multistep reasoning pipelines',
              'Evaluate models and apps, including detecting fabrications, relevance, quality, and safety',
              'Integrate generative workflows into applications by using Foundry SDKs and connectors',
              'Configure an application to connect to a Foundry project',
            ],
          },
          {
            label: 'Build agents by using Foundry',
            subobjectives: [
              'Define agent roles, goals, conversation-tracking approach, and tool schemas',
              'Build agents that integrate retrieval, function-calling, and conversation memory',
              'Integrate agent tools, including APIs, knowledge stores, search, content understanding, and custom functions',
              'Implement orchestrated multi-agent solutions',
              'Build autonomous or semiautonomous workflows with safeguards and approval flow controls',
              'Integrate monitoring into deployed agents, evaluate agent behavior, and perform error analysis',
            ],
          },
          {
            label: 'Optimize and operationalize generative AI systems',
            subobjectives: [
              'Tune generation behavior, such as prompt engineering and adjusting model parameters',
              'Implement model reflection, chain-of-thought evaluations, and self-critique loops',
              'Set up observability by implementing tracing, token analytics, safety signals, and latency breakdowns',
              'Orchestrate multiple models, flows, or hybrid LLM and rules engines',
            ],
          },
        ],
      },
      {
        label: 'Implement computer vision solutions',
        range: '10–15',
        objectives: [
          {
            label: 'Design and implement image- and video-generation solutions',
            subobjectives: [
              'Implement a solution that generates images from text prompts and reference media',
              'Implement a solution that generates videos from text prompts and reference media',
              'Configure image-editing workflows, including inpainting, mask-based edits, and prompt-driven modifications',
              'Implement workflows to edit generated videos',
              'Select and apply appropriate generation and editing controls provided by the platform',
            ],
          },
          {
            label: 'Design and implement multimodal understanding workflows',
            subobjectives: [
              'Build a solution that analyzes visual context by using multimodal models',
              'Configure apps to produce concise or detailed captions for single or multiple images',
              'Implement a solution that enables question-answering grounded in visual evidence',
              'Configure generation of alt-text and extended image descriptions aligned to accessibility guidelines',
              'Implement visual understanding by configuring Azure Content Understanding in Foundry Tools to extract visual characteristics',
              'Implement video analysis workflows to process and interpret video segments',
              'Configure single-task and pro-mode Content Understanding pipelines',
              'Implement solutions that identify objects, components, or regions within images or video',
            ],
          },
          {
            label: 'Implement responsible AI for multimodal content',
            subobjectives: [
              'Implement filters to classify unsafe or disallowed visual content',
              'Detect and mitigate indirect prompt injection by using embedded text in images',
              'Enforce visual policy rules, such as applying watermarks, flagging prohibited symbols, upholding brand usage requirements, and detecting potentially inappropriate content',
            ],
          },
        ],
      },
      {
        label: 'Implement text analysis solutions',
        range: '10–15',
        objectives: [
          {
            label: 'Apply language model text analysis',
            subobjectives: [
              'Implement solutions to extract entities, topics, summaries, and structured JSON outputs by using generative prompting and Foundry Tools',
              'Configure detection of sentiment, tone, safety issues, and sensitive content',
              'Build solutions that translate text by using Azure Translator in Foundry Tools or LLM-powered translation flows',
              'Customize language model outputs for domain tasks, such as compliance summarization and domain extraction',
            ],
          },
          {
            label: 'Implement speech solutions',
            subobjectives: [
              'Implement workflows to convert speech to text and text to speech for agentic interactions',
              'Integrate speech as an agent modality, including custom speech models',
              'Enable multimodal reasoning from audio inputs',
              'Translate speech into other languages by using language models and Foundry Tools',
            ],
          },
        ],
      },
      {
        label: 'Implement information extraction solutions',
        range: '10–15',
        objectives: [
          {
            label: 'Build retrieval and grounding pipelines',
            subobjectives: [
              'Ingest and index content, such as documents, images, audio, and video',
              'Configure semantic search, hybrid search, and vector search for grounding',
              'Implement enrichment by using custom or built-in skills for text, images, and layout',
              'Configure RAG ingestion flow, including documents and using optical character recognition (OCR)',
              'Connect retrieval pipelines directly to workflows and agent tools',
            ],
          },
          {
            label: 'Extract content from documents',
            subobjectives: [
              'Extract information by using multimodal pipelines that combine OCR, layout analysis, and field extraction',
              'Produce clean, grounded representations to use with agents and RAG by using Content Understanding',
              'Implement analyzers for generating structured or markdown outputs for downstream reasoning by using Content Understanding',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'az305',
    examCode: 'AZ-305',
    displayName: 'Azure Solutions Architect Expert',
    level: 'expert',
    contentTargetCount: 450,
    skillsOutlineEffectiveDate: '2026-04-17',
    studyGuideUrl: studyGuide('az-305'),
    examUrl: examUrl('az-305'),
    certificationUrl: 'https://learn.microsoft.com/credentials/certifications/azure-solutions-architect/',
    officialExamDurationMinutes: null,
    notes: [
      'Skills outline taken from the official AZ-305 study guide heading “Skills measured as of April 17, 2026”.',
      'Official certification name is Microsoft Certified: Azure Solutions Architect Expert. Exam title is Designing Microsoft Azure Infrastructure Solutions.',
      'The fetched AZ-305 exam and certification pages did not state a per-exam duration. Microsoft’s generic associate/expert table lists 100 or 120 minutes depending on labs; that table is not recorded here as an AZ-305-specific official value.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Design identity, governance, and monitoring solutions',
        range: '25–30',
        objectives: [
          {
            label: 'Design solutions for logging and monitoring',
            subobjectives: [
              'Recommend a logging solution',
              'Recommend a solution for routing logs',
              'Recommend a monitoring solution',
            ],
          },
          {
            label: 'Design authentication and authorization solutions',
            subobjectives: [
              'Recommend an authentication solution',
              'Recommend an identity management solution',
              'Recommend a solution for authorizing access to Azure resources',
              'Recommend a solution for authorizing access to on-premises resources',
              'Recommend a solution to manage secrets, certificates, and keys',
            ],
          },
          {
            label: 'Design governance',
            subobjectives: [
              'Recommend a structure for management groups, subscriptions, and resource groups, and a strategy for resource tagging',
              'Recommend a solution for managing compliance',
              'Recommend a solution for identity governance',
            ],
          },
        ],
      },
      {
        label: 'Design data storage solutions',
        range: '20–25',
        objectives: [
          {
            label: 'Design data storage solutions for relational data',
            subobjectives: [
              'Recommend a solution for storing relational data',
              'Recommend a database service tier and compute tier',
              'Recommend a solution for database scalability',
              'Recommend a solution for data protection',
            ],
          },
          {
            label: 'Design data storage solutions for semi-structured and unstructured data',
            subobjectives: [
              'Recommend a solution for storing semi-structured data',
              'Recommend a solution for storing unstructured data',
              'Recommend a data storage solution to balance features, performance, and costs',
              'Recommend a data solution for protection and durability',
            ],
          },
          {
            label: 'Design data integration',
            subobjectives: [
              'Recommend a solution for data integration',
              'Recommend a solution for data analysis',
            ],
          },
        ],
      },
      {
        label: 'Design business continuity solutions',
        range: '15–20',
        objectives: [
          {
            label: 'Design solutions for backup and disaster recovery',
            subobjectives: [
              'Recommend a recovery solution for Azure and hybrid workloads that meets recovery objectives',
              'Recommend a backup and recovery solution for compute',
              'Recommend a backup and recovery solution for databases',
              'Recommend a backup and recovery solution for unstructured data',
            ],
          },
          {
            label: 'Design for high availability',
            subobjectives: [
              'Recommend a high availability solution for compute',
              'Recommend a high availability solution for relational data',
              'Recommend a high availability solution for semi-structured and unstructured data',
            ],
          },
        ],
      },
      {
        label: 'Design infrastructure solutions',
        range: '30–35',
        objectives: [
          {
            label: 'Design compute solutions',
            subobjectives: [
              'Specify components of a compute solution based on workload requirements',
              'Recommend a virtual machine-based solution',
              'Recommend a container-based solution',
              'Recommend a serverless-based solution',
              'Recommend a compute solution for batch processing',
            ],
          },
          {
            label: 'Design an application architecture',
            subobjectives: [
              'Recommend a messaging architecture',
              'Recommend an event-driven architecture',
              'Recommend a solution for API integration',
              'Recommend a caching solution for applications',
              'Recommend an application configuration management solution',
              'Recommend an automated deployment solution for applications',
            ],
          },
          {
            label: 'Design migrations',
            subobjectives: [
              'Evaluate a migration solution that leverages the Microsoft Cloud Adoption Framework for Azure',
              'Evaluate on-premises servers, data, and applications for migration',
              'Recommend a solution for migrating workloads to infrastructure as a service (IaaS) and platform as a service (PaaS)',
              'Recommend a solution for migrating databases',
              'Recommend a solution for migrating unstructured data',
            ],
          },
          {
            label: 'Design network solutions',
            subobjectives: [
              'Recommend a connectivity solution that connects Azure resources to the internet',
              'Recommend a connectivity solution that connects Azure resources to on-premises networks',
              'Recommend a solution to optimize network performance',
              'Recommend a solution to optimize network security',
              'Recommend a load-balancing and routing solution',
            ],
          },
        ],
      },
    ],
  },
  {
    certificationId: 'az400',
    examCode: 'AZ-400',
    displayName: 'DevOps Engineer Expert',
    level: 'expert',
    contentTargetCount: 500,
    skillsOutlineEffectiveDate: '2026-07-27',
    studyGuideUrl: studyGuide('az-400'),
    examUrl: examUrl('az-400'),
    certificationUrl: 'https://learn.microsoft.com/credentials/certifications/devops-engineer/',
    officialExamDurationMinutes: null,
    notes: [
      'Skills outline taken from the official AZ-400 study guide heading “Skills measured as of July 27, 2026”.',
      'Official certification name is Microsoft Certified: DevOps Engineer Expert. Exam title is Designing and Implementing Microsoft DevOps Solutions.',
      'The fetched AZ-400 exam and certification pages did not state a per-exam duration. Microsoft’s generic associate/expert table lists 100 or 120 minutes depending on labs; that table is not recorded here as an AZ-400-specific official value.',
      TYPICAL_QUESTION_RANGE_NOTE,
    ],
    domains: [
      {
        label: 'Design and implement processes and communications',
        range: '10–15',
        objectives: [
          {
            label: 'Design and implement traceability and flow of work',
            subobjectives: [
              'Design and implement a structure for the flow of work, including GitHub Flow',
              'Design and implement a strategy for feedback cycles, including notifications and GitHub Issues',
              'Design and implement integration for tracking work, including GitHub projects, Azure Boards, and repositories',
              'Design and implement source, bug, and quality traceability',
            ],
          },
          {
            label: 'Design and implement appropriate metrics and queries for DevOps',
            subobjectives: [
              'Design and implement a dashboard, including flow of work, such as cycle times, time to recovery, and lead time',
              'Design and implement appropriate metrics and queries for project planning',
              'Design and implement appropriate metrics and queries for development',
              'Design and implement appropriate metrics and queries for testing',
              'Design and implement appropriate metrics and queries for security',
              'Design and implement appropriate metrics and queries for delivery',
              'Design and implement appropriate metrics and queries for operations',
            ],
          },
          {
            label: 'Configure collaboration and communication',
            subobjectives: [
              'Document a project by configuring wikis and process diagrams, including Markdown and Mermaid syntax',
              'Configure release documentation, including release notes and API documentation',
              'Automate creation of documentation from Git history',
              'Configure integration by using webhooks',
              'Configure integration between Azure Boards and GitHub repositories',
              'Configure integration between GitHub or Azure DevOps and Microsoft Teams',
            ],
          },
        ],
      },
      {
        label: 'Design and implement a source control strategy',
        range: '10–15',
        objectives: [
          {
            label: 'Design and implement branching strategies for the source code',
            subobjectives: [
              'Design a branch strategy, including trunk-based, feature branch, and release branch',
              'Design and implement a pull request workflow by using branch policies and branch protection rules',
              'Implement branch merging restrictions by using branch policies and branch protection rules',
            ],
          },
          {
            label: 'Configure and manage repositories',
            subobjectives: [
              'Design and implement a strategy for managing large files, including Git Large File Storage (LFS) and git-fat',
              'Design a strategy for scaling and optimizing a Git repository, including Scalar and cross-repository sharing',
              'Configure permissions in the source control repository',
              'Configure tags to organize the source control repository',
              'Recover specific data by using Git commands',
              'Remove specific data from source control',
            ],
          },
        ],
      },
      {
        label: 'Design and implement build and release pipelines',
        range: '50–55',
        objectives: [
          {
            label: 'Design and implement a package management strategy',
            subobjectives: [
              'Recommend package management tools including GitHub Packages and Azure Artifacts',
              'Design and implement package feeds and views for local and upstream packages',
              'Design and implement a dependency versioning strategy for code assets and packages, including semantic versioning (SemVer) and date-based (CalVer)',
              'Design and implement a versioning strategy for pipeline artifacts',
            ],
          },
          {
            label: 'Design and implement a testing strategy for pipelines',
            subobjectives: [
              'Design and implement quality and release gates, including security and governance',
              'Design a comprehensive testing strategy, including local tests, unit tests, integration tests, and load tests',
              'Implement tests in a pipeline, including configuring test tasks, configuring test agents, and integration of test results',
              'Implement code coverage analysis',
            ],
          },
          {
            label: 'Design and implement pipelines',
            subobjectives: [
              'Select a deployment automation solution, including GitHub Actions and Azure Pipelines',
              'Design and implement a GitHub runner or Azure DevOps agent infrastructure, including cost, tool selection, licenses, connectivity, and maintainability',
              'Design and implement integration between GitHub repositories and Azure Pipelines',
              'Develop and implement pipeline trigger rules',
              'Develop pipelines by using YAML',
              'Design and implement a strategy for job execution order, including parallelism and multi-stage pipelines',
              'Develop and implement complex pipeline scenarios, such as hybrid pipelines, VM templates, and self-hosted runners or agents',
              'Create reusable pipeline elements, including YAML templates, task groups, variables, and variable groups',
              'Design and implement checks and approvals by using YAML-based environments',
            ],
          },
          {
            label: 'Design and implement deployments',
            subobjectives: [
              'Design a deployment strategy, including blue-green, canary, ring, progressive exposure, feature flags, and A/B testing',
              'Design a pipeline to ensure that dependency deployments are reliably ordered',
              'Plan for minimizing downtime during deployments by using load balancing, rolling deployments, and deployment slot usage and swap',
              'Design a hotfix path plan for responding to high-priority code fixes',
              'Design and implement a resiliency strategy for deployment',
              'Implement feature flags by using Azure App Configuration Feature Manager',
              'Implement application deployment by using containers, binaries, and scripts',
              'Implement a deployment that includes database tasks',
            ],
          },
          {
            label: 'Design and implement infrastructure as code (IaC)',
            subobjectives: [
              'Recommend a configuration management technology for application infrastructure',
              'Implement a configuration management strategy for application infrastructure',
              'Define an IaC strategy, including source control and automation of testing and deployment',
              'Design and implement desired state configuration for environments, including Azure Automation State Configuration, Azure Resource Manager, Bicep, and Azure Machine Configuration',
              'Design and implement Azure Deployment Environments for on-demand self-deployment',
            ],
          },
          {
            label: 'Maintain pipelines',
            subobjectives: [
              'Monitor pipeline health, including failure rate, duration, and flaky tests',
              'Optimize a pipeline for cost, time, performance, and reliability',
              'Optimize pipeline concurrency for performance and cost',
              'Design and implement a retention strategy for pipeline artifacts and dependencies',
              'Migrate a pipeline from classic to YAML in Azure Pipelines',
            ],
          },
        ],
      },
      {
        label: 'Develop a security and compliance plan',
        range: '10–15',
        objectives: [
          {
            label: 'Design and implement authentication and authorization methods',
            subobjectives: [
              'Choose between Microsoft Entra service principals and managed identities for Azure resources (system-assigned and user-assigned)',
              'Implement and manage GitHub authentication, including GitHub Apps, GITHUB_TOKEN, and personal access tokens',
              'Implement and manage Azure DevOps service connections and personal access tokens',
              'Design and implement permissions and roles in GitHub',
              'Design and implement permissions and security groups in Azure DevOps',
              'Recommend appropriate access levels, including stakeholder access in Azure DevOps and outside collaborator access in GitHub',
              'Configure projects and teams in Azure DevOps',
            ],
          },
          {
            label: 'Design and implement a strategy for managing sensitive information in automation',
            subobjectives: [
              'Implement and manage secrets, keys, and certificates by using Azure Key Vault',
              'Implement and manage secrets and secretless authentication (for example, workload identity federation/OpenID Connect) in GitHub Actions and Azure Pipelines',
              'Design and implement a strategy for managing sensitive files during deployment, including Azure Pipelines secure files',
              'Design pipelines to prevent leakage of sensitive information',
            ],
          },
          {
            label: 'Automate security and compliance scanning',
            subobjectives: [
              'Design a strategy for security and compliance scanning, including dependency, code, secret, and licensing scanning',
              'Configure Microsoft Defender for Cloud DevOps Security',
              'Configure GitHub Advanced Security for GitHub and GitHub Advanced Security for Azure DevOps',
              'Integrate GitHub Advanced Security with Microsoft Defender for Cloud',
              'Automate container scanning, including scanning container images and configuring an action to run CodeQL analysis in a container',
              'Automate analysis of vulnerabilities of open-source components by using Dependabot alerts',
            ],
          },
        ],
      },
      {
        label: 'Implement an instrumentation strategy',
        range: '5–10',
        objectives: [
          {
            label: 'Configure monitoring for a DevOps environment',
            subobjectives: [
              'Configure Azure Monitor and Azure Monitor Logs to integrate with DevOps tools',
              'Configure collection of telemetry by using Azure Monitor Application Insights, Azure VM Insights, Azure Container Insights, Azure Monitor for Storage, and Azure Monitor for Networks',
              'Configure monitoring in GitHub, including enabling insights and creating and configuring charts',
              'Configure alerts for events in GitHub Actions and Azure Pipelines',
            ],
          },
          {
            label: 'Analyze metrics from instrumentation',
            subobjectives: [
              'Inspect infrastructure performance indicators, including CPU, memory, disk, and network',
              'Analyze metrics by using collected telemetry, including usage and application performance',
              'Inspect distributed tracing by using Azure Monitor Application Insights',
              'Interrogate logs using basic Kusto Query Language (KQL) queries',
            ],
          },
        ],
      },
    ],
  },
];

function buildBlueprint(spec: CertSpec) {
  const usedIds = new Set<string>();
  const parsed = spec.domains.map((domain) => ({ domain, range: parseRange(domain.range) }));
  const weights = normalizeWeights(parsed.map((item) => item.range.mid));
  const domainTargets = allocate(spec.contentTargetCount, weights);

  const domains = parsed.map((item, domainIndex) => {
    const domainTarget = domainTargets[domainIndex]!;
    const objectiveWeights = item.domain.objectives.map((objective) =>
      Math.max(objective.subobjectives.length, 1),
    );
    const objectiveTargets = allocate(domainTarget, objectiveWeights);

    return {
      id: uniqueId(item.domain.label, usedIds),
      label: item.domain.label,
      weight: weights[domainIndex]!,
      weightRange: item.range.label,
      targetCount: domainTarget,
      objectives: item.domain.objectives.map((objective, objectiveIndex) => {
        const objectiveTarget = objectiveTargets[objectiveIndex]!;
        const subTargets = allocatePreferMinOne(objectiveTarget, objective.subobjectives.length);
        return {
          id: uniqueId(objective.label, usedIds),
          label: objective.label,
          targetCount: objectiveTarget,
          subobjectives: objective.subobjectives.map((sub, subIndex) => ({
            id: uniqueId(sub, usedIds),
            label: sub,
            targetCount: subTargets[subIndex]!,
          })),
        };
      }),
    };
  });

  return {
    schemaVersion: BLUEPRINT_SCHEMA_VERSION,
    certificationId: spec.certificationId,
    examCode: spec.examCode,
    displayName: spec.displayName,
    blueprintStatus: 'verified' as const,
    skillsOutlineEffectiveDate: spec.skillsOutlineEffectiveDate,
    studyGuideUrl: spec.studyGuideUrl,
    examUrl: spec.examUrl,
    certificationUrl: spec.certificationUrl,
    officialExamDurationMinutes: spec.officialExamDurationMinutes,
    officialQuestionRange: null,
    contentTargetKind: 'internal_content_bank' as const,
    contentTargetCount: spec.contentTargetCount,
    difficultyMix: difficultyMixForLevel(spec.level),
    underCoveredRatio: 0.4,
    overCoveredRatio: 1.25,
    source: {
      verifiedDate: VERIFIED_DATE,
      studyGuideUrl: spec.studyGuideUrl,
      examUrl: spec.examUrl,
      certificationUrl: spec.certificationUrl,
      examDurationDocumentationUrl: EXAM_DURATION_DOC,
      skillsOutlineQuotedAsOf: spec.skillsOutlineEffectiveDate,
      officialExamDurationMinutes: spec.officialExamDurationMinutes,
      officialQuestionRange: null,
      notes: spec.notes,
    },
    domains,
  };
}

function main(): void {
  for (const spec of SPECS) {
    const blueprint = buildBlueprint(spec);
    assertValidBlueprint(blueprint, `${spec.certificationId}.json`);
    const filePath = path.join(OUT_DIR, `${spec.certificationId}.json`);
    writeFileSync(filePath, `${JSON.stringify(blueprint, null, 2)}\n`);
    const objectiveCount = blueprint.domains.reduce((sum, domain) => sum + domain.objectives.length, 0);
    const subCount = blueprint.domains.reduce(
      (sum, domain) =>
        sum + domain.objectives.reduce((inner, objective) => inner + objective.subobjectives.length, 0),
      0,
    );
    console.log(
      `${spec.examCode}: ${blueprint.domains.length} domains, ${objectiveCount} objectives, ${subCount} subobjectives, target ${blueprint.contentTargetCount}`,
    );
  }
}

main();
