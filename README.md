# AZ-900 Prep

A local-first mobile practice app for Microsoft’s AZ-900: Microsoft Azure Fundamentals certification.

Learners can complete practice sessions and mock exams without internet access. Progress is stored on-device with Expo SQLite and survives navigation, backgrounding, and app restarts.

## Stack

- React Native, Expo, TypeScript
- Expo Router
- Zustand for ephemeral UI state
- Expo SQLite for offline persistence

## Scripts

```bash
npm start
npm run web
npm run typecheck
npm test
npm run lint
npm run questions:validate
npm run questions:import
npm run questions:audit
```

Production questions are supplied as JSON. See `docs/question-bank-workflow.md`.

## Content notice

The bundled questions are original development samples only. They are not Microsoft exam items and have not been verified by Microsoft. See `docs/content-guidelines.md`.

## Architecture

See `docs/architecture.md` for persistence, scoring, and the planned Supabase / RevenueCat extension points.
