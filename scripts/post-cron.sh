#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-/home/ubuntu/istanbul-baraj-bot}"
LOG_DIR="${REPO_DIR}/.data"
LOCK_FILE="${LOG_DIR}/post.lock"

mkdir -p "${LOG_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm bulunamadi. Node.js kurulumu kontrol edilmeli." >> "${LOG_DIR}/cron.log"
  exit 1
fi

cd "${REPO_DIR}"

export POST_ENABLED=true
export TZ=Europe/Istanbul

flock -n "${LOCK_FILE}" npm run post >> "${LOG_DIR}/cron.log" 2>&1
