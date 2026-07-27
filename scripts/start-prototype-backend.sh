#!/usr/bin/env bash

set -euo pipefail

VM_HOST="${CFP_VM_HOST:-levent@192.168.0.33}"
VM_APP_DIR="${CFP_VM_APP_DIR:-/home/levent/searxng}"

WORKER_BASE_URL="${CFP_WORKER_BASE_URL:-https://cfp-search-proxy.leventyince.workers.dev}"
ALLOWED_ORIGIN="${CFP_ALLOWED_ORIGIN:-https://leventyince.github.io}"
SMOKE_QUERY="${CFP_SMOKE_QUERY:-call for papers digital games}"

REPO_ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

WORKER_DIR="$REPO_ROOT/worker"
DEV_VARS_FILE="$WORKER_DIR/.dev.vars"

TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    fail "Required command not found: $1"
}

read_results_count() {
  python3 - "$1" <<'PY'
import json
import sys

path = sys.argv[1]

with open(path, encoding="utf-8") as file:
    payload = json.load(file)

results = payload.get("results")

if not isinstance(results, list):
    raise SystemExit("Response does not contain a results array.")

print(len(results))
PY
}

read_worker_results_count() {
  python3 - "$1" <<'PY'
import json
import sys

path = sys.argv[1]

with open(path, encoding="utf-8") as file:
    payload = json.load(file)

if payload.get("provider") != "searxng":
    raise SystemExit("Worker provider is not searxng.")

results = payload.get("results")

if not isinstance(results, list):
    raise SystemExit("Worker response does not contain a results array.")

print(len(results))
PY
}

for command_name in \
  ssh \
  curl \
  git \
  npm \
  python3
do
  require_command "$command_name"
done

if [ ! -f "$WORKER_DIR/wrangler.jsonc" ]; then
  fail "worker/wrangler.jsonc was not found."
fi

if ! git -C "$REPO_ROOT" check-ignore -q worker/.dev.vars; then
  fail "worker/.dev.vars is not ignored by Git."
fi

printf '\n[1/6] Starting SearXNG and creating a Quick Tunnel on %s...\n' \
  "$VM_HOST"

REMOTE_OUTPUT="$(
  ssh "$VM_HOST" \
    "CFP_VM_APP_DIR='$VM_APP_DIR' bash -s" <<'REMOTE'
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$CFP_VM_APP_DIR"

command -v docker >/dev/null 2>&1 ||
  {
    echo "Docker is unavailable." >&2
    exit 1
  }

command -v cloudflared >/dev/null 2>&1 ||
  {
    echo "cloudflared is unavailable." >&2
    exit 1
  }

docker compose up -d >/dev/null

attempt=1
local_ready=0

while [ "$attempt" -le 30 ]; do
  if curl -fsS --max-time 10 \
    'http://127.0.0.1:8080/search?q=test&format=json' |
    python3 -c '
import json
import sys

payload = json.load(sys.stdin)

if not isinstance(payload.get("results"), list):
    raise SystemExit(1)
' >/dev/null 2>&1
  then
    local_ready=1
    break
  fi

  sleep 1
  attempt=$((attempt + 1))
done

if [ "$local_ready" -ne 1 ]; then
  echo "SearXNG did not become ready." >&2
  docker compose ps >&2
  exit 1
fi

# This VM is dedicated to the prototype, so any existing
# cloudflared process is replaced.
pkill -x cloudflared >/dev/null 2>&1 || true

TUNNEL_LOG="/tmp/cfp-quick-tunnel.log"
TUNNEL_PID="/tmp/cfp-quick-tunnel.pid"

rm -f "$TUNNEL_LOG" "$TUNNEL_PID"

nohup cloudflared tunnel \
  --url http://127.0.0.1:8080 \
  --no-autoupdate \
  >"$TUNNEL_LOG" 2>&1 </dev/null &

echo "$!" > "$TUNNEL_PID"

attempt=1

while [ "$attempt" -le 40 ]; do
  tunnel_url="$(
    grep -Eo \
      'https://[a-z0-9-]+\.trycloudflare\.com' \
      "$TUNNEL_LOG" |
      head -n 1 ||
      true
  )"

  if [ -n "$tunnel_url" ]; then
    printf 'TUNNEL_URL=%s\n' "$tunnel_url"
    exit 0
  fi

  sleep 1
  attempt=$((attempt + 1))
done

echo "Quick Tunnel hostname was not produced." >&2
tail -n 50 "$TUNNEL_LOG" >&2
exit 1
REMOTE
)"

TUNNEL_URL="$(
  printf '%s\n' "$REMOTE_OUTPUT" |
    sed -n 's/^TUNNEL_URL=//p' |
    tail -n 1
)"

case "$TUNNEL_URL" in
  https://*.trycloudflare.com)
    ;;
  *)
    printf '%s\n' "$REMOTE_OUTPUT" >&2
    fail "The VM did not return a valid Quick Tunnel hostname."
    ;;
esac

printf 'Quick Tunnel: %s\n' "$TUNNEL_URL"

printf '\n[2/6] Waiting for Quick Tunnel DNS and JSON readiness...\n'

TUNNEL_HOST="${TUNNEL_URL#https://}"

printf 'Waiting for DNS: %s\n' "$TUNNEL_HOST"

