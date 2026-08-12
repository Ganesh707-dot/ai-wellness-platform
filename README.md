# Veridian Clinical — Enterprise AI Wellness Platform

Enterprise telehealth platform with conversational AI, RBAC, and clinician encounter handoff.

**Live:** https://veridian-clinical.vercel.app  
**Product name:** Veridian Clinical

## Stack

- Next.js 15 · React 19 · TypeScript
- Auth.js v5 · RBAC middleware
- Prisma · Neon (demo mode default)
- Groq LLM · ClinicalTrials.gov + PubMed APIs

## Quick start

```bash
cd web
npm install
npm run dev
```

## Demo logins

| Email | Role | Password |
|-------|------|----------|
| patient@test.com | Patient | password123 |
| doctor@test.com | Doctor | password123 |
| admin@test.com | Admin | password123 |

## Docs

- `DEVELOPER_ROADMAP.md` — paths, deploy, Vercel
- `PRIVATE_ACCESS_GUIDE.md` — site password + private GitHub
- `web/docs/HANDS_ON_GUIDE.md` — interview prep

## Deploy

```bash
cd web && npx vercel --prod --yes
```

Set `SITE_ACCESS_PASSWORD` on Vercel for portfolio gate. Set `GROQ_API_KEY` for live AI.
