# Question bank workflow

This is the content infrastructure for Cert Prep. Professionally written questions are supplied as JSON, validated, then version-upserted into the existing SQLite `questions` table. Every production question belongs to a certification id. Do not edit application screens or seed loops to add items.

## Source-file format

Use JSON. Put each batch in:

`content/questions/batches/<certificationId>/*.json`

The first production batch file is:

`content/questions/batches/az900/batch-001.json`

A JSON Schema lives at `content/questions/question-bank.schema.json` for editor validation.

```json
{
  "schemaVersion": 1,
  "exam": "AZ-900",
  "certificationId": "az900",
  "batchId": "az900-2026-09-verified",
  "questions": [
    {
      "id": "az900-2024-cc-001",
      "certificationId": "az900",
      "examVersion": "AZ-900-2024",
      "domain": "cloud_concepts",
      "objective": "Describe cloud concepts",
      "subobjective": "Describe the benefits of using cloud services",
      "difficulty": "beginner",
      "questionText": "Question stem",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswerId": "b",
      "overallExplanation": "Why the correct answer is correct.",
      "optionExplanations": {
        "a": "Why A is wrong.",
        "b": "Why B is correct.",
        "c": "Why C is wrong.",
        "d": "Why D is wrong."
      },
      "sourceUrl": "https://learn.microsoft.com/...",
      "sourceTitle": "Microsoft Learn: article title",
      "verifiedDate": "2026-09-12",
      "questionVersion": 1,
      "contentStatus": "verified"
    }
  ]
}
```

Required fields on every question:

- `id`
- `certificationId` (optional on the question if the file already has it)
- `examVersion`
- `domain` — must match the certification’s configured domain ids (AZ-900: `cloud_concepts`, `architecture_services`, `management_governance`)
- `objective`
- `subobjective`
- `difficulty` — `beginner` | `intermediate` | `advanced`
- `questionText`
- exactly four `options` (`id` + `text`)
- `correctAnswerId` matching one option
- `overallExplanation`
- `optionExplanations` for every option
- `sourceUrl`
- `sourceTitle`
- `verifiedDate` (`YYYY-MM-DD` or ISO timestamp, or `null` when not verified)
- `questionVersion` (integer ≥ 1)
- `contentStatus`

IDs starting with `az900-dev-` are reserved for the 12 bundled development samples. Production IDs must not use that prefix.

## Content statuses

| Status | Meaning | New practice / mock sessions |
| --- | --- | --- |
| `development` | Bundled sample / engineering content only | Stored only. Not selected unless the DEV-only `INCLUDE_DEVELOPMENT_QUESTIONS` flag is on |
| `draft` | In review, not ready | Never |
| `verified` | Production-ready, source-checked | Always eligible |
| `retired` | Withdrawn after an exam or Learn update | Never. Row is kept for historical results |

Normal Practice, Mock Exam, and user-facing bank counts use **verified** questions only — including Expo Go and other `__DEV__` builds. Production releases ignore the include flag. Draft and retired items can be stored, but they are not selected for new sessions. `getByIds` still loads any status so completed exams and Review Mistakes keep working after a retire or when a historical session contains a development ID.

To mix development samples into new sessions while testing, set `INCLUDE_DEVELOPMENT_QUESTIONS` to `true` in `src/content/eligibility.ts`. That flag is read only when `__DEV__ === true`. Do not expose it in production UI.

## Validation

```bash
npm run questions:validate
npm run questions:validate -- content/questions/batches/az900/batch-001.json
```

Validation **rejects** the file and prints every issue. It does not import a partial bank. Failures include:

- duplicate IDs (inside a file or across batch files)
- fewer or more than four answers
- missing `correctAnswerId`
- `correctAnswerId` that does not match an option
- missing overall or per-option explanations
- invalid domain
- missing `sourceUrl` / `sourceTitle` / `verifiedDate` on `verified` items
- unsupported `contentStatus`
- reserved `az900-dev-*` IDs in production files
- wrong `schemaVersion` or `exam`

## Importing

```bash
npm run questions:import
```

This command:

1. Validates every JSON file under `content/questions/batches/` (including per-certification folders).
2. Refuses to continue if any file is malformed.
3. Writes the combined production catalog to `src/data/generated/productionQuestionBank.json`.
4. Leaves the 12 development samples untouched in `src/data/sampleQuestions.ts`.

The app seed (`seedQuestionBank`) runs on launch:

1. Loads development samples + the generated production catalog.
2. Inserts IDs that are not in SQLite.
3. Updates a row only when the incoming `questionVersion` is **greater** than the stored version.
4. Skips same or older versions (no silent overwrite, no duplicate rows).
5. Never deletes a question row.

That keeps session IDs, answers, flags, and mistakes stable for 300–500+ items. Writes happen in one transaction.

## Updating questions

1. Edit the question in its batch JSON.
2. Increment `questionVersion`.
3. Keep the same `id` and, whenever possible, the same option IDs (`a`–`d`) so historical answers still map.
4. Run `npm run questions:validate` then `npm run questions:import`.
5. Launch the app. SQLite applies the newer version.

If you change wording but forget to bump `questionVersion`, the stored row is left as-is.

## Retiring questions

Set `contentStatus` to `retired` and increment `questionVersion`. Import as usual. The ID remains in SQLite so old practice/exam sessions can still render that item. New sessions will not select it.

Do not remove the JSON object if you still need the row updated on existing installs. Removing it from the batch only means future seeds will not change that row.

## Version handling

- `schemaVersion` is the **file** format. Currently `1`.
- `questionVersion` is the **item** revision. Start at `1`.
- `examVersion` records the AZ-900 outline the item was written against, for example `AZ-900-2024`.
- Newer `questionVersion` wins. Older files cannot roll a device backward.

## Audit command

```bash
npm run questions:audit
npm run questions:audit -- --cert=AZ-900
npm run questions:audit -- --stale-days=90
```

Reports:

- total questions
- total verified / draft / development / retired
- counts by domain
- counts by objective
- counts by difficulty
- questions missing source URL or title
- verified items whose `verifiedDate` is older than the configured number of days (default 180) or missing

Use this when Microsoft publishes an AZ-900 skills-outline update.

## How to add a new verified question batch

1. Author original items against current Microsoft Learn. Do not use dumps.
2. Save them as JSON matching this document. For the first verified AZ-900 set, fill `content/questions/batches/az900/batch-001.json`. Later sets can be new files such as `content/questions/batches/az900/2026-10-verified.json`.
3. Set every shippable item to `"contentStatus": "verified"` with a Learn `sourceUrl`, `sourceTitle`, and `verifiedDate`.
4. Keep unfinished work as `"contentStatus": "draft"` in a separate file if needed. Drafts are imported but never served in sessions.
5. Run `npm run questions:validate`.
6. Run `npm run questions:import`.
7. Run `npm run questions:audit` and fix missing sources or stale verification dates.
8. Commit the batch file **and** `src/data/generated/productionQuestionBank.json`.
9. Launch the app once so SQLite picks up the new versions.

## Development samples

The original 12 items stay in `src/data/sampleQuestions.ts` with:

- `id` prefix `az900-dev-`
- `contentStatus: "development"`
- `verifiedDate: null`

They are engineering fixtures, not verified production content. Release builds do not select them for new sessions.

## What to supply for the first verified batch

Provide a single JSON file that matches the schema above. The drop-in path is:

**`content/questions/batches/az900/batch-001.json`**

Replace the empty `questions` array with the verified items. Then run validate + import. See `docs/az900-production-batch-checklist.md`.
