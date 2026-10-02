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

Sign in with email. In development the magic link is printed in the server console.

```bash
npm test
npm run build
```

See [FEATURES.md](FEATURES.md) for MVP vs later.
