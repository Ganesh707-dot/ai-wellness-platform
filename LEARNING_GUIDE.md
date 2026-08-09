# Maha AI — Learning Guide (paste into ChatGPT)

Use this file as your **system context** when learning with ChatGPT. Goal: explain this project like a **4.5-year full-stack JS engineer targeting ~15 LPA**.

---

## Your profile (keep this accurate)

- Experience: ~4.5 years enterprise JavaScript
- Stack: TypeScript, React, Next.js, Angular, MySQL/SQL, basic AI integration
- Target: Full-stack roles ~15 LPA
- This project: Doctor-client wellness / telehealth platform (portfolio + learning)

---

## One-sentence product pitch

**Maha AI** is a multi-role telehealth web app where patients book consultations, doctors manage practice workflows, and admins oversee users/appointments — built with Next.js App Router, Auth.js RBAC, Prisma/PostgreSQL, and a modular feature architecture.

---

## What was wrong before (important honesty)

The original GitHub folder was a **module kit** (`shared/`, `ui/`, `backend-api/`, `ai-services/`, `docs/`), not a runnable app (no `package.json` / Prisma file / deploy config).

The runnable app now lives in:

```
web/
```

Batch folders remain as source history. For interviews, say: “I organized features in batches, then assembled them into a production Next.js app.”

---

## Architecture map (memorize this)

```
Browser
  → Next.js App Router (pages + Server Actions + API routes)
  → Middleware (auth + role checks)
  → Auth.js (JWT session)
  → Prisma
  → Neon PostgreSQL
```

Roles:

- `PATIENT` → `/dashboard/*`
- `DOCTOR` → `/doctor/*`
- `ADMIN` → `/admin/*`

Public:

- `/`, `/articles`, `/book-appointment`, `/login`, `/register`

---

## Folder map inside `web/`

| Path | Purpose |
|------|---------|
| `app/` | Routes (UI + API) |
| `actions/` | Server Actions (auth, booking) |
| `components/` | UI + booking wizard |
| `lib/` | db, validation, rbac, utils |
| `prisma/` | schema + seed |
| `auth.ts` | Auth.js config |
| `middleware.ts` | Route protection |

---

## Concepts to master (study order)

### Week 1 — Make it run
1. Neon `DATABASE_URL`
2. `prisma db push` vs migrate
3. Seed users and why bcrypt hashes passwords
4. Vercel env vars + Root Directory `web`

Prompt for ChatGPT:
> Explain Prisma db push vs migrate for a Nest/Next production app. When is each safe?

### Week 2 — Auth & RBAC
1. Credentials provider flow
2. JWT session callbacks (`jwt` / `session`)
3. Middleware role guards vs `requireDoctor()` server checks
4. Why client-only guards are not security

Prompt:
> Compare defense-in-depth RBAC in Next.js middleware vs server components vs API routes.

### Week 3 — Domain & APIs
1. Patient / Doctor / Appointment / Prescription / Consultation models
2. Role-scoped APIs under `/api/patient|doctor|admin`
3. Booking wizard validation with Zod
4. AuditLog + ConsentLog purpose (healthcare)

Prompt:
> Design a booking concurrency strategy (slot double-booking) for this schema.

### Week 4 — Production readiness
1. Observability (logs, error boundaries)
2. Email via Resend
3. Rate limiting / CSRF posture with Auth.js
4. HIPAA-oriented discussion (what MVP has vs what is missing)

Prompt:
> What would I add to move this from portfolio demo to HIPAA-aware architecture?

### Week 5 — AI (roadmap, not fully built)
1. Symptom checker
2. RAG over articles
3. Consultation copilot (`aiSummary` fields already in schema)

Prompt:
> Design a safe medical AI feature set that never replaces clinician judgment.

---

## Interview answers (short)

**Q: Why Next.js App Router?**  
Server Components + Server Actions reduce API boilerplate; good for authenticated dashboards and SEO public pages in one codebase.

**Q: Why Prisma + Postgres?**  
Strong relational model for healthcare entities and role relationships; Prisma gives type-safe queries and schema as documentation.

**Q: Why JWT sessions?**  
Works well on serverless (Vercel) without sticky server sessions; role embedded in token, refreshed from DB in callback.

**Q: Biggest bug you fixed?**  
Public-route middleware used `startsWith("/")`, which made every route public. Fixed with exact/prefix matching.

**Q: What’s not production-complete yet?**  
Password reset stub, OAuth optional, email optional, AI phases planned, medical compliance hardening still needed.

---

## ChatGPT starter prompt (copy/paste)

```
You are my senior mentor for a 15 LPA full-stack interview prep.
I built Maha AI — Next.js 15, Auth.js v5, Prisma, Neon Postgres, role-based telehealth.
I have 4.5 years JS experience (React/Next/Angular/MySQL, basic AI).
Teach me one concept at a time from my LEARNING_GUIDE.md, then quiz me,
then give a stronger interview answer. Start with Auth.js JWT + RBAC middleware.
```

---

## Demo script for recruiters (2 minutes)

1. Open live URL → brand + demo accounts visible
2. Login patient → show appointments + prescriptions
3. Login doctor → show patients/schedule
4. Login admin → show users
5. Open booking wizard steps
6. Mention: middleware RBAC, Prisma schema, Vercel+Neon deploy

---

## Honest scope statement (use this)

“MVP covers auth, RBAC, booking, role dashboards, and articles CMS. AI assistants are schema-ready and roadmapped, not fully shipped yet.”

That honesty builds trust in senior interviews.
