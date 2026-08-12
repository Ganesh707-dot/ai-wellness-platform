# Developer Roadmap — Veridian Clinical (in-repo copy)

See also: `C:\Users\Admin\Projects\DEVELOPER_ROADMAP.md` (master for all 3 projects)

## Live

- **Site:** https://veridian-clinical.vercel.app
- **Repo:** https://github.com/Ganesh707-dot/ai-wellness-platform
- **Deploy folder:** `web/` (frontend) · `backend/` (NestJS API)
- **Vercel project:** `ganesh-v/veridian-clinical`

## Architecture (enterprise)

```
Next.js (web/)  ──►  NestJS (backend/)  ──►  Neon PostgreSQL
     │                      │
     Auth.js + RBAC         Prisma + 10k seed
     Bioprint 3D UI         Groq + ClinicalTrials.gov
```

## NestJS API

| Route | Purpose |
|-------|---------|
| `GET /api/v1/health` | DB + Groq status |
| `GET /api/v1/analytics/enterprise-stats` | 10k dataset metrics |
| `GET /api/v1/doctors?page=&limit=` | Paginated doctors |
| `GET /api/v1/appointments` | Paginated appointments |
| `POST /api/v1/ai/chat` | Groq clinical AI |
| `GET /api/v1/innovation/live-data` | Bioprint research APIs |

## Bioprint (3D + live APIs)

| Route | Source |
|-------|--------|
| `GET /api/innovation/live-data` | ClinicalTrials.gov + PubMed |
| `POST /api/innovation/lab-jobs` | Print orchestration |
| `web/components/innovation/bioprint-3d-viewer.tsx` | Isometric 3D (mobile + laptop) |

## Key files

- `backend/docs/ADVANCED_NESTJS_STUDY.md` — advanced NestJS study guide
- `NESTJS_NEON_SETUP.md` — Neon + Vercel deploy
- `VSCODE_DEV.md` — VS Code tasks + git workflow
- `web/lib/nest-api-client.ts` — frontend → NestJS client
- `backend/prisma/seed-enterprise.ts` — 10,000 appointments

## VS Code

```bash
# Full stack (or use Ctrl+Shift+B → full stack dev)
cd web && npm run dev
cd backend && npm run start:dev
```

## Database (Neon)

```bash
cd backend
npm run db:push
npm run db:seed:enterprise
```

## Deploy

```bash
git push origin main
cd web && npx vercel --prod --yes
```

**NestJS runs on the same URL:** `https://veridian-clinical.vercel.app/api/v1/health`

Set `DEMO_MODE=false` and `DATABASE_URL` on Vercel (no separate API project needed).
