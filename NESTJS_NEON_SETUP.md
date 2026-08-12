# Veridian Clinical — NestJS + Neon Enterprise Setup

This guide completes the **enterprise architecture**: Next.js frontend + **NestJS REST API** + **Neon PostgreSQL**.

## What you need to send

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) → Connection string → **Pooled** |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com) (same key as frontend) |
| `AUTH_SECRET` | Same value as `web` Vercel env (for future JWT guards) |

Optional: preferred Vercel project name for API (default: `veridian-clinical-api`).

---

## Step 1 — Neon database

1. Create a Neon project (PostgreSQL 16, region closest to users).
2. Copy the **pooled** connection string:
   ```
   postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Save it — never commit to git.

---

## Step 2 — Local backend

```bash
cd backend
cp .env.example .env
# Edit .env — paste DATABASE_URL, GROQ_API_KEY

npm install
npm run db:push
npm run db:seed:enterprise   # 10,000 appointments + 2,000 patients
npm run start:dev
```

Verify enterprise scale:

```bash
curl http://localhost:4000/api/v1/analytics/enterprise-stats
curl "http://localhost:4000/api/v1/doctors?page=1&limit=5"
```

---

## Step 3 — Deploy NestJS API (Vercel)

```bash
cd backend
vercel link    # new project: veridian-clinical-api
vercel env add DATABASE_URL
vercel env add GROQ_API_KEY
vercel env add GROQ_MODEL
vercel env add CORS_ORIGINS   # https://veridian-clinical.vercel.app
vercel --prod
```

Note the production URL, e.g. `https://veridian-clinical-api.vercel.app`.

---

## Step 4 — Connect Next.js frontend

In Vercel **web** project env:

```
NEST_API_URL=https://veridian-clinical-api.vercel.app
DATABASE_URL=<same Neon pooled URL>
```

Local `web/.env.local`:

```env
NEST_API_URL=http://localhost:4000
DATABASE_URL=<your Neon URL>
```

When `NEST_API_URL` is set, Next.js proxies `/api/v1/*` to NestJS (see `web/next.config.ts`).

---

## Step 5 — Interview talking points

> "Veridian Clinical uses a **separated frontend/backend** pattern: Next.js 15 for UI and Auth.js sessions, **NestJS** for enterprise REST modules with **Prisma ORM** on **Neon serverless Postgres**. AI routes proxy to Groq; bioprint lab pulls live ClinicalTrials.gov and PubMed data. RBAC is enforced at the Next.js middleware layer; persistence lives in Neon with audit logs and consent tracking in the schema."

### Architecture diagram

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ──────────────►│  Next.js (Vercel) │
└─────────────┘                │  Auth.js + UI     │
                               └────────┬─────────┘
                                        │ /api/v1/*
                                        ▼
                               ┌──────────────────┐
                               │ NestJS API       │
                               │ (Vercel/Railway) │
                               └────────┬─────────┘
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
             ┌───────────┐      ┌────────────┐      ┌─────────────┐
             │ Neon PG   │      │ Groq LLM   │      │ Public APIs │
             │ (Prisma)  │      │            │      │ CT.gov etc. │
             └───────────┘      └────────────┘      └─────────────┘
```

---

## Migration status

| Feature | Next.js routes | NestJS routes |
|---------|----------------|---------------|
| Health / status | `/api/ai/status` | `/api/v1/health`, `/api/v1/ai/status` |
| Doctors | demo-store | `/api/v1/doctors` (Neon) |
| Appointments | demo-store | `/api/v1/appointments` (Neon) |
| AI chat | `/api/ai/chat` | `/api/v1/ai/chat` |
| Bioprint live | `/api/innovation/live-data` | `/api/v1/innovation/live-data` |
| Auth / RBAC | Next.js middleware | Phase 2 — JWT guards |

Existing Next.js routes stay live during migration. Enable `NEST_API_URL` to shift traffic gradually.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `database: not_configured` | Set `DATABASE_URL` in backend env |
| `database: error` | Use **pooled** Neon URL; check IP allowlist (Neon allows all by default) |
| CORS errors | Set `CORS_ORIGINS` to your frontend URL |
| Empty doctors list | Run `npm run db:seed` in `backend/` |
| Prisma on Vercel cold start | Use Neon pooled connection + `?sslmode=require` |

---

## Files

- `backend/` — NestJS API source
- `backend/prisma/schema.prisma` — shared enterprise schema
- `backend/README.md` — API reference
- `web/next.config.ts` — optional proxy to NestJS
