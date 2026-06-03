# Deployment — GCP Cloud Run (resume-api)

This document describes how the **이력서공방 (Resume Workshop)** backend is built,
deployed, and operated on Google Cloud. It is the source of truth for the API
deployment; the legacy `render.yaml` (Render) and `vercel.json` rewrites are
**superseded by Cloud Run for the API**. (Vercel still hosts the _frontend_.)

> Safety note for operators and agents: the production service runs against a
> **shared Neon Postgres database**. None of the commands here change the DB
> schema or run migrations. Deploys only roll out new application revisions.

---

## 1. Architecture at a glance

```
                         ┌──────────────────────────────┐
   Browser ─── HTTPS ───▶│  Vercel (frontend)           │
                         │  resume-gongbang.vercel.app  │
                         └──────────────┬───────────────┘
                                        │  /api/* (fetch, credentials)
                                        ▼
                         ┌──────────────────────────────┐
                         │  Cloud Run (backend API)      │
                         │  service:  resume-api         │
                         │  region:   asia-northeast3    │
                         │  project:  resume-platform-prod
                         │  URL: https://resume-api-464016453534.asia-northeast3.run.app
                         └───┬───────────┬───────────┬───┘
                             │           │           │
              ┌──────────────┘     ┌─────┘      ┌────┴───────────────┐
              ▼                    ▼            ▼                    ▼
   ┌────────────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
   │ Neon PostgreSQL    │  │ Gemini API   │  │ Google OAuth│  │ Cloudinary       │
   │ (shared, SSL)      │  │ 2.0 Flash    │  │ (sign-in)   │  │ (file storage)   │
   │ via Prisma 7       │  │ (default LLM)│  │             │  │ + DB fallback    │
   └────────────────────┘  └──────────────┘  └─────────────┘  └──────────────────┘
```

### Google Cloud services used

| Service                                          | Used for                                                      | Code entry point                                            |
| ------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- |
| **Cloud Run**                                    | Hosts the NestJS API container                                | `Dockerfile`, `scripts/deploy-gcp.sh`                       |
| **Cloud Build**                                  | Builds the image on `--source` deploy / via `cloudbuild.yaml` | `cloudbuild.yaml`                                           |
| **Cloud Logging**                                | Structured JSON logs (severity/trace) in prod                 | `src/gcp/gcp-logger.service.ts`, `src/gcp/cloud-logging.ts` |
| **Secret Manager**                               | Stores secrets surfaced as env vars                           | see §5                                                      |
| **Gemini API** (Google AI / Generative Language) | Default free LLM provider (`gemini-2.0-flash`) + Vision OCR   | `src/llm/providers/gemini.provider.ts`                      |
| **Google OAuth**                                 | "Sign in with Google"                                         | `src/auth/auth.service.ts`                                  |

> **Storage is Cloudinary, not Google Cloud Storage / Firebase.** The app uses
> Cloudinary for file attachments and avatars, with a graceful **database
> fallback** when Cloudinary env vars are absent. There is currently no GCS or
> Firebase Storage usage. (`/api/health/detailed` reports `storage: cloudinary`
> or `storage: database` accordingly.)

> **Database is Neon, not Cloud SQL.** Postgres is hosted on Neon and reached
> over SSL via the `DATABASE_URL`. It is **shared** across environments — do not
> run migrations as part of a deploy.

---

## 2. Build & runtime model

