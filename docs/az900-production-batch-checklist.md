# AZ-900 first production batch checklist

Fill **`content/questions/batches/az900/batch-001.json`**. Do not edit `src/data/sampleQuestions.ts`. Do not generate questions in the app.

Leave `content/questions/batches/az900/production.json` empty. That file is only a leftover wrapper.

## Canonical verified question shape

Every item in `questions` must match this object. The stem below is fake placeholder text, not AZ-900 content.

```json
{
  "id": "az900-2024-cc-001",
  "certificationId": "az900",
  "examVersion": "AZ-900-2024",
  "domain": "cloud_concepts",
  "objective": "Describe cloud concepts",
  "subobjective": "Describe cloud computing",
  "difficulty": "beginner",
  "questionText": "Example placeholder question",
  "options": [
    { "id": "a", "text": "Example option A" },
    { "id": "b", "text": "Example option B" },
    { "id": "c", "text": "Example option C" },
    { "id": "d", "text": "Example option D" }
  ],
  "correctAnswerId": "b",
  "overallExplanation": "Example placeholder explanation for the correct option.",
  "optionExplanations": {
    "a": "Example placeholder reason A is wrong.",
    "b": "Example placeholder reason B is correct.",
    "c": "Example placeholder reason C is wrong.",
    "d": "Example placeholder reason D is wrong."
  },
  "sourceUrl": "https://learn.microsoft.com/azure/example-placeholder",
  "sourceTitle": "Microsoft Learn: example placeholder article",
  "verifiedDate": "2026-09-12",
  "questionVersion": 1,
  "contentStatus": "verified"
}
```

File wrapper (already in `batch-001.json`):

```json
{
  "schemaVersion": 1,
  "exam": "AZ-900",
  "certificationId": "az900",
  "batchId": "az900-batch-001",
  "questions": []
}
```

Replace the empty `questions` array with the 50 objects. Keep the wrapper fields.

## Valid AZ-900 domain IDs

Use these internal ids exactly. Labels are display-only.

| Domain | Internal `domain` value |
| --- | --- |
| Cloud Concepts | `cloud_concepts` |
| Azure Architecture & Services | `architecture_services` |
| Azure Management & Governance | `management_governance` |

## ID and status rules

- Production ids must be unique across every file under `content/questions/batches/`.
- Do not use the `az900-dev-` prefix. That is reserved for the 12 bundled development samples.
- Ship only `"contentStatus": "verified"` in this batch.
- Verified items require `sourceUrl` (http/https), `sourceTitle`, and `verifiedDate` (`YYYY-MM-DD` or ISO).
- Use stable option ids `a`–`d` so later wording edits can keep the same ids.
- Start `questionVersion` at `1`.

## Commands, in order

1. Place the 50 questions in `content/questions/batches/az900/batch-001.json`.
2. Validate:

```bash
npm run questions:validate -- content/questions/batches/az900/batch-001.json
npm run questions:validate
```

3. Import (writes `src/data/generated/productionQuestionBank.json`; does not edit `sampleQuestions.ts`):

```bash
npm run questions:import
```

4. Audit AZ-900:

```bash
npm run questions:audit -- --cert=AZ-900
```

5. Check totals by domain in that audit (`cloud_concepts`, `architecture_services`, `management_governance`). Expect 12 development samples plus the 50 verified items, unless you filter mentally to `Verified: 50`.
6. Confirm production sessions use verified items only. Development samples stay eligible in `__DEV__` builds. Release builds (`__DEV__ === false`) select **verified** only. Draft and retired are never selected for new sessions.
7. Launch the app:

```bash
npx expo start
```

8. Smoke-test Practice and Mock Exam on AZ-900:
   - Practice setup should list the three domains and a non-zero available count.
   - Home → Mock Exam must show `min(eligibleBank, 40)` as **available** questions, not a hard-coded 40 if the eligible bank is smaller.
   - After this batch, development builds have 62 eligible items (12 development + 50 verified), so Mock Exam copy should read **40 questions · 45-minute timer**.
9. Confirm existing progress is preserved: Home counters, Review Mistakes, and any in-progress AZ-900 session must still be there. Question import only inserts new ids or updates rows when `questionVersion` is newer. It does not reset SQLite or user progress.

## After a good import

Commit both:

- `content/questions/batches/az900/batch-001.json`
- `src/data/generated/productionQuestionBank.json`
