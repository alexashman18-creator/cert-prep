# Certification platform

Cert Prep is a local-first Microsoft certification study app. AZ-900 — Azure Fundamentals is the first available track. The practice engine, mock-exam engine, progress, mistakes, SQLite persistence, and results screens are shared. They are not AZ-900-only implementations.

This is not a Microsoft product and does not imply Microsoft endorsement.

## Certification configuration

Catalog entries live in `src/certifications/catalog.ts`. Each certification has:

| Field | Purpose |
| --- | --- |
| `id` | Stable internal key, for example `az900` |
| `examCode` | Display / content exam code, for example `AZ-900` |
| `displayName` | Short title, for example `Azure Fundamentals` |
| `shortName` | Compact label, usually the exam code |
| `description` | One-line study description |
| `difficultyLevel` | `fundamentals`, `associate`, `expert`, or `specialty` |
| `provider` | Currently `Microsoft` |
| `studyGuideUrl` | Official Learn page when the exam exists; `null` when the code is not a published exam |
| `examDurationMinutes` | Mock duration, or `null` until a verified specification is added |
| `targetMockQuestionCount` | Unique mock-exam target, or `null` until specified |
| `contentVersion` | Question-outline / catalog revision |
| `status` | `available`, `coming_soon`, or `inactive` |
| `domains` | Domain ids, labels, and summaries |
| `mockExam` | Shared engine config (`duration`, `targetQuestionCount`, `domainWeights`), or `null` |
| `theme` | Optional accent metadata |

AZ-900 is configuration-driven:

- 40 unique questions
- 45-minute timer
- domain weights 27% / 38% / 35% (`cloud_concepts`, `architecture_services`, `management_governance`)

Do not guess duration, question count, or weights for other exams. Leave `mockExam` and domain lists empty until a verified skills outline is added.

## Database scoping

The SQLite file remains `az900-prep.db` so existing installs are not reset.

Schema version **3** adds `certification_id` to:

- `questions`
- `practice_sessions`
- `exam_sessions`
- `mistakes`
- `user_progress`

Existing rows receive `certification_id = 'az900'`. Progress counters are not zeroed. The original `user_progress` row keeps `id = 'default'` and is tagged as AZ-900.

`app_settings` stores `selected_certification_id`, defaulting to `az900`.

Repositories are the only SQL boundary. Screens use hooks.

Creating a practice or exam session abandons in-progress sessions **for that certification only**.

## Adding a new certification

1. Add a `Certification` object to `CERTIFICATIONS` in `src/certifications/catalog.ts`.
2. Choose a lowercase id (`dp900`) and the official exam code (`DP-900`).
3. Leave `status: 'coming_soon'` until the track can actually be studied.
4. Add `content/questions/batches/<id>/` for future JSON batches.
5. Add the exam code to `content/questions/question-bank.schema.json`.
6. Do not invent mock-exam parameters or generate placeholder questions.

## Adding domains and weights

When a verified skills outline is available:

1. Fill `domains` with stable ids, labels, and summaries.
2. Set `mockExam` with `examDurationMinutes`, `targetQuestionCount`, and `domainWeights` that sum to 1.
3. Copy duration / count onto `examDurationMinutes` and `targetMockQuestionCount`.
4. Update validation will then accept those domain ids in that certification’s JSON batches.

The shared `selectExamQuestions` helper reads this config. It does not contain AZ-900-only weights.

## Adding a question bank

1. Author original items. Do not use dumps or generate unverified banks.
2. Put JSON in `content/questions/batches/<certificationId>/`.
3. Set file-level `exam` and `certificationId`. Every question should belong to that certification.
4. Use the certification’s domain ids. Production IDs must not use `<id>-dev-`.
5. Run:

```bash
npm run questions:validate
npm run questions:audit -- --cert=DP-900
npm run questions:import
```

6. Commit the batch file and `src/data/generated/productionQuestionBank.json`.

The 12 AZ-900 development samples stay in `src/data/sampleQuestions.ts`.

## Enabling or disabling a certification

- `available` — selectable on `/certifications` and on Home. Practice and mock exam use its questions and config.
- `coming_soon` — shown in the catalog, not selectable, cannot open empty practice or exam sessions.
- `inactive` — hidden from study. Keep the row for future reactivation.

To enable DP-900 later, see the checklist at the end of this document.

## Future monetisation

Do not add RevenueCat, auth, or paywalls in this layer. When monetisation arrives:

- Gate **certification availability** or question-bank size in the catalog / entitlements module, not inside the scoring or timer engines.
- Keep AZ-900 (or a free fundamentals track) usable offline without an account.
- Scope purchases by `certification_id` so one unlock does not leak into another track’s progress.
- Continue writing locally first. A later sync layer should sit behind repositories.

## Enabling DP-900 next

Required before marking DP-900 available:

1. Add verified DP-900 domain ids and labels from the current skills outline.
2. Add verified mock-exam duration, unique question target, and domain weights. Do not guess.
3. Author a verified JSON bank under `content/questions/batches/dp900/`.
4. Validate, audit (`--cert=DP-900`), and import.
5. Set `status: 'available'` and `contentVersion` on the DP-900 catalog entry.
6. Confirm AZ-900 progress, mistakes, and in-progress sessions are unchanged.
