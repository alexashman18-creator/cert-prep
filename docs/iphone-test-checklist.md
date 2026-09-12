# Physical iPhone test checklist

Use a development build or Expo Go on a real iPhone. The development bank currently has 12 unique questions. Do not expect a 40-question exam until the production bank is large enough.

Before you start, confirm Home → Mock Exam says **12 available questions · 45-minute timer**, not 40 questions.

## Practice

1. Start a practice session.
2. Answer several questions.
3. Flag a question.
4. Background the app.
5. Reopen it.
6. Confirm state is preserved (current question, selected/submitted answer, flag).
7. Force-quit the app.
8. Reopen it.
9. Confirm state is preserved.
10. Restart the iPhone.
11. Reopen it.
12. Confirm state is preserved.

## Mock Exam

1. Start an exam.
2. Answer several questions.
3. Flag questions.
4. Navigate backward/forward.
5. Background the app for several minutes.
6. Reopen and confirm the timer has elapsed correctly (it continues while the app is closed).
7. Force-quit and reopen.
8. Restart the device and reopen.
9. Confirm questions, answers, flags and timer state are restored.

Unfinished-exam prompt:

1. Leave an exam unfinished and return to Home.
2. Tap **Mock Exam**.
3. Confirm the sheet offers **Resume Exam**, **Start New Exam**, and **Cancel**.
4. Tap **Start New Exam** and confirm a second discard warning appears.
5. Cancel once and confirm the original exam is still resumable.
6. Start a new exam and confirm the previous attempt is no longer resumable.

Expired-while-closed:

1. Start an exam, note the remaining time, then force-quit or leave the app until the 45-minute deadline has passed.
2. Reopen the app.
3. Confirm the exam is finished as **expired** and extra time is not restored.

## Completed sessions

1. Complete a practice session.
2. Complete a mock exam.
3. Force-quit and reopen.
4. Ensure completed sessions are not shown as resumable.

## Mistakes

1. Miss a question.
2. Confirm it appears in Review Mistakes.
3. Force-quit/reopen.
4. Confirm it remains.
5. Retry correctly.
6. Confirm it is cleared according to current intended behaviour (a later correct answer removes that question ID from Review Mistakes).

Practice Results vs Home Review Mistakes:

1. Complete a practice session with at least one miss.
2. On Practice Results, tap **Review these mistakes**. Confirm only that session’s misses are loaded.
3. Return to Home → **Review Mistakes**. Confirm the outstanding saved list is still the historical mistake bank, not only the last session.

## Accessibility (VoiceOver)

1. Enable VoiceOver and Dynamic Type at a larger size.
2. Confirm Home actions, answer options, flag controls, exam navigator cells, and dialogs have spoken labels.
3. Confirm correct/incorrect options announce “Correct answer” / “Your answer” and are not colour-only.
4. Confirm primary buttons remain easy to tap and text still wraps at the larger size.
