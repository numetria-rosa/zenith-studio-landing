# Draft post — Law Firm AI Team

Service source: src/lib/services.ts ("law-firms", $1,200/mo). Format: seb.ai pill-diagram
pipeline (insta/research/competitor-analysis.md, section 3d) + comment-keyword CTA (section 1).

## Slide 1 (hook / cover)
Cream background, black condensed headline, one accent color (navy or deep red — law-appropriate,
not the orange/green already used on course-ads).

**Headline:** "Your firm works 49 hours a week and bills 37."
**Subhead:** "Here's where the other 12 went."

(This is the service's own `pitch` line — already tested copy, reused as the hook.)

## Slide 2 — the pipeline (pill-diagram)
Three pills, left to right, each with an icon + one-line label:

1. **INTAKE** — "Answers and qualifies every enquiry, day or night"
2. **FOLLOW-UP** — "Works the leads that didn't retain"
3. **BILLING** — "Reconstructs billable time before the write-down window closes"

Caption under the diagram: "One AI team. Three roles. Zero hires."

## Slide 3 — the payoff / CTA slide
**Text:** "Comment 'LAW' and I'll send you the full breakdown."

## Caption (feed text)

Your firm works 49 hours a week and bills 37.

The missing 12 hours aren't a productivity problem. They're three specific leaks:

→ Enquiries that come in after hours and don't get answered until tomorrow
→ Leads that didn't retain and never got followed up on again
→ Billable time that never got logged before the write-down window closed

We built an AI team that closes all three:

🤖 AI Intake Coordinator — answers and qualifies every enquiry, day or night
📞 AI Follow-Up Clerk — works the leads that didn't retain
🧾 AI Billing Clerk — reconstructs billable time before it's written down

One team. Three roles. No hires, no training, no sick days.

Comment "LAW" and I'll send you the full breakdown of how it works.

#lawfirm #legaltech #aiautomation #lawyersofinstagram #legalmarketing #aiagents

---

## Notes
- Reuses `pitch` and `description` from services.ts almost verbatim — that copy was already
  written deliberately, no need to reinvent it.
- Same pill-diagram template works for the Brokerage AI Team service — swap labels to Inside
  Sales Agent / Transaction Coordinator / Database Manager, swap accent color, same structure.
- Next step to actually produce the image: reuse the existing course-ads HTML→screenshot pipeline
  (scripts/_gen-insta-course-ads.mjs) as a base, new template matching the cream/pill-diagram style
  instead of the current course-ad look.
