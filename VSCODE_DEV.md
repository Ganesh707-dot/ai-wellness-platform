# VS Code Development — Veridian Clinical

Monorepo layout for **Next.js frontend** + **NestJS API** + **Neon PostgreSQL**.

## Open in VS Code

```bash
code C:\Users\Admin\Projects\ai-wellness-platform
```

Recommended extensions: **ESLint**, **Prisma**, **Tailwind CSS IntelliSense**, **REST Client** (optional).

---

## First-time setup

```bash
# Terminal 1 — frontend
cd web
cp .env.example .env.local   # if exists; add AUTH_SECRET, GROQ_API_KEY
npm install
npm run dev                  # http://localhost:3000

# Terminal 2 — NestJS API
cd backend
cp .env.example .env
# Paste Neon DATABASE_URL (pooled) + GROQ_API_KEY
npm install
npm run db:push
npm run db:seed:enterprise   # 10k appointments
npm run start:dev            # http://localhost:4000/api/v1/health
```

Connect frontend to API — in `web/.env.local`:

```env
NEST_API_URL=http://localhost:4000
DATABASE_URL=<same Neon URL>
```

---

## VS Code tasks (Ctrl+Shift+B)

| Task | Action |
|------|--------|
| **full stack dev** | Starts web + backend in parallel |
| web: dev | Next.js only |
| backend: dev | NestJS watch mode |
| backend: seed enterprise (10k) | Loads enterprise dataset on Neon |

Run via: **Terminal → Run Task…** or default build shortcut.

---

## Debug (F5)

- **Full stack: web + NestJS** — launches both dev servers
- **Next.js: web dev** — frontend only
- **NestJS: backend dev** — API only

---

## Git workflow (private repo)

```bash
git status
git add backend/ web/ .vscode/ NESTJS_NEON_SETUP.md VSCODE_DEV.md
git commit -m "Add NestJS enterprise API, 10k seed, 3D bioprint, VS Code config"
git push origin main
```

Deploy:

```bash
# Frontend (existing)
cd web && npx vercel --prod --yes

# API (new project)
cd backend && vercel --prod --yes
```

Set Vercel env on **both** projects: `DATABASE_URL`, `GROQ_API_KEY`, and on web add `NEST_API_URL`.

---

## Key docs (study order)

1. `VSCODE_DEV.md` — this file
2. `NESTJS_NEON_SETUP.md` — Neon + deploy
3. `backend/docs/ADVANCED_NESTJS_STUDY.md` — advanced NestJS
4. `ENTERPRISE_GUIDE.md` — architecture + interviews
5. `web/docs/HANDS_ON_GUIDE.md` — live demo scenarios

---

## Verify enterprise dataset

```bash
curl http://localhost:4000/api/v1/analytics/enterprise-stats
curl "http://localhost:4000/api/v1/doctors?page=1&limit=5"
curl http://localhost:4000/api/v1/health
```

Mobile bioprint 3D: open `http://localhost:3000/innovation` on phone (same Wi‑Fi) or use deployed URL.

---

## Folder map

| Path | Purpose |
|------|---------|
| `web/` | Next.js UI, Auth.js, demo routes |
| `backend/` | NestJS REST API, Prisma, seeds |
| `.vscode/` | Tasks, launch configs |
| `NESTJS_NEON_SETUP.md` | Database + deployment |

Do **not** commit `.env` or `.env.local` — secrets stay in Vercel env only.
