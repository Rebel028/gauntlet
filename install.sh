#!/usr/bin/env bash
# gauntlet installer bootstrap. Runs the local installer if you're in a clone,
# otherwise fetches and runs it via npx. All args are forwarded, e.g.:
#   ./install.sh --all --user
#   curl -fsSL https://raw.githubusercontent.com/Rebel028/gauntlet/master/install.sh | bash -s -- --all
set -euo pipefail

REPO="Rebel028/gauntlet"

if ! command -v node >/dev/null 2>&1; then
  echo "error: Node.js (>=18) is required. Install it, then re-run." >&2
  exit 1
fi

here="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" 2>/dev/null && pwd)" || here=""
if [ -n "$here" ] && [ -f "$here/bin/install.js" ]; then
  exec node "$here/bin/install.js" "$@"
fi

exec npx -y "github:$REPO" "$@"
