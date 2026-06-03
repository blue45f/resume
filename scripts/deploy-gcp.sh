#!/usr/bin/env bash
#
# Deploy the NestJS API to Cloud Run (service: resume-api).
#
# This is the real implementation behind `pnpm deploy:gcp`. It wraps
# `gcloud run deploy --source .`, which builds the repo's Dockerfile via Cloud
# Build and rolls out a new revision.
#
# Usage:
#   ./scripts/deploy-gcp.sh                 # deploy with defaults
#   DRY_RUN=1 ./scripts/deploy-gcp.sh       # print the command, don't run it
#   ENV_VARS_FILE=env.prod.yaml ./scripts/deploy-gcp.sh
#
# Env overrides (all optional):
#   SERVICE      (default: resume-api)
#   PROJECT      (default: resume-platform-prod)
#   REGION       (default: asia-northeast3)
#   ENV_VARS_FILE  path to a YAML file of non-secret env vars (recommended over
#                  repeating --update-env-vars; see docs/DEPLOYMENT.md)
#
# Secrets (DATABASE_URL, JWT_SECRET, *_API_KEY, OAuth, Cloudinary) should live in
# Secret Manager and be wired with --update-secrets, NOT passed on the CLI.
# This script does NOT touch the shared Neon database or run any migrations.
#
# Project convention (memory feedback_gcp_deploy_envvars):
#   use --update-env-vars / --env-vars-file, never --set-env-vars (which would
#   wipe existing vars on the revision).

set -euo pipefail

SERVICE="${SERVICE:-resume-api}"
PROJECT="${PROJECT:-resume-platform-prod}"
REGION="${REGION:-asia-northeast3}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud CLI not found. Install the Google Cloud SDK first." >&2
  exit 1
fi

ARGS=(
  run deploy "$SERVICE"
  --source .
  --project "$PROJECT"
  --region "$REGION"
  --allow-unauthenticated
  # Cloud Run injects PORT; NODE_ENV must be production for structured logging
  # and the Cloud Logging logger to activate.
  --update-env-vars NODE_ENV=production
  # Disable automatic base-image updates so deploys are reproducible.
  --clear-base-image
)

if [[ -n "${ENV_VARS_FILE:-}" ]]; then
  if [[ ! -f "$ENV_VARS_FILE" ]]; then
    echo "error: ENV_VARS_FILE '$ENV_VARS_FILE' not found." >&2
    exit 1
  fi
  ARGS+=(--env-vars-file "$ENV_VARS_FILE")
fi

echo "Deploying $SERVICE to $PROJECT/$REGION ..."
echo "  gcloud ${ARGS[*]}"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "(DRY_RUN=1 — not executing)"
  exit 0
fi

gcloud "${ARGS[@]}"

echo "Deployed. Fetching service URL ..."
gcloud run services describe "$SERVICE" \
  --project "$PROJECT" --region "$REGION" \
  --format='value(status.url)'
