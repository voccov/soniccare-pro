#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

fail=0

version="$(tr -d '[:space:]' < VERSION)"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  printf 'VERSION is not semver: %s\n' "$version" >&2
  fail=1
fi

for file in README.md docs/SETUP.md docs/STATUS.md docs/PLAN.md; do
  if grep -nE 'https?://(127\.0\.0\.1|localhost)' "$file" >/dev/null 2>&1; then
    printf 'Local URL found in %s\n' "$file" >&2
    fail=1
  fi
done

if ! grep -qF "## [$version]" CHANGELOG.md; then
  printf 'CHANGELOG has no entry for %s\n' "$version" >&2
  fail=1
fi

if (( fail )); then
  exit 1
fi

printf 'Docs checks passed for %s\n' "$version"
