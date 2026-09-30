# Student space: spec

These are two screens for logged-in students: **My courses** (the dashboard) and **Profile**. They use the same Obsidian system as the course app, so reuse its tokens (`design-handoff/design/tokens.css`) and its primitives: Glass, Button, Eyebrow, Pill, Icon, ProgressBar and LessonRow.

The source of truth is `reference/source/*.dc.html`. Every value in it is inline, so read it; don't guess. `reference/screenshots/` shows the result at 1440 × 1320 and 1440 × 1300. The pages in `reference/html/` open in a browser.

## Shell (both screens)
- **Sidebar (260px)**, the same recipe as the course app sidebar:
  - Brand: logo, "Zenith Studio", "Student space".
  - An "Account" group with My courses, Profile, Purchases, Notifications and Support.
  - The active item uses a cyan fill at 0.10 with an inset ring at 0.30.
  - At the bottom: the student card (avatar with a cyan-to-violet gradient and initials, name, email) and Sign out.
  - Purchases and Notifications jump to their sections on the Profile page.
- **Main:** padding 48px 56px 56px, with a cyan glow in the top-right corner.
- **Page header:** a mono eyebrow, a 52px H1 (1.02 line height, -0.045em tracking), and a Mist subtitle. There is an optional right-aligned action (Browse courses).

## My courses (`StudentDashboard`)
1. **Continue learning hero.** It uses the violet course accent: a gradient border at `rgba(199,176,255,0.30)` and a violet glow.
   - Eyebrow: "Continue learning · {course}".
   - H2: "Module {n} · {title}" (38px).
   - "Up next" line.
   - Progress bar: gradient from `#8B5CF6` to `#5CC8FF`, with the percentage beside it.
   - Buttons: "Resume lesson x.y" (Frost) and "Open course" (glass).
   - Right panel (300px), "This module": the module's lessons in done, current and next states, with minutes.
   - Data: the most recently opened course, and its next incomplete lesson.
2. **Stats row**: 4 glass tiles, each an icon tile plus a value and label.
   - Courses owned (violet)
   - Lessons completed (mint)
   - Quizzes passed (cyan)
   - Learning streak (amber)
3. **My courses**: a 2-column grid, one card per owned course.
   - A 128px cover: the course accent gradient, the grid pattern, the course name at 28px, and a status pill in the top right.
     - In progress: cyan.
     - Not started: neutral.
     - Completed: use mint, following the same pattern.
   - The edition as a mono eyebrow in the accent colour, the title, and "n modules · n h · Lifetime access".
   - A progress bar with the percentage.
   - Footer: "Last opened …" or "Purchased …" on the left, and Continue (Frost) or Start course (glass) on the right.
   - After the cards, a dashed full-width "Explore more courses" row that links to the course catalogue.
4. **Right rail (340px)**:
   - **Recent activity:** the last 4 events (lesson finished, quiz passed, exercise completed, cheat sheet downloaded).
   - **Certificate card:** amber, with a lock-style shield icon and progress toward the capstone.

## Profile (`StudentProfile`)
1. **Identity card.** Cyan-to-violet gradient border.
   - 88px avatar.
   - Name at 28px, email · "Member since".
   - Pills: "n courses" (violet) and "n lessons done" (mint).
   - A "Change photo" button.
2. **Two columns: left 1.35fr, right 1fr.**
   - **Profile details** (left):
     - A 2-column form: full name, display name, email, timezone, GitHub and LinkedIn.
     - Inputs: 48px tall, radius 14, 1px border at `rgba(255,255,255,0.14)`, background at 0.04, with an optional leading icon.
     - Email is read-only (dimmer border and background, Mist text), with the hint "Linked to your purchase account."
     - GitHub has the hint "Used for project submissions."
     - Cancel (glass) and Save changes (Frost) sit on the right.
   - **Notifications** (right): 3 toggles.
     - The toggle is 48 × 28. On: mint border at 0.6, fill at 0.35, knob `#7FF0BD`. Off: neutral.
     - Each has a label and a hint line.
   - **Delete account** (right): an ember card with an outline ember button. It must open a confirm dialog that asks the student to type their email.
3. **Purchases** (full width):
   - Table columns: Course (title plus edition / "Lifetime access"), Date, Paid, and a Receipt button.
   - "Manage membership" (glass) in the section header.

## Behaviour
- **Access and data:**
  - Owned courses come from the existing entitlement or enrollment records. Never show a course the student doesn't own.
  - Progress, activity and stats come from the lesson progress, quiz attempts and exercise submissions tables.
  - Streak = consecutive days with at least one completion, computed in the student's timezone.
- **Purchases:** from the payment provider (Whop). The Receipt and Manage membership buttons link to Whop's hosted pages.
- **Profile edits:** save to our User record and validate the URLs. The email itself is changed through the purchase/login provider, not here.
- **Empty states:**
  - No courses: the hero becomes "Start your first course" with a catalogue CTA, and the grid shows only the Explore row.
  - No activity: hide the rail list and show "Your activity will show up here".
- **Placeholders:** `[Student name]`, `[email]`, `[date]`, `[Course title]` and every number are sample data. Everything is wired to real data.
- **Responsive:** same rules as the course app.
  - Below 1024: the sidebar becomes a drawer, the right rail moves under the courses, and the form goes to 1 column.
  - Below 640: stats become 2 × 2, the course grid 1 column, and the purchases table turns into stacked cards.
