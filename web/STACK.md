# Stack map (read this if you expected Java)

This project is **not a Java backend**.

| Layer | Technology | Where in repo |
|-------|------------|----------------|
| UI | React 19 + Next.js App Router | `web/app/**`, `web/components/**` |
| Backend APIs | Next.js Route Handlers (TypeScript) | `web/app/api/**` |
| Auth + RBAC | Auth.js (NextAuth v5) + middleware | `web/auth.ts`, `web/auth.config.ts`, `web/middleware.ts` |
| AI | TypeScript client + `/api/ai/*` | `web/lib/ai-client.ts`, `web/app/api/ai/**` |
| Data (demo) | In-memory enterprise mock fabric | `web/lib/demo-data.ts` |
| Data (future) | Prisma + Neon Postgres | `web/prisma/schema.prisma` |

## Why you don’t see `.java` files
Cursor is correct — there are **zero Java files**. “Backend” here means **Node/TypeScript API routes** inside the same Next.js app (standard for modern full-stack JS roles).

## AI configuration (current)
1. Browser calls `POST /api/ai/chat` (also triage/coach/copilot routes)
2. `lib/ai-client.ts` runs:
   - **Default:** Veridian clinical engine (always works, specialty routing)
   - **Optional live LLM:** set Vercel env `GROQ_API_KEY` (free at console.groq.com) or `AI_LIVE=true` for Pollinations

## Auth / RBAC
- Login: Credentials provider (`patient|doctor|admin@test.com` / `password123`)
- Middleware enforces `/dashboard` PATIENT, `/doctor` DOCTOR, `/admin` ADMIN
- Header updates dynamically after login (Sign out + workspace link)

## Role workspaces (enterprise UX)
| Role | Shell | Key routes | AI surface |
|------|-------|------------|------------|
| PATIENT | `RoleShell` PATIENT | `/dashboard`, appointments, prescriptions, book | Symptom Navigator (`/ai/concierge`) |
| DOCTOR | `RoleShell` DOCTOR | `/doctor`, schedule, patients | Encounter CDS (`/doctor/copilot`) |
| ADMIN | `RoleShell` ADMIN | `/admin`, users, encounters | ops stats only |

## Enterprise RBAC
Roles are **permission bundles** (`resource:action`), enforced in middleware + APIs:
- `PATIENT` · `DOCTOR` (fresh clinician tier) · `CLINICAL_LEAD` · `ADMIN`
- Policy console: `/admin/rbac` · IAM: `/admin/users`
- JWT carries `permissions[]` + `clinicianTier`

## Naming (professional CDS — not commerce / not diagnosis)
| Avoid | Use |
|-------|-----|
| Conversational commerce | Telehealth referral / clinical intake |
| AI diagnosis | Clinical decision support (CDS) |
| Care Concierge | Symptom Navigator |
| Clinical AI / Copilot (patient-facing) | Encounter CDS (clinician-only) |
| Wellness coach | Between-Visit Guidance |

## API list contracts (UI must unwrap)
All list endpoints return **objects**, never bare arrays:
- `{ patients: [...] }` · `{ appointments: [...] }` · `{ prescriptions: [...] }` · `{ users: [...] }`
- Client pages use `Array.isArray(data.<key>) ? data.<key> : []`

## Future production path
`DEMO_MODE=false` + `DATABASE_URL` (Neon) + optional Google/GitHub OAuth env vars.
