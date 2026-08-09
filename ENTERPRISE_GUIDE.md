# Maha Health — Enterprise Technical Guide + User Manual

**Live demo:** https://maha-ai-wellness.vercel.app  
**Deploy root:** `web/` (Next.js App Router)  
**Purpose of this doc:** Architecture reference, RBAC how-to, end-user manual, and 15 LPA interview talking points (you can paste sections into ChatGPT for practice).

---

## 1. One-line product pitch

Maha Health is a **full-stack TypeScript telehealth platform** with **permission-based RBAC**, **patient → clinician encounter handoff**, and **clinical decision support (CDS)** — not “AI diagnosis” and not a Java microservice. It is designed as a **problem-solver for fresh doctors** (never open a blank consult) and a **control plane for admins** (IAM + RBAC + audit).

---

## 2. Enterprise architecture

### 2.1 High-level layers

```
Browser (React 19)
    │
    ├─ Pages / Role shells (patient · clinician · admin)
    ├─ Auth.js session (JWT)  ── permissions[] + role + clinicianTier
    │
    ▼
Next.js Middleware (edge) ── route → required permission
    │
    ▼
Next.js Route Handlers (Node/TS) ── denyUnlessPermission()
    │
    ├─ CDS engines (intent search, Symptom Navigator, Encounter CDS)
    ├─ Demo fabric (demo-data + cookie/memory stores)
    └─ Prisma schema ready for Neon Postgres (future)
```

### 2.2 Important clarification (interviews love this)

| Myth | Reality |
|------|---------|
| “Backend is Java” | **No Java.** Backend = Next.js Route Handlers in TypeScript |
| “AI diagnoses patients” | **CDS only** — supports clinicians; licensed humans decide |
| “RBAC = if role === ADMIN” | **Permission matrix** `resource:action` enforced on routes + APIs |
| “Folders `backend-api/`, `ai-services/` are the app” | Those are **legacy batch kits**. **Runnable app = `web/`** |

### 2.3 Tech stack

| Layer | Technology | Key paths |
|-------|------------|-----------|
| UI | Next.js 15, React 19, Tailwind | `web/app/**`, `web/components/**` |
| Auth | Auth.js v5 (Credentials + JWT) | `web/auth.ts`, `web/auth.config.ts` |
| RBAC | Permission policy + middleware | `web/lib/rbac.ts`, `web/middleware.ts` |
| IAM | Admin user store (pending → activate) | `web/lib/user-store.ts`, `/admin/users` |
| CDS / AI | Intent engine + optional Groq | `web/lib/ai-client.ts`, `web/lib/intent-search.ts` |
| Booking handoff | Live encounters + cookies | `web/lib/demo-store.ts` |
| Data (demo) | Generated enterprise mocks | `web/lib/demo-data.ts` |
| Data (prod path) | Prisma + Postgres | `web/prisma/schema.prisma` |
| Deploy | Vercel | `web/vercel.json`, root directory = `web` |

### 2.4 Request lifecycle (auth + RBAC)

1. User signs in → `authorize()` loads managed/seed user  
2. If `isActive === false` or `accessStatus === "pending"` → **login fails**  
3. JWT stores: `role`, `isActive`, `permissions[]` (admin-granted or role preset), `clinicianTier`  
4. Middleware maps path → required permission (`ROUTE_PERMISSIONS`)  
5. APIs call `denyUnlessPermission(role, permission)`  
6. UI uses `useRbac().can("patients:read_chart")` to show/hide actions  

### 2.5 CDS architecture (professional naming)

| Surface | Audience | Route | Job |
|---------|----------|-------|-----|
| Symptom Navigator | Patient / guest | `/ai/concierge`, `/guest` | Context-intent intake, self-care suggestions, specialty routing |
| Structured Triage | Patient | `/ai/symptom-checker` | Urgency banding + matched clinicians |
| Between-Visit Guidance | Patient | `/ai/wellness-coach` | Non-diagnostic continuity plans |
| Encounter CDS | Clinician | `/doctor/copilot`, encounter pages | Differentials, red flags, SOAP documentation support |

