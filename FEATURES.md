# Age Census features

The product is a rite of addressing future ages, not a letter scheduler. Home is a map of **ages**. Email is a backup, not the product.

**Rule:** no yearly seal quota · **one sealed letter per future age**. A **seal** is a credit (1 free on signup; more via purchase) consumed when sealing — not the retired yearly stamp.

Pending work lives in two plans (do not duplicate long backlog here):

- **Product / UX:** `/Users/evilemi/.cursor/plans/age-census-product-features.plan.md`
- **Technical / ops:** `/Users/evilemi/.cursor/plans/age-census-technical.plan.md`

## Done

### Identity
- Email magic-link sign-in (dev: link in server console)
- Birth date + timezone required
- Birth date locks after the first sealed letter
- Change-email with verification (new address verified before it becomes primary)
- Delete account with letter-data export before wipe (no standalone export)
- Paid seals: 1 free on signup; packs $1 / $3.50 / $6 / $12; consume 1 on seal

### Age map
- Home is future ages (milestones 30–80 + custom)
- Chair states: empty, draft, sealed, unlocked, opened
- Cannot address current or past age

### Seals (ritual rule)
- No yearly seal quota (unlimited ages per calendar year, subject to seal balance when paid seals ship)
- One sealed letter per future age (second seal to the same age blocked)
- Drafts per age until seal; seal irreversible

### Census + unlock
- Versioned census: fear, love, work, home, regret + free letter
- Unlock on birthday they turn N; in-app unseal
- Comparison view across opened censuses
- Birthday unlock email: warm “letter waiting” notify + deep link (no letter body; open in-app)
- ~30-day pre-unlock hygiene reminder (Settings CTA; no letter body)
- Idle unsealed-draft reminder (one-time after ~7 days; write-route deep link)
- Notify cron: `/api/cron/unlock-emails` runs stale + unlock + draft jobs

## In product plan

_(none pending)_

## In technical plan

- Real Resend (or equiv) magic-link delivery (transactional mailer already uses Resend when keyed)
- Stamp module leftovers / migration verify
- Tests, CI, git remote + deploy, secrets, security hardening
- Finish or discard uncommitted SealConfirm polish

## Out of v1

- Native iOS/Android
- Voice, photos, physical mail
- Reply-to-past-self thread
- Public or generation feed
- AI writing help
- Yearly stamp quota (retired)

## First vertical slice

Create account → see map → seal letters to several future ages in one year (e.g. 40, 50, 60, 70) → a second seal to 70 is blocked → open on birthday → compare.
