# Live Portfolio Status — Updated Aug 2026

## Veridian Clinical (NestJS + Neon — one URL)

| Item | Value |
|------|--------|
| **Live** | https://veridian-clinical.vercel.app |
| **NestJS API** | https://veridian-clinical.vercel.app/api/v1/health |
| **Repo** | `ai-wellness-platform` (monorepo: `web/` + `backend/`) |
| **Database** | Neon PostgreSQL (real CRUD, no dummy 10k seed) |
| **Architecture** | Next.js UI + NestJS at `/api/v1` on **same domain** |

### Demo logins (Neon)
- `admin@test.com` / `password123`
- `doctor@test.com` / `password123`
- `patient@test.com` / `password123`

### Vercel env (web project)
```
DATABASE_URL=<Neon pooled URL>
DEMO_MODE=false
AUTH_SECRET=<same as before>
GROQ_API_KEY=<optional>
```

### CRUD demo paths
- Admin users: `/admin/users` — Create, Activate, Update
- Doctors: `/api/doctors` — from Neon
- Appointments: patient/doctor dashboards — real DB
- Nest health: `/api/v1/health`

---

## CareerPilot AI (FastAPI + Next.js)

| Item | Value |
|------|--------|
| **Live** | https://careerpilot-ai-omega-khaki.vercel.app |
| **API** | https://careerpilot-api.vercel.app |
| **Fixes** | Direct resume upload (bypass 4.5MB proxy), faster hydration, lazy mentor chat |

### Resume upload
- Max **4MB** — PDF, DOCX, TXT, MD
- Upload goes **direct to FastAPI** (CORS enabled)
- Needs `DATABASE_URL` on `careerpilot-api` for persistence

### Vercel env
**Frontend:** `NEXT_PUBLIC_BACKEND_URL=https://careerpilot-api.vercel.app`  
**Backend:** `DATABASE_URL`, `CORS_ORIGINS` (include frontend URL)

---

## Local dev

```bash
# Veridian — full stack
cd ai-wellness-platform/web && npm install && npm run dev
# Nest builds automatically on `npm run build`; dev API at /api/v1 when deployed

# CareerPilot
cd Ai-Powered-Career-cockpit/frontend && npm run dev
cd Ai-Powered-Career-cockpit/backend && uvicorn app.main:app --reload
```

---

## Interview one-liner

> Two production monorepos: **Veridian Clinical** (Next.js + **NestJS** + **Neon** CRUD on one URL) and **CareerPilot** (Next.js + **FastAPI** + resume upload to Postgres). Both use real databases, lightweight UI, and live Vercel deploys — no fake datasets.
