#!/usr/bin/env bash
set -Eeuo pipefail

new_tag="${1:?Usage: deploy-release.sh <image-sha>}"
[[ "$new_tag" =~ ^[a-f0-9]{40}$ ]] || { echo "Invalid image tag" >&2; exit 2; }
[[ -f .env ]] || { echo "Create the production .env before deployment" >&2; exit 2; }
[[ -f release.env ]] || printf 'IMAGE_TAG=bootstrap\n' > release.env
WEB_DOMAIN="$(awk -F= '$1 == "WEB_DOMAIN" {print substr($0, index($0, "=") + 1); exit}' .env)"
API_DOMAIN="$(awk -F= '$1 == "API_DOMAIN" {print substr($0, index($0, "=") + 1); exit}' .env)"
[[ "$WEB_DOMAIN" =~ ^[A-Za-z0-9.-]+$ && "$API_DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Set valid WEB_DOMAIN and API_DOMAIN values" >&2; exit 2; }

compose=(docker compose --env-file .env --env-file release.env -f docker-compose.yml)
previous_image="$("${compose[@]}" ps -q api | xargs -r docker inspect --format '{{.Config.Image}}' 2>/dev/null || true)"
previous_tag="${previous_image##*:}"
printf 'IMAGE_TAG=%s\n' "$new_tag" > release.env

if ! "${compose[@]}" pull || ! "${compose[@]}" up -d --remove-orphans; then
  echo "New image rollout failed" >&2
  if [[ "$previous_tag" =~ ^[a-f0-9]{40}$ ]]; then
    printf 'IMAGE_TAG=%s\n' "$previous_tag" > release.env
    "${compose[@]}" pull && "${compose[@]}" up -d --remove-orphans || true
  fi
  exit 1
fi

ok=0
for attempt in $(seq 1 24); do
  if curl --silent --show-error --fail --resolve "${API_DOMAIN}:443:127.0.0.1" "https://${API_DOMAIN}/health" >/dev/null \
    && curl --silent --show-error --fail --resolve "${WEB_DOMAIN}:443:127.0.0.1" "https://${WEB_DOMAIN}/" >/dev/null; then
    ok=1
    break
  fi
  sleep 5
done

if [[ "$ok" -ne 1 ]]; then
  echo "Production smoke test failed; rolling back" >&2
  if [[ "$previous_tag" =~ ^[a-f0-9]{40}$ ]]; then
    printf 'IMAGE_TAG=%s\n' "$previous_tag" > release.env
    "${compose[@]}" pull && "${compose[@]}" up -d --remove-orphans || true
  fi
  exit 1
fi
echo "Deployment ${new_tag} passed health checks"
