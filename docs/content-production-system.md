# Content production system

This layer plans and tracks verified question banks against official Microsoft skills outlines. It does not generate questions, score exams, or change catalog availability.

The practice engine, mock-exam engine, SQLite schema, and session persistence stay as they are. Coverage reads existing question fields: `certificationId`, `domain`, `objective`, `subobjective`, `difficulty`, and `contentStatus`.

A certification never becomes user-available because a blueprint or a target count exists. Home and `/certifications` still use `catalog.ts` `status`. Launch readiness is a content-planning signal only.

## Production order

Content-authoring order (launch still targets every configured track):

1. AZ-900
2. DP-900
3. AI-901
4. AZ-104
5. AI-200
6. SC-500
7. DP-300
8. DP-700
9. AI-103
10. AZ-305
11. AZ-400

Provisional launch-bank targets (content totals, not mock-exam lengths):

| Exam | Target |
| --- | ---: |
| AZ-900 | 400 |
| DP-900 | 350 |
| AI-901 | 350 |
| AZ-104 | 500 |
| AI-200 | 500 |
| SC-500 | 500 |
| DP-300 | 450 |
| DP-700 | 450 |
| AI-103 | 500 |
| AZ-305 | 450 |
| AZ-400 | 500 |

Those constants live in `src/content/blueprints/launchTargets.ts` and in each blueprint file. They are internal content-bank targets, not Microsoft exam question counts.

## Verified official blueprints

All 11 planned tracks now have `blueprintStatus: "verified"` files sourced from current Microsoft Learn study guides (checked 12 September 2026). Domain `weight` values are normalized midpoints of Microsoft’s published ranges so they sum to 1. The official range is stored on each domain as `weightRange`.

| Exam | Official certification name | Skills-outline effective date | Official source URL | Bank target | Blueprint status |
| --- | --- | --- | --- | ---: | --- |
| AZ-900 | Azure Fundamentals | 20 July 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900 | 400 | verified |
| DP-900 | Azure Data Fundamentals | 21 July 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-900 | 350 | verified |
| AI-901 | Azure AI Fundamentals | 15 April 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-901 | 350 | verified |
| AZ-104 | Azure Administrator Associate | 17 April 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104 | 500 | verified |
| AI-200 | Azure AI Cloud Developer Associate | Not dated on the study guide | https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-200 | 500 | verified |
| SC-500 | Cloud and AI Security Engineer Associate | Not dated on the study guide | https://learn.microsoft.com/credentials/certifications/resources/study-guides/sc-500 | 500 | verified |
| DP-300 | Azure Database Administrator Associate | 24 April 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-300 | 450 | verified |
| DP-700 | Fabric Data Engineer Associate | 21 July 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-700 | 450 | verified |
| AI-103 | Azure AI Apps and Agents Developer Associate | 16 April 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/AI-103 | 500 | verified |
| AZ-305 | Azure Solutions Architect Expert | 17 April 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-305 | 450 | verified |
| AZ-400 | DevOps Engineer Expert | 27 July 2026 | https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-400 | 500 | verified |

A verified blueprint does **not** make that certification available in the user catalog. Home and `/certifications` still use `catalog.ts` `status`. Coming Soon tracks stay hidden from practice until a sufficient verified question bank exists.

## Where blueprints live

One JSON file per certification:

```
content/blueprints/az900.json
content/blueprints/dp900.json
...
```

## Blueprint shape

Each file records:

- `certificationId`, `examCode`, `displayName`
- `blueprintStatus`: `pending_verification` | `verified` | `retired`
- `skillsOutlineEffectiveDate`
- `studyGuideUrl`, plus optional `examUrl` and `certificationUrl`
- optional `officialExamDurationMinutes` only when a Microsoft certification/exam page states it
- `officialQuestionRange` is null unless Microsoft publishes a per-exam count (the generic 40–60 typical range is documented, not copied as an official per-exam number)
- `contentTargetKind`: `internal_content_bank` on the newly verified files
- `contentTargetCount`
- `difficultyMix` (`beginner` / `intermediate` / `advanced`, sums to 1)
- `underCoveredRatio` / `overCoveredRatio`
- optional `source` metadata (verification date, official URLs, notes)
- `domains[]` with official ids, labels, normalized `weight`, official `weightRange`, and targets
- `objectives[]` and `subobjectives[]` with official wording and targets
- optional `aliases` so existing question strings can map onto official labels

Do not copy questions into blueprint files. Counts are computed from `content/questions/batches/<certificationId>/`.

Official Microsoft exam duration is not the same as this app’s internal mock-exam duration. Mock length stays an internal simulation setting and is not enabled for Coming Soon tracks.

## Difficulty mixes

Mixes are per certification, not one global ratio.

- Fundamentals (AZ-900, DP-900, AI-901): 55% beginner / 35% intermediate / 10% advanced
- Associate: 25% / 50% / 25%
- Expert: 15% / 45% / 40%

