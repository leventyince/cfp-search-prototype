#!/usr/bin/env bash

set -euo pipefail

printf '%s\n' \
  'ERROR: This is legacy Quick Tunnel automation.' \
  'The current persistent school backend must not be stopped with this script.' \
  'See docs/legacy-quick-tunnel-runbook.md.' \
  >&2

exit 1

VM_HOST="${CFP_VM_HOST:-levent@192.168.0.33}"
VM_APP_DIR="${CFP_VM_APP_DIR:-/home/levent/searxng}"

printf 'Stopping Quick Tunnel and SearXNG services on %s...\n' \
  "$VM_HOST"

ssh "$VM_HOST" \
  "CFP_VM_APP_DIR='$VM_APP_DIR' bash -s" <<'REMOTE'
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

pkill -x cloudflared >/dev/null 2>&1 || true

cd "$CFP_VM_APP_DIR"
docker compose stop
REMOTE

printf '\nTemporary backend stopped.\n'
printf 'The deployed frontend remains online, but live searches will fail\n'
printf 'until the temporary backend is started again.\n'