- **Container**: multi-stage `Dockerfile` (node 22-slim). The build stage runs
  `pnpm install`, `pnpm prisma:generate`, `pnpm build:server`. The runtime stage
  keeps only `node_modules`, the compiled `packages/server/dist`, the Prisma
  schema, and `packages/shared` (a workspace dep that resolves to raw TS —
  loaded at runtime via Node 22's native type-stripping).
- **Non-root**: the runtime stage runs as the image's unprivileged `node` user.
- **Port**: the server reads `process.env.PORT` (`src/main.ts`). Cloud Run
  injects `PORT`; the Dockerfile defaults it to `8080` for local `docker run`.
- **When a Dockerfile is present, `gcloud run deploy --source .` builds it via
  Cloud Build (not buildpacks).** Therefore `.dockerignore` must **not** exclude
  `src/` or `prisma/` (it previously did, which silently broke the Dockerfile
  build path — now fixed).

Local image sanity check:

```bash
docker build -t resume-api:local .
docker run --rm -e PORT=8080 -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://...:require" -e JWT_SECRET="<32+ chars>" \
  -e GEMINI_API_KEY="..." -p 8080:8080 resume-api:local
curl -s localhost:8080/api/health
```

---

## 3. Deploy commands

### Primary — `pnpm deploy:gcp`

`pnpm deploy:gcp` runs `scripts/deploy-gcp.sh`, which wraps:

```bash
gcloud run deploy resume-api \
  --source . \
  --project resume-platform-prod \
  --region  asia-northeast3 \
  --allow-unauthenticated \
  --update-env-vars NODE_ENV=production \
  --clear-base-image
```

Helpful variants:

```bash
pnpm deploy:gcp:dry                       # print the gcloud command, don't run
SERVICE=resume-api-staging pnpm deploy:gcp # deploy a different service
ENV_VARS_FILE=env.prod.yaml pnpm deploy:gcp # apply non-secret env vars from a file
```

> **Env-var convention (project rule):** always use `--update-env-vars` or
> `--env-vars-file`. **Never use `--set-env-vars`** — it _replaces_ the entire
> env-var set on the new revision and would drop existing vars/secrets.

### Alternative — Cloud Build trigger (`cloudbuild.yaml`)

For CI/CD (e.g. build on push to `main`), wire a Cloud Build trigger to
`cloudbuild.yaml`. It builds the Dockerfile, pushes to Artifact Registry
(`<region>-docker.pkg.dev/<project>/containers/resume-api`), and deploys a new
revision. Submit manually with:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --project resume-platform-prod \
  --substitutions=_REGION=asia-northeast3
```

Neither path runs database migrations.

---

## 4. Health-check endpoints

All under the global `/api` prefix and marked `@Public()`.

| Endpoint                   | Purpose                                                  | Touches DB? | Status codes            |
| -------------------------- | -------------------------------------------------------- | ----------- | ----------------------- |
| `GET /api/health`          | **Liveness** (canonical). Process up, version, uptime.   | No          | 200                     |
| `GET /api/health/live`     | Liveness alias (identical cheap response).               | No          | 200                     |
| `GET /api/health/ready`    | **Readiness**: cheap `SELECT 1` + LLM-provider presence. | Yes (light) | 200 ready / 503 DB down |
| `GET /api/health/detailed` | Full diagnostics (DB, memory, providers, storage).       | Yes         | 200                     |

Readiness semantics (`src/gcp/readiness.ts`):

- **DB down** → `status: "error"`, **HTTP 503** (Cloud Run holds traffic).
- **DB up, no LLM provider** → `status: "degraded"`, **HTTP 200** (core app
  works; AI features degrade gracefully).
- **All good** → `status: "ok"`, **HTTP 200**.

Recommended Cloud Run probe configuration:

- **Startup / liveness probe** → `GET /api/health` (or `/api/health/live`).
- **Readiness** (for traffic gating / external uptime monitors) →
  `GET /api/health/ready`.

---

## 5. Environment variables & secrets

On Cloud Run, **secrets come from Secret Manager** (wired with
`--update-secrets` / the console), never hardcoded in the image or `--source`.
Boot-time validation (`src/gcp/env-validation.ts`, called from `main.ts`)
enforces this: in production, **missing required vars abort startup** with a
clear message; optional providers only **warn** and degrade gracefully.

### Required in production (boot fails if missing)

| Var                      | Source         | Notes                                                                                                                                      |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`           | Secret Manager | Neon Postgres, `sslmode=require`. **Shared DB.**                                                                                           |
| `JWT_SECRET`             | Secret Manager | 32+ chars.                                                                                                                                 |
| At least **one** LLM key | Secret Manager | One of `GEMINI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_COMPATIBLE_URL`, `N8N_WEBHOOK_URL`. The app prefers free **Gemini**. |

### Optional — graceful degradation (warn only)

| Var(s)                                                                        | Capability                             | If absent                                          |
| ----------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `GEMINI_API_KEY`                                                              | Default free LLM + Vision OCR          | Falls back to other LLM providers.                 |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL`                                      | Model selection / model-level fallback | Defaults to `gemini-2.0-flash`, no fallback model. |
| `GEMINI_TIMEOUT_MS` / `GEMINI_MAX_OUTPUT_TOKENS`                              | Gemini request tuning                  | Defaults `60000` / `4096`.                         |
| `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_COMPATIBLE_*`, `N8N_WEBHOOK_URL` | Additional LLM fallbacks               | Provider simply not registered.                    |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                    | Google OAuth sign-in                   | "Sign in with Google" hidden.                      |
| `GITHUB_CLIENT_ID/SECRET`, `KAKAO_CLIENT_ID`                                  | Other OAuth providers                  | Provider hidden.                                   |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`        | Cloudinary file storage                | Attachments fall back to the database.             |
| `ALLOWED_ORIGINS`, `FRONTEND_URL`, `API_URL`                                  | CORS / absolute URLs                   | Sensible localhost defaults in dev.                |

Wiring secrets (example):

```bash
# Create/version secrets once.
printf '%s' "$DB_URL" | gcloud secrets create DATABASE_URL --data-file=- \
  --project resume-platform-prod
# Bind them to the service as env vars.
gcloud run services update resume-api \
  --project resume-platform-prod --region asia-northeast3 \
  --update-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest
```

> Cloud Run's runtime service account needs the
> `roles/secretmanager.secretAccessor` role on those secrets.

---

## 6. Gemini utilization (hardening)

The default LLM provider is Google **Gemini 2.0 Flash** (free tier). Hardening
in `src/llm/providers/gemini.provider.ts`:

- **Timeouts** — per request, configurable via `GEMINI_TIMEOUT_MS` (default 60s).
- **Retries/backoff** — up to 3 attempts with exponential backoff on `429`/`5xx`
  and transient network errors.
- **Safety settings** — harm categories set to `BLOCK_NONE` so legitimate
  résumé/cover-letter content (career stories, medical/defense roles, etc.) is
  not silently dropped as an empty candidate.
- **Empty-candidate guard** — a blocked/empty response is surfaced as a
  retryable error (with the `finishReason`) instead of returning empty text.
- **Model-level fallback** — set `GEMINI_FALLBACK_MODEL` (e.g. `gemini-1.5-flash`)
  to retry once on a different model during a model-specific outage.
- **Provider-level fallback** — `LlmService.generateWithFallback` already rotates
  Gemini → Groq → OpenAI-compatible → n8n. Public API shape is unchanged.

---

## 7. Logging & observability

- In **production** (`NODE_ENV=production`), the app installs
  `GcpLoggerService`, which writes **one JSON line per log** to stdout/stderr.
  Cloud Logging parses these as structured entries with `severity`, `message`,
  `context`, and (when present) a stack. `error`/`fatal` go to stderr.
- In **dev**, Nest's pretty console logger is used — local DX is unchanged.
- Trace correlation helpers (`buildTraceField`) map Cloud Run's
  `X-Cloud-Trace-Context` header to `logging.googleapis.com/trace` for
  request-grouped logs.

View logs:

```bash
gcloud run services logs read resume-api \
  --project resume-platform-prod --region asia-northeast3 --limit 100
```

---

## 8. Dev vs prod server info

|            | Local dev                                      | Production                                                    |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------- |
| API base   | `http://localhost:3001/api`                    | `https://resume-api-464016453534.asia-northeast3.run.app/api` |
| Frontend   | `http://localhost:5173` (Vite)                 | `https://resume-gongbang.vercel.app`                          |
| Start      | `pnpm dev` (client+server) / `pnpm dev:server` | container `node packages/server/dist/main.js`                 |
| Port       | `PORT=3001` (default)                          | `PORT` injected by Cloud Run (8080)                           |
| Logger     | Nest pretty console                            | structured JSON (Cloud Logging)                               |
| Swagger    | `http://localhost:3001/api/docs`               | disabled in prod                                              |
| Env source | root `.env`                                    | Secret Manager + `--update-env-vars`                          |

---

## 9. Legacy / superseded

- `render.yaml` — **deprecated** Render blueprint, kept only as a fallback
  reference. The API runs on Cloud Run.
- `vercel.json` — Vercel config for the **frontend**; its API rewrites point at
  the Cloud Run URL. Not used to host the API.

---

## 10. Operational guardrails

- Deploys roll out new **application** revisions only — they do not alter the
  **shared Neon DB** schema and run **no migrations**.
- Prefer `--update-env-vars` / `--env-vars-file`; never `--set-env-vars`.
- Roll back instantly via Cloud Run revisions:

  ```bash
  gcloud run services update-traffic resume-api \
    --project resume-platform-prod --region asia-northeast3 \
    --to-revisions <PREVIOUS_REVISION>=100
  ```
