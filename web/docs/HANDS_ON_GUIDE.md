# Veridian Clinical — Hands-On Study Guide (15 LPA Full-Stack)

**Live:** https://veridian-clinical.vercel.app  
**Repo:** https://github.com/Ganesh707-dot/ai-wellness-platform (deploy folder: `web/`)  
**Stack:** Next.js 15 · Auth.js v5 · Prisma · Groq AI · Vercel

---

## Scenario 1 — Demo live AI to interviewer (5 min)

1. Open https://veridian-clinical.vercel.app/api/ai/status → confirm `"liveLlm": true`
2. Guest intake: `/guest` → type *"health is not well for mother after child birth"*
3. Expect **Women's Wellness** (not Pediatrics)
4. Open `/ai/concierge` → multi-turn chat → **Book with full conversation context**
5. Login `doctor@test.com` / `password123` → `/doctor/appointments` → open encounter → see AI transcript

**Say in interview:** "Sentence-based intent engine + Groq LLM hybrid; fallback if API slow; transcript persists to Redis and booking payload."

---

## Scenario 2 — Git push → Vercel live update

```bash
cd web
# edit files
git add .
git commit -m "feat: describe change"
git push origin main
# OR manual:
npx vercel link --project veridian-clinical
npx vercel --prod --yes
```

**Secrets never in git:** `GROQ_API_KEY` only in Vercel → Settings → Environment Variables.

---

## Scenario 3 — Machine test / round prep (common questions)

| Question | Answer + file |
|----------|-----------------|
| How does RBAC work? | JWT session + `middleware.ts` routes + `lib/rbac.ts` permission bundles |
| How does AI map specialty? | `lib/specialty-intent.ts` phrase-first; `lib/intent-search.ts` KB scoring |
| Where is Groq called? | `lib/ai-client.ts` → `tryGroq()` → `/api/ai/chat` |
| Booking → doctor handoff? | `lib/patient-ai-intake.ts` → `appointment-wizard.tsx` → `demo-store.ts` encounter |
| Cross-device transcript? | `localStorage` + `/api/ai/intake` Redis sync |
| Debounce / no duplicate chat? | `hooks/use-ai-chat.ts` AbortController + `isLoadingRef` |

---

## Key files (study in this order)

| # | File | Why |
|---|------|-----|
| 1 | `web/app/page.tsx` | Landing, bio-innovation section |
| 2 | `web/app/ai/concierge/page.tsx` | Conversational UI |
| 3 | `web/hooks/use-ai-chat.ts` | Chat state management |
| 4 | `web/lib/ai-client.ts` | Groq + intent fallback |
| 5 | `web/lib/specialty-intent.ts` | Sentence intent (not keywords) |
| 6 | `web/lib/patient-ai-intake.ts` | Transcript → booking |
| 7 | `web/components/booking/appointment-wizard.tsx` | Multi-step book flow |
| 8 | `web/middleware.ts` | Route protection |
| 9 | `web/lib/rbac.ts` | Roles & permissions |
| 10 | `web/lib/demo-store.ts` | Live encounters + AI fields |

---

## API routes cheat sheet

| Route | Purpose |
|-------|---------|
| `POST /api/ai/chat` | Main conversational AI |
| `GET /api/ai/status` | Is Groq configured? |
| `GET /api/innovation/live-data` | **Live** ClinicalTrials.gov + PubMed |
| `POST /api/innovation/lab-jobs` | Bioprint job orchestration |
| `POST /api/ai/match-clinician` | Booking specialty + rank doctors |
| `POST /api/ai/intake` | Sync transcript server-side |
| `POST /api/auth/[...nextauth]` | Login session |

---

## Demo credentials

| Email | Role | Password |
|-------|------|----------|
| patient@test.com | PATIENT | password123 |
| doctor@test.com | DOCTOR | password123 |
| admin@test.com | ADMIN | password123 |

---

## Deploy checklist

- [ ] `GROQ_API_KEY` + `GROQ_MODEL=llama-3.3-70b-versatile` on Vercel
- [ ] Optional: `KV_REST_API_URL` + token for cross-device intake
- [ ] `npx vercel --prod` from `web/`
- [ ] Hit `/api/ai/status` after deploy

---

## Portfolio siblings

| Project | Live | Stack |
|---------|------|-------|
| **Veridian Clinical** | veridian-clinical.vercel.app | Next.js + Groq |
| **Career Cockpit** | careerpilot-ai-omega-khaki.vercel.app | Next.js + FastAPI + Groq |
| **IBS AirBook** | airbook-glvv.onrender.com | Angular + Spring Boot |

See `C:\Users\Admin\Projects\DEVELOPER_ROADMAP.md` for full VS Code journey, paths, Vercel, and deploy commands.