Change the mix in that certification’s blueprint when the outline calls for it.

## How coverage is calculated

`npm run questions:coverage` loads **one certification folder at a time**. It does not load the bundled catalog or other tracks.

For each production question:

1. Keep `verified` and `draft` only for planning counts. Development samples stay in SQLite and are ignored here.
2. Match `domain` to a blueprint domain id.
3. Prefer a subobjective whose `label` or `aliases` equals `question.subobjective`.
4. Otherwise match an objective `label` / `aliases` to `question.objective`.
5. Unmapped verified items are listed. They still count in the certification total if they belong to that `certificationId`.

An objective is:

- **ZERO** when target > 0 and verified = 0
- **LOW** when verified / target is below `underCoveredRatio` (AZ-900: 0.4)
- **OVER** when verified / target is above `overCoveredRatio` (AZ-900: 1.25)

## Commands

```bash
npm run questions:coverage
npm run questions:coverage -- --cert=AZ-900
npm run questions:coverage -- --cert=AZ-900 --objective="Describe cloud concepts"
npm run questions:coverage -- --cert=AZ-900 --batch-size=50
```

`--cert` accepts an id or exam code. `--objective` filters by objective label, objective id, domain label, or domain id.

The AZ-900 report also prints a recommended next batch: zero-coverage official topics first, then the lowest coverage ratio, up to `--batch-size`.

Related existing commands:

```bash
npm run questions:validate
npm run questions:import
npm run questions:audit -- --cert=AZ-900
```

## Launch readiness

Statuses:

| Status | Meaning |
| --- | --- |
| `not_started` | Missing file, `pending_verification`, or retired |
| `blueprint_ready` | Outline verified, no verified questions yet |
| `content_in_progress` | Some verified content, but the target is unmet or an official objective is still at zero |
| `qa_required` | Count and objective coverage are met, but sources or verification dates need work |
| `launch_ready` | Verified outline, every official objective and subobjective has coverage, target met, sources clean |

A raw question count never produces `launch_ready` while major official objectives are uncovered. This report never flips `catalog.ts` to `available`.

## Author the next question bank after AZ-900

DP-900 is next in the production order. Its blueprint is already verified.

1. Run `npm run questions:coverage -- --cert=DP-900` to see official ZERO-coverage topics.
2. Author original verified JSON under `content/questions/batches/dp900/`. Do not generate items.
3. Use the official objective/subobjective labels from `content/blueprints/dp900.json`.
4. Validate, import, audit, and re-run coverage.
5. Only after a sufficient bank exists, set DP-900 `status: "available"` in `src/certifications/catalog.ts` and add mock-exam duration, unique question count, and domain weights. Do not guess those exam parameters. Do not treat Microsoft’s official exam duration as this app’s mock duration.

If Microsoft updates a study guide, edit that certification’s blueprint (or regenerate from `scripts/build-verified-blueprints.ts` for the ten non-AZ-900 tracks) and keep parent/child `targetCount` sums exact.

## Add objectives or subobjectives

1. Edit the verified blueprint for that exam.
2. Keep parent/child `targetCount` sums exact.
3. Add `aliases` when existing questions use a shorter Learn heading.
4. Do not retag shipped questions unless validation fails for a real schema issue.
5. Re-run coverage.

## Plan a question batch

1. Run `npm run questions:coverage -- --cert=AZ-900 --batch-size=50`.
2. Author only the recommended official topics. Prefer ZERO rows, then LOW rows.
3. Use the official objective/subobjective labels in new JSON so later reports map cleanly.
4. Keep unfinished work as `draft` in a separate batch file if needed.
5. Do not generate questions.

## When Microsoft changes an exam

1. Keep the old blueprint until you have the new outline date.
2. Copy the file or edit in place. Update `skillsOutlineEffectiveDate`.
3. Add, rename, or retire objectives. Retired skills can drop to `targetCount: 0` or move to a retired blueprint status if the whole exam is withdrawn.
4. Existing questions stay in SQLite. Historical sessions still load them with `getByIds`.
5. Coverage will show unmapped ids if labels changed. Add aliases or retag only those items.
6. Run audit for stale `verifiedDate` values after Learn article updates.

## Scale

Coverage never loads every certification’s questions at once. Platform mode walks `CONTENT_PRODUCTION_ORDER`, reads that track’s batch folder, prints a summary, and drops the questions before opening the next folder. Blueprints stay small. Question text stays in batch files only. This is the path to ~5,000 verified items.

## AZ-900 notes

- Outline date: 20 July 2026
- Domain weights already used by the mock exam: 27% / 38% / 35%
- Domain targets: 108 Cloud Concepts, 152 Architecture & Services, 140 Management & Governance
- First production batch (`batch-001.json`) is 50 verified items: 15 / 20 / 15
- Development samples remain stored and are excluded from coverage and from new sessions by default
