# Env vars — WhatsApp AI Agent for Umrah/Hajj agencies

This repo doesn't commit a `.env.example` (blanket `.env*` gitignore rule),
so new vars are documented here instead. Set these in `.env` locally and
in Vercel for this project, alongside the existing shared vars
(`DATABASE_URL`, `AUTH_SECRET`, `WHOP_*`, `RESEND_API_KEY`, `GROQ_API_KEY`,
`ANTHROPIC_API_KEY` — already required by the rest of this repo, not
re-documented here).

| Var | Purpose |
|---|---|
| `META_APP_ID` | Meta app id — platform-level, not per-agency. First agencies connect manually via the admin dashboard (WABA ID/phone number ID/token pasted per agency), see CLAUDE.md. |
| `META_APP_SECRET` | Meta app secret. |
| `META_WEBHOOK_VERIFY_TOKEN` | Verify token Meta uses on the webhook subscription handshake. |
| `META_ACCESS_TOKEN_ENCRYPTION_KEY` | Own encryption key for `WaWhatsAppAccount.encryptedAccessToken`, via the existing `encryptSecret`/`decryptSecret` pattern (`src/lib/secrets.ts`), separate from `OAUTH_ENCRYPTION_KEY` and `PASSWORD_ENCRYPTION_KEY`. |
| `GROQ_MODEL` | Default `openai/gpt-oss-20b`. Env-configurable per CLAUDE.md — verify current id/price at console.groq.com/docs/models before changing. |
| `CLAUDE_MODEL` | Default `claude-haiku-4-5-20251001`. Single escalation model — verify at claude.com/pricing before changing. |
| `WA_EMBEDDINGS_API_KEY` | **Not yet applicable — no embeddings provider chosen.** Do not set or read this until CLAUDE.md's open decision is resolved. |
| `WHATSAPP_UMRAH_EMBEDDED_SIGNUP_ENABLED` | `"true"` to turn on Embedded Signup in the client dashboard. Leave unset (default off) until Business Verification + App Review are approved - see `src/lib/whatsapp-umrah/embedded-signup.ts`. The real Facebook Login for Business widget still isn't wired in as of 2026-09-30; flipping this on only changes which UI branch renders. |
| `WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP` | Optional, default `10` — Meta's own rolling-7-day new-business-customer cap for unapproved Tech Providers. Raise to `200` once approved. |
