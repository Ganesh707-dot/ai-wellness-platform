# Veridian Clinical — NestJS API

Enterprise REST backend for [Veridian Clinical](https://veridian-clinical.vercel.app), powered by **NestJS** and **Neon PostgreSQL**.

## Stack

| Layer | Technology |
|-------|------------|
| API | NestJS 11, Express |
| ORM | Prisma 5 |
| Database | Neon PostgreSQL (serverless) |
| LLM | Groq (optional) |
| Deploy | Vercel (serverless) or `node dist/main` |

## Quick start (local)

```bash
cd backend
cp .env.example .env
# Paste your Neon DATABASE_URL and GROQ_API_KEY into .env

npm install
npm run db:push      # create tables on Neon
npm run db:seed      # demo users + sample data
npm run start:dev    # http://localhost:4000/api/v1
```

### Health check

```bash
curl http://localhost:4000/api/v1/health
```

Expected when Neon is connected:

```json
{
  "status": "ok",
  "service": "veridian-clinical-api",
  "database": "connected",
  "liveLlm": true
}
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Service + DB + Groq status |
| GET | `/api/v1/doctors` | List verified doctors |
| GET | `/api/v1/doctors/:id` | Doctor profile + testimonials |
| GET | `/api/v1/appointments` | List appointments (`?userId=`) |
| POST | `/api/v1/appointments` | Book appointment |
| GET | `/api/v1/ai/status` | Groq configuration |
| POST | `/api/v1/ai/chat` | AI chat (patient/doctor modes) |
| GET | `/api/v1/innovation/live-data` | Bioprint live research data |

## Neon setup (what to send me)

From [Neon Console](https://console.neon.tech):

1. Create project → **PostgreSQL 16**
2. Copy **Pooled connection string** (recommended for serverless)
3. Format: `postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

Set as `DATABASE_URL` in:

- `backend/.env` (local)
- Vercel project env for `veridian-clinical-api`

Then run:

```bash
npm run db:push
npm run db:seed
```

## Demo logins (after seed)

| Email | Password | Role |
|-------|----------|------|
| patient@test.com | password123 | Patient |
| doctor@test.com | password123 | Doctor |
| admin@test.com | password123 | Admin |

## Deploy to Vercel

```bash
cd backend
vercel --prod
```

Set env vars on the Vercel project:

- `DATABASE_URL` — Neon pooled URL
- `GROQ_API_KEY`, `GROQ_MODEL`
- `CORS_ORIGINS` — `https://veridian-clinical.vercel.app`
- `AUTH_SECRET` — same as Next.js frontend

Suggested project name: **veridian-clinical-api**

## Connect Next.js frontend

In `web/.env.local`:

```env
NEST_API_URL=http://localhost:4000
# production:
# NEST_API_URL=https://veridian-clinical-api.vercel.app
```

Next.js can proxy selected routes via `next.config.ts` rewrites (see root `NESTJS_NEON_SETUP.md`).

## Architecture

```
Browser → Next.js (Vercel) → NestJS API (Vercel) → Neon PostgreSQL
                          ↘ Groq LLM
                          ↘ ClinicalTrials.gov / PubMed
```

Next.js keeps Auth.js sessions; NestJS owns persistence and enterprise REST endpoints.
