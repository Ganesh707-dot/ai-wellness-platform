# Private repos + open live sites

**Product:** Veridian Clinical

## What is protected vs public

| Layer | Protected? | How |
|-------|------------|-----|
| **GitHub code** | Yes | Private repo + invite collaborators only |
| **Groq / auth secrets** | Yes | Vercel env vars only — never in git |
| **Live site (mobile, recruiters)** | **Open** | No site password gate |
| **App login (demo RBAC)** | Yes | `doctor@test.com` / `password123` for portals |

## GitHub — invite code access only

https://github.com/Ganesh707-dot/ai-wellness-platform/settings/access

## Live URL (share freely)

https://veridian-clinical.vercel.app

## Vercel env (secrets only — not site lock)

https://vercel.com/ganesh-v/veridian-clinical/settings/environment-variables

- `GROQ_API_KEY`, `AUTH_SECRET`, `NEXTAUTH_URL` = `https://veridian-clinical.vercel.app`
- **Do not set** `SITE_ACCESS_PASSWORD` (disables public access)

## If mobile still blocked

Turn off **Vercel Deployment Protection** (SSO):

https://vercel.com/ganesh-v/veridian-clinical/settings/deployment-protection

Set to **None** or disable **Vercel Authentication**.

CLI:
```bash
npx vercel project protection disable veridian-clinical --sso
```
