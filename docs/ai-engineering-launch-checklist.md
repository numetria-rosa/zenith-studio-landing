# AI Engineering course: launch checklist

What was built and verified is in the commit history on this branch. This is what has to happen outside the code.

## Before deploying
1. Apply the database migrations to production: `npx prisma migrate deploy`. New tables and columns:
   `AieLessonProgress`, `AieExerciseProgress`, `AieQuizAttempt` (+ `mixedId`), `AieProjectProgress`, `AieOrientation`,
   `AieCapstone`, `AieClient`, `AieSellPlanStep`, and the profile columns on `User` (`20261001080000_student_profile`).
2. Env vars the new pages read: `DATABASE_URL`, `AUTH_SECRET`, `PASSWORD_ENCRYPTION_KEY` (32 bytes, base64: the student
   profile shows and changes the sign-in password), `WHOP_API_KEY` (purchase amounts and receipt links on the profile page).

## Check once on the live site with a real purchase
- Buy through Whop, land on `/welcome`, then `/account`: the course card shows and "Continue" opens `/lab/ai-engineering/learn`.
- `/account/profile`: the sign-in password is shown, and Paid and Receipt show the real amount and open Whop's hosted page.
  (The Whop field names were checked against the SDK types, not against a live payment.)
- Open an exercise: it downloads Pyodide from cdn.jsdelivr.net, so it needs that host reachable from the student's browser.

## Known gaps
- Profile photo upload is disabled (the repo has no file storage).
- Progress is tracked for AI Engineering only; other courses on `/account` show "Owned" with an Open button.
- The old static AI Engineering pages under `/courses/ai-engineering/` still resolve for existing bookmarks. All links now go to the new app.
- Deleting an account anonymises it (purchase records are kept for billing) and is refused for accounts that also have agency or service data.