**Rule:** CDS prepares the visit; clinicians decide. Never market as diagnosis.

### 2.6 Patient → doctor handoff (core product story)

```
Guest/Patient describes symptoms (Symptom Navigator / AI)
        ↓
Context-intent match + specialty pathway + first-aid (CDS)
        ↓
Book consult → status PENDING_REVIEW (not auto-confirmed)
        ↓
AI attaches priority band + clinician brief (intent engine / optional Groq)
        ↓
Doctor Inbox → Accept or Decline (human ownership)
        ↓
If Accepted → CONFIRMED → Open encounter + Encounter CDS / SOAP
```

---

## 3. RBAC — technical implementation

### 3.1 Roles

| Role | Home | Clinician tier | Purpose |
|------|------|----------------|---------|
| `PATIENT` | `/dashboard` | NONE | Book, Rx, Navigator |
| `DOCTOR` | `/doctor` | **JUNIOR** (fresh doctor) | Clinic schedule, panel, Encounter CDS |
| `CLINICAL_LEAD` | `/doctor` | LEAD | Same clinic + oversight/escalation-oriented perms |
| `ADMIN` | `/admin` | NONE | IAM, RBAC matrix, ops |

### 3.2 Permission style (`resource:action`)

Examples:

- `portal:patient` / `portal:clinician` / `portal:admin`
- `patients:read_panel` / `patients:read_chart`
- `cds:patient_navigator` / `cds:encounter` / `cds:escalation`
- `users:read` / `users:write` / `users:suspend`
- `rbac:read` / `rbac:write`
- `audit:read` / `analytics:ops`

### 3.3 Role → default permission presets

Defined in `web/lib/rbac.ts` as `ROLE_POLICY`.

- **PATIENT:** portal + own appointments/Rx + Symptom Navigator  
- **DOCTOR:** clinician portal + panel/chart + encounter CDS + Rx issue + escalation  
- **CLINICAL_LEAD:** doctor set + manage encounters + users:read + analytics + audit  
- **ADMIN:** IAM + RBAC + ops + manage encounters (+ navigator for testing)

### 3.4 Enforcement points

| Layer | File | Behavior |
|-------|------|----------|
| Edge middleware | `middleware.ts` | Path requires permission → 403 / redirect |
| Auth JWT | `auth.config.ts` | Embeds granted permissions |
| API guards | `denyUnlessPermission` | JSON 401/403 |
| UI | `hooks/use-rbac.ts` + `RoleShell` | Nav/CTAs filtered by `can(perm)` |
| Admin console | `/admin/rbac` | Live matrix + audit seed |

### 3.5 User provisioning model (important)

**New accounts are NOT active by default.**

| Status | `isActive` | Sign-in | Permissions |
|--------|------------|---------|-------------|
| `pending` | false | Blocked | none |
| `active` | true | Allowed | `grantedPermissions[]` from admin |
| `suspended` | false | Blocked | cleared |

**Activation workflow (admin):**

1. Create user (or self-register) → **Pending**  
2. Admin opens **Review & activate**  
3. Assign role  
4. Check/uncheck permissions (least privilege; only role-allowed perms shown)  
5. Activate → JWT will carry those grants  

Files: `web/lib/user-store.ts`, `web/app/api/admin/users/route.ts`, `web/app/(admin)/admin/users/page.tsx`

### 3.6 Seed accounts (always active for demos)

These bypass pending so recruiters can demo instantly.

---

## 4. User manual — credentials & testing RBAC yourself

### 4.1 Live URL

https://maha-ai-wellness.vercel.app

Password for all seed users: **`password123`**

