# Age Census

Write to future ages — one sealed letter per age, unlimited seals in a year — and open each on that birthday.

## Local

```bash
cp .env.example .env
npm install
npm run db:up
npx prisma migrate dev
npm run dev
```

Sign in with email. Magic links (and email-change / notify mail) use Resend when `AUTH_RESEND_KEY` or `RESEND_API_KEY` is set; otherwise they print in the server console.

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

`POST /api/cron/unlock-emails` runs three jobs:

1. **~30-day hygiene** — sealed letters unlocking soon; Settings deep link
2. **Birthday unlock** — warm “letter waiting” mail; `/open/[letterId]` deep link
3. **Draft reminder** — idle unsealed drafts (~7 days); `/write/[age]` deep link

No letter body in any email. Without `AUTH_RESEND_KEY`, messages print in the server console.

```bash
# local (CRON_SECRET optional when unset outside production)
curl -X POST http://localhost:3000/api/cron/unlock-emails

# production / scheduled host
curl -X POST "$AUTH_URL/api/cron/unlock-emails" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Schedule that endpoint about hourly (or daily) so unlock-day mail goes out near the user’s birthday midnight in their timezone.

```bash
npm test
npm run build
```

See [FEATURES.md](FEATURES.md) for what shipped, the open backlog, and out-of-scope items (single tracker).