attempt=1
DNS_READY=0

while [ "$attempt" -le 90 ]; do
  if python3 - "$TUNNEL_HOST" <<'PY' >/dev/null 2>&1
import socket
import sys

hostname = sys.argv[1]

socket.getaddrinfo(
    hostname,
    443,
    type=socket.SOCK_STREAM,
)
PY
  then
    DNS_READY=1
    break
  fi

  if [ "$attempt" -eq 1 ] ||
    [ $((attempt % 10)) -eq 0 ]
  then
    printf 'DNS not ready; waiting (%s/90)...\n' \
      "$attempt"
  fi

  sleep 2
  attempt=$((attempt + 1))
done

if [ "$DNS_READY" -ne 1 ]; then
  printf '\nRecent cloudflared log output:\n' >&2

  ssh "$VM_HOST" \
    "tail -n 50 /tmp/cfp-quick-tunnel.log" \
    >&2 || true

  fail "The Quick Tunnel hostname did not become resolvable."
fi

printf 'Quick Tunnel DNS is ready.\n'
printf 'Testing the SearXNG JSON endpoint...\n'

attempt=1
TUNNEL_RESULT_COUNT=""

while [ "$attempt" -le 20 ]; do
  if curl -fsS --max-time 30 --get \
    --data-urlencode "q=$SMOKE_QUERY" \
    --data-urlencode "format=json" \
    --data-urlencode "pageno=1" \
    -o "$TEMP_DIR/tunnel.json" \
    "$TUNNEL_URL/search" \
    2>/dev/null
  then
    if TUNNEL_RESULT_COUNT="$(
      read_results_count \
        "$TEMP_DIR/tunnel.json" \
        2>/dev/null
    )"
    then
      break
    fi
  fi

  printf 'Tunnel HTTP endpoint not ready; retrying (%s/20)...\n' \
    "$attempt"

  sleep 3
  attempt=$((attempt + 1))
done

if [ -z "$TUNNEL_RESULT_COUNT" ]; then
  printf '\nRecent cloudflared log output:\n' >&2

  ssh "$VM_HOST" \
    "tail -n 50 /tmp/cfp-quick-tunnel.log" \
    >&2 || true

  fail "The Quick Tunnel did not return valid SearXNG JSON."
fi

printf 'Tunnel results: %s\n' "$TUNNEL_RESULT_COUNT"

printf '\n[3/6] Updating worker/.dev.vars...\n'

printf 'SEARXNG_BASE_URL="%s"\n' "$TUNNEL_URL" \
  > "$DEV_VARS_FILE"

if git -C "$REPO_ROOT" status --short |
  grep -Fq 'worker/.dev.vars'
then
  fail "worker/.dev.vars unexpectedly appears in Git status."
fi

printf 'Local Worker binding updated.\n'

printf '\n[4/6] Updating and deploying the Cloudflare Worker...\n'

(
  cd "$WORKER_DIR"
  npm run deploy -- --secrets-file .dev.vars
)

printf '\n[5/6] Waiting for the deployed Worker search endpoint...\n'

attempt=1
WORKER_RESULT_COUNT=""
WORKER_STATUS=""

while [ "$attempt" -le 12 ]; do
  WORKER_STATUS="$(
    curl -sS --max-time 35 --get \
      --data-urlencode "q=$SMOKE_QUERY" \
      --data-urlencode "page=1" \
      -H "Origin: $ALLOWED_ORIGIN" \
      -D "$TEMP_DIR/worker-headers.txt" \
      -o "$TEMP_DIR/worker.json" \
      -w '%{http_code}' \
      "$WORKER_BASE_URL/search" ||
      true
  )"

  if [ "$WORKER_STATUS" = "200" ]; then
    if WORKER_RESULT_COUNT="$(
      read_worker_results_count \
        "$TEMP_DIR/worker.json" \
        2>/dev/null
    )"
    then
      if tr -d '\r' \
        < "$TEMP_DIR/worker-headers.txt" |
        grep -Fqi \
          "access-control-allow-origin: $ALLOWED_ORIGIN"
      then
        break
      fi
    fi
  fi

  printf 'Worker not ready; retrying (%s/12, status %s)...\n' \
    "$attempt" \
    "${WORKER_STATUS:-unavailable}"

  WORKER_RESULT_COUNT=""
  sleep 3
  attempt=$((attempt + 1))
done

if [ -z "$WORKER_RESULT_COUNT" ]; then
  printf '\nLast Worker response:\n' >&2

  if [ -f "$TEMP_DIR/worker.json" ]; then
    head -c 1000 "$TEMP_DIR/worker.json" >&2
    printf '\n' >&2
  fi

  fail "The deployed Worker did not pass its smoke test."
fi

printf 'Worker status: %s\n' "$WORKER_STATUS"
printf 'Worker results: %s\n' "$WORKER_RESULT_COUNT"
printf 'CORS origin: %s\n' "$ALLOWED_ORIGIN"

printf '\n[6/6] Temporary backend is ready.\n\n'
printf 'Tunnel: %s\n' "$TUNNEL_URL"
printf 'Tunnel results: %s\n' "$TUNNEL_RESULT_COUNT"
printf 'Worker results: %s\n' "$WORKER_RESULT_COUNT"
printf '\nNext command:\n'
printf '  npm run dev\n\n'