| Email | Role | What to open first |
|-------|------|--------------------|
| `patient@test.com` | PATIENT | `/dashboard` |
| `doctor@test.com` | DOCTOR (fresh / JUNIOR) | `/doctor` |
| `lead@test.com` | CLINICAL_LEAD | `/doctor` |
| `admin@test.com` | ADMIN | `/admin/rbac` then `/admin/users` |

### 4.2 Test script A — Patient portal

1. Login `patient@test.com`  
2. See **RBAC session** badge (role + permission count + Active)  
3. Open **Symptom Navigator** → type `headache first aid` → different answer than `eye swelling`  
4. Click **Book with this concern** → finish booking  
5. `/dashboard/appointments` → see **Your concern** + AI pathway  
6. Try opening `/doctor` or `/admin` → should be blocked / redirected (wrong portal)

### 4.3 Test script B — Fresh doctor problem-solver

1. Login `doctor@test.com`  
2. Clinician studio shows **JUNIOR** tier + playbooks  
3. **Schedule** → cards show **Why patient contacted**  
4. Open encounter → clinician brief + SOAP CDS (not patient Navigator)  
5. **Patient panel** → search `headache` (intent search, not only name)  
6. Open patient chart → analytics + “Ask CDS about this patient”  
7. Confirm header says **Encounter CDS**, not Concierge

### 4.4 Test script C — Clinical lead

1. Login `lead@test.com`  
2. Same clinician workspace; session shows **CLINICAL_LEAD / LEAD**  
3. More permissions than junior (oversight-oriented preset)  
4. Still cannot open full Admin IAM unless granted (lead has `users:read` in policy, not full admin portal)

### 4.5 Test script D — Admin IAM + RBAC (must practice this)

1. Login `admin@test.com`  
2. `/admin/rbac` → study permission matrix (roles × permissions) + audit events  
3. `/admin/users` → filter **Pending**  
4. **Create pending user** (e.g. `intern@test.com`, role DOCTOR)  
5. Confirm status **Pending approval**  
6. Logout → try login as `intern@test.com` → **must fail**  
7. Login admin again → **Review & activate**  
8. Choose role DOCTOR → uncheck 1–2 permissions (least privilege) → Activate  
9. Login as new user → only granted areas work  
10. Admin **Suspend** → login blocked again  

### 4.6 Test script E — Anonymous guest (no login)

1. Open `/guest`  
2. One-step symptom intake → CDS answer  
3. Book / Register  
4. Register creates **Pending** patient → login page explains admin must activate  

### 4.7 What “working RBAC” looks like (checklist)

- [ ] Wrong role cannot open another portal  
- [ ] Pending user cannot sign in  
- [ ] Activate requires explicit permission selection  
- [ ] JWT/session shows permission count on dashboards  
- [ ] Nav links hide when permission missing  
- [ ] API returns 403 with missing permission when forced  

---

## 5. Key modules map (code reading order)

1. `web/lib/rbac.ts` — policy source of truth  
2. `web/middleware.ts` — route enforcement  
3. `web/auth.ts` + `web/auth.config.ts` — login + JWT claims  
4. `web/lib/user-store.ts` — pending/activate/suspend  
5. `web/hooks/use-rbac.ts` — UI permission checks  
6. `web/lib/intent-search.ts` + `web/lib/ai-client.ts` — CDS  
7. `web/lib/demo-store.ts` — live booking handoff  
8. `web/app/(doctor)/doctor/**` — fresh-doctor studio  
9. `web/app/(admin)/admin/rbac/page.tsx` — matrix UI  
10. `web/app/(admin)/admin/users/page.tsx` — IAM workflow  

---

## 6. Demo mode vs production path

### Current (demo / recruiter-ready)

- `DEMO_MODE` mock fabric + cookie/memory stores  
- Works on Vercel without a paid DB  
- Seed logins always Active  

### Production hardening path

1. `DEMO_MODE=false`  
2. Set `DATABASE_URL` (Neon Postgres)  
3. Run Prisma migrate + seed  
4. Move `user-store` / `demo-store` to DB tables (`User`, `RolePermission`, `Encounter`)  
5. Add real audit log table  
6. Optional: `GROQ_API_KEY` for live LLM; keep clinical engine fallback  
7. Rotate `AUTH_SECRET`  

