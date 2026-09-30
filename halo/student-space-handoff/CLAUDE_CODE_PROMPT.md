# Prompt for Claude Code

Unzip this folder into the repo as `design-handoff/student-space/`, next to the course handoff. Then paste everything below the line.

---

Next piece: the **student space**. It's where logged-in students see every course they bought and manage their profile. The designs are in `./design-handoff/student-space/`.

## What's in it
- `reference/source/StudentDashboard.dc.html` and `StudentProfile.dc.html`: **the source of truth.** Every value is inline.
- `reference/screenshots/*.png`: the rendered result at 1440 wide.
- `reference/html/*.html`: the same screens as runnable pages.
- `SPEC.md`: layout, data sources, behaviour, empty states and responsive rules.

It uses the same Obsidian tokens and primitives as the course app (`design-handoff/design/tokens.css`). Reuse the components you already built (Glass, Button, Eyebrow, Pill, Icon, ProgressBar, LessonRow, the sidebar shell). Don't make a second set.

## Build
1. **Routes:**
   - `/account` is My courses.
   - `/account/profile` is Profile. The sidebar's Purchases and Notifications items jump to `#purchases` and `#notifications` on it.
   - Both are gated by the existing login and entitlement check.
   - If the repo already has an account or dashboard route, tell me before choosing where these go.
2. **Data:**
   - Owned courses come from the existing entitlement/enrollment source only.
   - Progress, stats, recent activity and "continue learning" come from the progress tables. The hero shows the most recently opened course and its next incomplete lesson.
   - Streak = consecutive days with at least one completion, in the student's timezone.
3. **Profile:**
   - Add `displayName`, `timezone`, `githubUrl`, `linkedinUrl`, `avatarUrl` and notification preferences to the user model, with a migration.
   - Save through a server action with validation.
   - Email is read-only here.
   - Avatar upload goes through whatever storage the repo already uses. Ask me if there's none.
4. **Purchases:**
   - List them from Whop, which we sell through.
   - "Receipt" and "Manage membership" link to Whop's hosted pages. Don't build our own billing UI.
5. **Delete account:** a confirm dialog that requires typing the email. Delete the profile and progress, but keep purchase records for billing.
6. **Certificate card:**
   - We don't generate certificates yet. Show the card as locked, with progress toward the capstone, as designed.
   - Don't build certificate generation unless I ask.
7. **Empty states and responsive rules:** as in SPEC.md.

## Accuracy
- At 1440 wide, both screens must match their screenshots:
  - Spacing, sizes, colours, radii, borders, glows and copy.
  - Use arbitrary values or tokens, not Tailwind defaults.
- Add them to the Playwright visual checks, seeded with sample data matching the screenshots. Iterate until only anti-aliasing differs.
- Accessibility:
  - Real inputs with labels.
  - Toggles as buttons with `aria-pressed`.
  - Visible cyan focus rings, 44px touch targets, contrast ≥4.5:1.

## Rules
- Placeholders (`[Student name]`, `[email]`, `[date]`, `[Course title]`, and all numbers) are sample data. Wire them to real data.
- Brand is "Zenith Studio". Offers are "only through Zenith Studio".
- No new dependencies without asking.
- Commit in small steps, and send me Playwright screenshots next to the reference screenshots when both screens are done.
