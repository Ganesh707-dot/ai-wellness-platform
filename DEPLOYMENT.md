# Veridian Clinical — Deployment Guide (Enterprise-style, Free)

No Docker required. Production path = **Vercel (app) + Neon (Postgres)**.

---

## Why this stack (interview talking points)

| Piece | Role | Enterprise parallel |
|-------|------|---------------------|
| Next.js 15 on Vercel | App + API + SSR | App service / CDN edge |
| Neon Postgres | Managed relational DB | RDS / Cloud SQL |
| Prisma | ORM + migrations | Type-safe data access |
| Auth.js (NextAuth v5) | Auth + JWT sessions | Cognito / Auth0 pattern |
| Env vars on host | Secrets | Parameter Store / Vault |

Docker is optional later for local parity — not required for cloud deploy.

---

## Step 1 — Create free Neon database (5 min)

1. Go to https://console.neon.tech and sign up (GitHub is fine).
2. **New Project** → name: `veridian-clinical`.
3. Click **Connect** → copy the **pooled** connection string (hostname contains `-pooler`).
4. It looks like:
   ```
   postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2 — Local run (learn the app)

```bash
cd web
cp .env.example .env.local
```

Edit `.env.local`:

- Paste Neon URL into `DATABASE_URL`
- Set `AUTH_SECRET` and `NEXTAUTH_SECRET` to the same long random string  
  (Git Bash: `openssl rand -base64 32`)
- Keep `NEXTAUTH_URL=http://localhost:3000`

Then:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@test.com | password123 |
| Doctor | doctor@test.com | password123 |
| Admin | admin@test.com | password123 |

---

## Step 3 — Deploy to Vercel (public URL for recruiters)

### Option A — Vercel Dashboard (easiest)

1. Push this repo to GitHub (your remote already exists).
2. Go to https://vercel.com → **Add New Project** → import `ai-wellness-platform`.
3. Set **Root Directory** to `web`.
4. Add Environment Variables (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon pooled URL |
| `AUTH_SECRET` | same secret as local |
| `NEXTAUTH_SECRET` | same secret as local |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` |
| `AUTH_URL` | `https://YOUR-PROJECT.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` |

5. Deploy.
6. After first deploy, from your machine (with same `DATABASE_URL`):
   ```bash
   cd web
   npx prisma db push
   npm run db:seed
   ```
7. Share the Vercel URL with recruiters.

### Option B — CLI

```bash
cd web
npx vercel login
npx vercel
npx vercel env add DATABASE_URL
# ... add other env vars
npx vercel --prod
```

---

## Step 4 — What recruiters should click

1. Home → Book consultation / Sign in
2. Login as patient → `/dashboard`
3. Logout → login as doctor → `/doctor`
4. Logout → login as admin → `/admin`
5. Articles → `/articles`

---

## Common failures

| Symptom | Fix |
|---------|-----|
| Prisma can't connect | Use Neon **pooled** URL + `?sslmode=require` |
| Auth redirect loop | `NEXTAUTH_URL` / `AUTH_URL` must match live site URL |
| Empty dashboards | Run `db:seed` against the **same** Neon DB |
| Build fails on Vercel | Root Directory must be `web`; `postinstall` runs `prisma generate` |

---

## Next learning upgrades (after URL works)

1. Prisma migrate instead of `db push`
2. Real Resend emails
3. OAuth Google/GitHub
4. Stripe payments
5. AI symptom checker (Phase 3 roadmap)
6. Later: Docker Compose for local Postgres parity
