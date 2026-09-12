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

Those constants live in `src/content/blueprints/launchTargets.ts` and in each blueprint file.

## Where blueprints live

One JSON file per certification:

```
content/blueprints/az900.json
content/blueprints/dp900.json
...
```

AZ-900 is `blueprintStatus: "verified"` and contains the official 20 July 2026 skills outline. Every other file is `pending_verification` with an empty `domains` array. Do not invent official objectives for those tracks.

## Blueprint shape

Each file records:

- `certificationId`, `examCode`, `displayName`
- `blueprintStatus`: `pending_verification` | `verified` | `retired`
- `skillsOutlineEffectiveDate`
- `studyGuideUrl`
- `contentTargetCount`
- `difficultyMix` (`beginner` / `intermediate` / `advanced`, sums to 1)
- `underCoveredRatio` / `overCoveredRatio`
- `domains[]` with official ids, labels, weights, and targets
- `objectives[]` and `subobjectives[]` with targets
- optional `aliases` so existing question strings can map onto official labels

Do not copy questions into blueprint files. Counts are computed from `content/questions/batches/<certificationId>/`.

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

## Verify and enable the next certification blueprint

Example: DP-900, next in the production order.

1. Open the current Microsoft study guide. Do not reuse AZ-900 domains.
2. Confirm the skills-outline effective date and official domain weights.
3. Replace `content/blueprints/dp900.json` `domains` with those official ids, labels, objectives, and subobjectives.
4. Set `blueprintStatus` to `verified` and fill `skillsOutlineEffectiveDate` and `studyGuideUrl`.
5. Split `contentTargetCount` (350) across domains using official weights. Objective/subobjective targets must sum to the parent.
6. Choose a difficulty mix for that exam’s level. Do not copy AZ-900’s mix unless the outline supports it.
7. Run `npm run questions:coverage -- --cert=DP-900`. The report should be `blueprint_ready` until questions exist.
8. Author original verified JSON under `content/questions/batches/dp900/`. Do not generate items.
9. Validate, import, audit, and re-run coverage.
10. Only after the blueprint is verified **and** a sufficient bank exists, set DP-900 `status: "available"` in `src/certifications/catalog.ts` and add mock-exam duration, unique question count, and domain weights. Do not guess those exam parameters.

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
