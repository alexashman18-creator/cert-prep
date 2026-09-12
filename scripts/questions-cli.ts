import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { auditQuestionBank, formatQuestionBankAudit } from '@/content/audit';
import { mergeQuestionCatalog } from '@/content/catalog';
import { mapSourceQuestions } from '@/content/mapSource';
import type { QuestionBankFile } from '@/content/types';
import { validateQuestionBankFile } from '@/content/validate';
import { sampleQuestions } from '@/data/sampleQuestions';

const ROOT = process.cwd();
const BATCH_DIR = path.join(ROOT, 'content/questions/batches');
const GENERATED_PATH = path.join(ROOT, 'src/data/generated/productionQuestionBank.json');

function printIssues(issues: { path: string; message: string }[]): void {
  for (const item of issues) {
    console.error(`- ${item.path}: ${item.message}`);
  }
}

async function readJson(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, 'utf8');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${filePath} is not valid JSON.`);
  }
}

async function listBatchFiles(): Promise<string[]> {
  const entries = await readdir(BATCH_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(BATCH_DIR, entry.name))
    .sort();
}

async function loadValidatedBatches(files: string[]): Promise<QuestionBankFile[]> {
  const banks: QuestionBankFile[] = [];
  const issues: { path: string; message: string }[] = [];

  for (const filePath of files) {
    const label = path.relative(ROOT, filePath);
    const raw = await readJson(filePath);
    const result = validateQuestionBankFile(raw, { fileLabel: label, allowDevelopmentIds: false });
    issues.push(...result.issues);
    if (result.ok) {
      banks.push(raw as QuestionBankFile);
    }
  }

  const seen = new Map<string, string>();
  for (const bank of banks) {
    const label = bank.batchId ?? 'batch';
    for (const question of bank.questions) {
      const previous = seen.get(question.id);
      if (previous) {
        issues.push({
          path: `${label}.questions`,
          message: `duplicate ID "${question.id}" already appears in ${previous}.`,
        });
      } else {
        seen.set(question.id, label);
      }
    }
  }

  if (issues.length > 0) {
    console.error('Question bank validation failed. No files were imported.\n');
    printIssues(issues);
    process.exitCode = 1;
    throw new Error('INVALID_QUESTION_BANK');
  }

  return banks;
}

async function validateCommand(fileArg?: string): Promise<void> {
  const files = fileArg ? [path.resolve(fileArg)] : await listBatchFiles();
  if (files.length === 0) {
    console.log('No question-bank JSON files found.');
    return;
  }
  await loadValidatedBatches(files);
  console.log(`Validated ${files.length} file${files.length === 1 ? '' : 's'}.`);
}

async function buildProductionCatalog() {
  const files = await listBatchFiles();
  const banks = await loadValidatedBatches(files);
  const production = mapSourceQuestions(banks.flatMap((bank) => bank.questions));
  const catalog = mergeQuestionCatalog(sampleQuestions, production);
  return { files, banks, production, catalog };
}

async function importCommand(): Promise<void> {
  const { files, banks, production, catalog } = await buildProductionCatalog();
  const bundled: QuestionBankFile = {
    schemaVersion: 1,
    exam: 'AZ-900',
    batchId: 'bundled-production',
    questions: banks.flatMap((bank) => bank.questions),
  };
  await writeFile(GENERATED_PATH, `${JSON.stringify(bundled, null, 2)}\n`, 'utf8');
  console.log(`Imported ${production.length} production question${production.length === 1 ? '' : 's'} from ${files.length} batch file${files.length === 1 ? '' : 's'}.`);
  console.log(`Wrote ${path.relative(ROOT, GENERATED_PATH)}`);
  console.log(`Catalog ready for SQLite seed: ${catalog.length} total (${sampleQuestions.length} development + ${production.length} production).`);
  console.log('The next app launch will insert new IDs and update rows only when questionVersion is newer. Retired IDs are kept.');
}

async function auditCommand(staleDays: number): Promise<void> {
  const { catalog } = await buildProductionCatalog();
  console.log(formatQuestionBankAudit(auditQuestionBank(catalog, { staleDays })));
}

function readStaleDays(args: string[]): number {
  const paired = args.findIndex((item) => item === '--stale-days');
  if (paired >= 0) {
    const value = Number(args[paired + 1]);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('--stale-days must be a positive integer.');
    }
    return value;
  }
  const inline = args.find((item) => item.startsWith('--stale-days='));
  if (inline) {
    const value = Number(inline.slice('--stale-days='.length));
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('--stale-days must be a positive integer.');
    }
    return value;
  }
  return 180;
}

function printHelp(): void {
  console.log(`AZ-900 question-bank tools

Usage:
  npm run questions:validate [-- path/to/file.json]
  npm run questions:import
  npm run questions:audit [-- --stale-days=180]

validate  Reject malformed JSON banks. Reports every issue.
import    Validate all files in content/questions/batches, then write the bundled catalog.
audit     Report totals, domains, objectives, difficulty, missing sources, and stale verified dates.
`);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === 'validate') {
      await validateCommand(rest[0]);
      return;
    }
    if (command === 'import') {
      await importCommand();
      return;
    }
    if (command === 'audit') {
      await auditCommand(readStaleDays(rest));
      return;
    }
    printHelp();
    if (command && command !== 'help') {
      process.exitCode = 1;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_QUESTION_BANK') {
      return;
    }
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
