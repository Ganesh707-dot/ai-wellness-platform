# Maha AI — Holistic Wellness Platform

Enterprise-style telehealth demo for a doctor-facing wellness product.

**Live:** https://maha-ai-wellness.vercel.app  
**Runnable app:** [`web/`](./web/)  
**Full technical + RBAC user manual + 15 LPA interview kit:** [`ENTERPRISE_GUIDE.md`](./ENTERPRISE_GUIDE.md)  
**Deploy (no Docker):** [`DEPLOYMENT.md`](./DEPLOYMENT.md)  
**Extra learning notes:** [`LEARNING_GUIDE.md`](./LEARNING_GUIDE.md)

## Stack

Next.js 15 · React 19 · TypeScript · Auth.js v5 · Prisma · PostgreSQL (Neon) · Tailwind · Zod · Vercel

## Quick start

1. Create a free Neon Postgres DB → copy connection string  
2. Follow [`DEPLOYMENT.md`](./DEPLOYMENT.md)

```bash
cd web
cp .env.example .env.local
# set DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Demo logins (password `password123`):  
`patient@test.com` · `doctor@test.com` (fresh clinician) · `lead@test.com` · `admin@test.com`

## What’s in this repo

| Path | Meaning |
|------|---------|
| `web/` | **Production app** (deploy this) |
| `shared/`, `ui/`, `backend-api/`, `ai-services/`, `docs/` | Original feature batches (source modules) |
| `archives/` | Zip backups of batches |

## Features

- Multi-role auth (Patient / Doctor / Admin) + middleware RBAC
- Appointment booking wizard
- Role dashboards + role-scoped APIs
- Articles CMS
- Prisma schema with audit/consent foundations
- AI fields reserved for Phase 3+ (roadmap)

## Author

Full-stack JavaScript engineer · ~4.5 years · React / Next.js / Angular / SQL / basic AI