---

## 7. Interview kit (15 LPA full-stack)

### 7.1 Elevator story (30–45 sec)

> “I built Maha Health, a Next.js full-stack telehealth platform. Instead of role-only dashboards, I implemented permission-based RBAC with JWT claims, middleware enforcement, and an admin activation workflow where new users stay pending until an admin grants least-privilege permissions. Clinically, I separated patient AI and doctor AI: patients get Symptom Navigator; doctors get Encounter CDS with chief-complaint handoff—so fresh doctors never open a blank consult. It’s TypeScript end-to-end on Vercel, with Prisma ready for Postgres.”

### 7.2 Questions you should be able to answer

1. **Why not Java backend?**  
   Modern BFF pattern: Next.js route handlers = backend for this product stage; Prisma/Postgres when persistence is required.

2. **How is RBAC more than roles?**  
   Roles are bundles; enforcement uses `resource:action` on middleware, APIs, and UI. Activation stores `grantedPermissions`.

3. **How do you prevent privilege escalation?**  
   Pending default, admin activation, permission allow-list per role, last-admin suspend protection, JWT omits perms when inactive.

4. **How does AI stay compliant-sounding?**  
   Position as CDS; emergency escalation; no diagnosis claims; separate patient vs clinician surfaces.

5. **Hardest bug you fixed?**  
   Example: UI treated `{ patients: [] }` as an array → crash; fixed API contracts + role shells; auth edge/runtime split (`auth.config` edge-safe).

6. **How would you scale?**  
   Move stores to Postgres, Redis for sessions/rate limits, queue for notifications, observability (logs/traces), feature flags for CDS models.

### 7.3 Metrics / demo numbers (from mock fabric)

Use carefully as **demo scale**, not real production traffic: thousands of patients/clinicians/encounters in `demo-data` generators to show enterprise UX density.

### 7.4 ChatGPT practice prompt (copy-paste)

```
I built Maha Health: Next.js 15 + React 19 + Auth.js JWT + permission RBAC
(resource:action), admin pending→activate with grantedPermissions, patient
Symptom Navigator vs doctor Encounter CDS, booking handoff of chief complaint,
deployed on Vercel. Act as a senior interviewer for a 15 LPA full-stack role.
Ask tough questions about RBAC, CDS safety, Next.js architecture, and scaling.
After each answer I give, score me and correct me.
```

---

## 8. Glossary

| Term | Meaning |
|------|---------|
| CDS | Clinical Decision Support (assistive, not diagnosis) |
| RBAC | Role-Based Access Control via permission grants |
| IAM | Identity & Access Management (users, activate, suspend) |
| Chief complaint | Why the patient contacted the clinician |
| JUNIOR tier | Fresh-doctor UX + playbooks on `DOCTOR` role |
| BFF | Backend-for-frontend (API routes next to UI) |

---

## 9. Quick command reference (local)

```bash
cd web
npm install
npm run dev
# production check
npm run build && npm start
# deploy
npx vercel --prod --yes
```

Env essentials: `AUTH_SECRET` / `NEXTAUTH_SECRET`, `AUTH_URL` / `NEXTAUTH_URL`, `DEMO_MODE=true`.

---

## 10. Acceptance checklist (project complete)

- [x] Permission RBAC (not simple role dashboards)  
- [x] Pending → admin activate + grant permissions  
- [x] Patient / Doctor / Lead / Admin portals  
- [x] Guest one-step intake  
- [x] Context-intent CDS (different answers by symptom)  
- [x] Doctor sees why patient contacted + dossier analytics  
- [x] Professional medical naming (no “AI diagnosis” / commerce fluff)  
- [x] Production deploy on Vercel  

**End of guide.** Use Section 4 to learn by clicking; use Section 7 for interviews.
