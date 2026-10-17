# Age Census

Write to future ages — one sealed letter per age, unlimited seals in a year — and open each on that birthday.

## Local (fresh clone)

Postgres is exposed on **host port 5433** (container 5432). Match that in `DATABASE_URL`.

```bash
cp .env.example .env
npm install
npm run db:up                 # docker compose up -d
# wait until healthy, then either:
npm run db:migrate            # prisma migrate dev  (local / iterating)
# or, apply committed migrations only (CI / prod-like):
npm run db:migrate:deploy     # prisma migrate deploy
npm run dev
```

Confirm schema state anytime with `npx prisma migrate status` (should report all migrations applied).

Sign in with email. In development the magic link is printed in the server console.

Set `CONTENT_ENCRYPTION_KEY` (32-byte base64 from `openssl rand -base64 32`) so letter bodies and census answers are encrypted at rest. To wrap existing plaintext rows after enabling the key:

```bash
npx tsx scripts/encrypt-existing-content.ts
```

New accounts start with **1 free seal**. To buy more, set Stripe test keys in `.env`, or use **Grant (local)** on `/seals` when those keys are empty. After adding Stripe:

```bash
# optional local webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then add the printed `STRIPE_WEBHOOK_SECRET` to `.env`. The success page also credits a paid session once (`session_id`), so local checkout works without the CLI.

### Notify emails (backup)

`GET`/`POST /api/cron/unlock-emails` runs three jobs:

1. **~30-day hygiene** — sealed letters unlocking soon; Settings deep link
2. **Birthday unlock** — warm “letter waiting” mail; `/open/[letterId]` deep link
3. **Draft reminder** — idle unsealed drafts (~7 days); `/write/[age]` deep link

No letter body in any email. Without `AUTH_RESEND_KEY`, messages print in the server console.

```bash
# local (CRON_SECRET optional when unset outside production)
curl -X POST http://localhost:3000/api/cron/unlock-emails

# production / scheduled host (Vercel Cron or external ping)
curl -X POST "$AUTH_URL/api/cron/unlock-emails" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Cron auth:** require `Authorization: Bearer $CRON_SECRET` in production. On Vercel, set project env `CRON_SECRET` — Vercel Cron sends that Bearer header automatically (see `vercel.json`). Do not put the secret in the query string. External schedulers that can set headers use the same Bearer pattern.

`vercel.json` schedules the route **daily at 12:00 UTC** (`0 12 * * *`) so it fits Vercel Hobby (once/day). On Pro you can tighten the schedule if you want nearer birthday-midnight delivery.

```bash
npm test
npm run build
```

### CI

Push or open a PR against a GitHub remote to run `.github/workflows/ci.yml` (`npm ci` → `prisma generate` → test → lint → build with dummy env).

See [FEATURES.md](FEATURES.md) for what shipped, the open backlog, and out-of-scope items (single tracker).
