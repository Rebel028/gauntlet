#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
installer="$repo_root/bin/install.js"
test_root=$(mktemp -d /tmp/gauntlet-install-test.XXXXXX)
trap 'rm -rf "$test_root"' EXIT

project="$test_root/project"
mkdir -p "$project"
(
  cd "$project"
  node "$installer" --codex --project >/dev/null
  node "$installer" --codex --project --verify | grep -q "verification passed"

  echo changed >> .codex/agents/gauntlet-formalist.toml
  if node "$installer" --codex --project --verify > "$test_root/modified.out"; then
    echo "expected modified installation to fail verification" >&2
    exit 1
  fi
  grep -q "modified .*gauntlet-formalist.toml" "$test_root/modified.out"

  touch .agents/skills/gauntlet/unexpected.md
  if node "$installer" --codex --project --verify > "$test_root/unexpected.out"; then
    echo "expected unexpected file to fail verification" >&2
    exit 1
  fi
  grep -q "unexpected file" "$test_root/unexpected.out"
)

missing="$test_root/missing"
mkdir -p "$missing"
if (cd "$missing" && node "$installer" --codex --project --verify > "$test_root/missing.out"); then
  echo "expected missing installation to fail verification" >&2
  exit 1
fi
grep -q "missing" "$test_root/missing.out"

if node "$installer" --codex --user --project >/dev/null 2>&1; then exit 1; fi
if node "$installer" --codex --wat >/dev/null 2>&1; then exit 1; fi
if node "$installer" --verify >/dev/null 2>&1; then exit 1; fi
if node "$installer" --all --codex --verify >/dev/null 2>&1; then exit 1; fi

echo "installer integration tests passed"
