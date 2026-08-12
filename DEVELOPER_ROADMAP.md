# Developer Roadmap — AI Wellness (in-repo copy)

See also: `C:\Users\Admin\Projects\DEVELOPER_ROADMAP.md` (master for all 3 projects)

## Live

- **Site:** https://maha-ai-wellness.vercel.app
- **Repo:** https://github.com/Ganesh707-dot/ai-wellness-platform
- **Deploy folder:** `web/`
- **Vercel project:** `ganesh-v/maha-ai-wellness`

## Bioprint APIs (free, no key)

| Route | Source |
|-------|--------|
| `GET /api/innovation/live-data` | ClinicalTrials.gov + PubMed |
| `POST /api/innovation/lab-jobs` | Server print orchestration |

## Key files

- `web/lib/bioprint-external-api.ts` — external API fetch
- `web/components/innovation/bioprint-lab-studio.tsx` — UI
- `web/docs/HANDS_ON_GUIDE.md` — interview scenarios

## VS Code

```bash
cd web && npm install && npm run dev
```

## Deploy

```bash
git push origin main
cd web && npx vercel --prod --yes
```
