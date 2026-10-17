# Age Census — features & backlog

**Single source of truth** for what shipped, what’s next, and what’s out of scope.  
(Supersedes the separate Cursor plans `age-census-product-features` and `age-census-technical`.)

## Product rules

- Home is a **map of ages**, not a calendar. Email is backup, not the product.
- **No yearly seal quota** — unlimited ages per calendar year (subject to seal balance).
- **One sealed letter per future age** — second seal to the same age is blocked.
- A **seal** is a **paid credit** consumed when sealing a letter (1 free on signup). It is **not** the retired yearly stamp quota — do not reintroduce unused-stamp language.
- Opening happens **in-app** after sign-in. **Never** put letter body or census answers in email.

## How to track

| Status | Meaning |
|--------|---------|
| Done | Shipped in the app |
| Todo | Open work — pick from here |
| Later | Intentionally deferred |
| Out | Won’t build (v1 / forever) |

Update this file when you finish or add work. Prefer checkboxes under **Backlog** for day-to-day tracking.

---

## Done

### Identity & account
- [x] Magic-link sign-in (Auth.js; console link in local/dev)
- [x] Birth date + timezone onboarding; birth date locks after first sealed letter
- [x] Change-email with verification (new address confirmed before it becomes primary)
- [x] Delete account: optional letter-data JSON export, then irreversible wipe (no standalone export)
- [x] Paid seals: balance starts at **1**; packs **$1 / $3.50 / $6 / $12** (1 / 5 / 10 / 20); buy on `/seals`; Stripe Checkout + webhook + success fulfill; local **Grant** when Stripe keys missing; soft-check balance to start a new age; consume **1** on seal

### Age map & ritual
- [x] Map of future ages (milestones 30–80 + custom)
- [x] Chair states: empty / draft / sealed / unlocked / opened
- [x] Cannot address current or past age
- [x] Drafts until irreversible seal; one letter per target age
- [x] Paper-and-wax UI pass

### Census & unlock
- [x] Versioned census: fear, love, work, home, regret + free-form letter
- [x] Unlock on the birthday they turn N; in-app unseal
- [x] Comparison view across opened censuses

### Email-as-backup
- [x] Cron `POST /api/cron/unlock-emails` (Bearer `CRON_SECRET` in production)
- [x] ~30-day pre-unlock hygiene reminder → Settings (`staleEmailSentAt`)
- [x] Birthday unlock “letter waiting” email → `/open/[letterId]` (`unlockEmailSentAt`)
- [x] Idle draft reminder (~7 days) → `/write/[age]` (`draftReminderSentAt`)
- [x] Shared mailer: Resend when `AUTH_RESEND_KEY` set, else console

### Security (content at rest)
- [x] Letter body + census values encrypted with **AES-256-GCM** (`CONTENT_ENCRYPTION_KEY`)
- [x] Format `v1:` + base64(iv ‖ ciphertext ‖ tag); AAD = letter id + field
- [x] Decrypt only on write / open / account export; metadata stays clear for map + jobs
- [x] Legacy plaintext readable; migrate with `npm run content:encrypt`

### Infra baseline
- [x] Next.js App Router + TypeScript + Tailwind
- [x] Postgres via Docker Compose (host **5433** → 5432)
- [x] Prisma models (User, Letter unique on `[userId, targetAge]`, SealPurchase, notify sent-at fields, etc.); Stamp model removed
- [x] Domain modules + unit tests (`age`, `census`, `letters`, seals, notify, crypto, …)
- [x] Local scripts: `db:up`, `db:migrate`, `test`, `dev`
- [x] Stamp model / unused-stamp notify removed (decorative `StampIcon` only if used)
- [x] SealConfirm two-step dialog with `useFormStatus` pending state

### Export scope (delete-account) — frozen for now
Letter-related JSON only: target age, status, body, census, timestamps, age-at-writing, unlock instant.  
**Not** included: seal ledger, auth tokens, sessions, full account dump.

---

## Backlog (todo)

### Product / UX
_(none — near-term product backlog is complete)_

### Technical / ops

- [ ] **Real magic-link email** — wire Auth.js `sendVerificationRequest` to Resend when `AUTH_RESEND_KEY` is set; keep console fallback locally
- [ ] **Migration verify** — confirm `drop_stamps` (and later migrations) apply on a clean volume; document for fresh clones
- [ ] **Tests + Vitest config** — more integration coverage (seal/spend, webhook idempotency); fix Vitest/Vite `configLoader` warning (`"type": "module"` or rename config)
- [ ] **CI** — lint + `npm test` + build once a git remote exists
- [ ] **Git remote + deploy** — add origin, push; host (e.g. Vercel + managed Postgres); release migrations; secrets: `AUTH_SECRET`, `AUTH_URL`, `EMAIL_*`, `DATABASE_URL`, `STRIPE_*`, `CONTENT_ENCRYPTION_KEY`, `CRON_SECRET`
- [ ] **Security pass** — rate-limit magic links; sealed content never returned before unlock; webhook signatures; never trust client pack size for credit

### Later (hardening / optional)

- [ ] Move content key to **KMS**; then per-user wrapped DEKs
- [ ] Optional **E2E / zero-knowledge** lockbox (passphrase or passkey + recovery kit) — only with recovery from day one
- [ ] Standalone anytime letter export (beyond delete-account flow)
- [ ] Broader account-field export

---

## Out of scope

- Native iOS / Android
- Voice, photos, physical mail
- Reply-to-past-self thread
- Public or generation feed
- AI writing help
- Yearly stamp quota / unused-stamp reminder (retired)

---

## Proven vertical slice

Create account → map → seal several future ages in one year (e.g. 40, 50, 60, 70) → second seal to 70 blocked → (with seals balance) buy/grant more → open on birthday → compare census.  
Emails and at-rest encryption run alongside without changing that ritual.
