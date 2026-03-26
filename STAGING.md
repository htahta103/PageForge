# PageForge — Staging

## URL

- **Frontend (Cloudflare Pages):** https://pageforge-staging.pages.dev
- **Latest deploy (example):** Wrangler prints a per-deploy URL and, for production branch setups, a stable alias. When deploying from a git branch, Cloudflare may also expose **`https://<branch>.pageforge-staging.pages.dev`** (e.g. `temp` while working on branch `temp`).

## What is deployed

- Static SPA built from `frontend/` (Vite production build).
- **API:** Not served from this hostname. Full-stack staging (Go + Postgres behind `/api`) is still local/Docker for now unless a separate API base URL is configured for builds.

## Access

- **Credentials:** None for the public Pages site. Any future auth or admin URLs belong in the team password manager — do not commit them here.

## Smoke checks

```bash
curl -sfI https://pageforge-staging.pages.dev | head -5
```

Expect `HTTP/2 200` (or 304) for the document shell.

## Known limitations vs production

- API calls from the hosted SPA require `VITE_API_URL` (or equivalent) at **build time** pointing at a reachable backend; default local/dev values are not suitable for staging without a hosted API.
- No automated E2E job is wired from this repo to staging yet; QA should drive acceptance from this URL once the backend is reachable from the browser.

## Deploy

From repo root (after `wrangler` auth):

```bash
make deploy-staging
```
