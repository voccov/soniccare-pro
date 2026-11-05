#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

version="$(tr -d '[:space:]' < VERSION)"
phase="$(grep -m1 '^\*\*Phase:\*\*' docs/STATUS.md | sed 's/^\*\*Phase:\*\* *//; s/[[:space:]]*$//')"

printf 'SonicCare Pro\n'
printf 'Version: %s\n' "$version"
printf 'Phase:   %s\n' "${phase:-unknown}"
printf 'Branch:  %s\n' "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no git')"
printf 'Commit:  %s\n' "$(git log -1 --oneline 2>/dev/null || echo 'none')"
printf 'Tag:     %s\n' "$(git describe --tags --always 2>/dev/null || echo 'none')"
printf 'Changed: %s file(s)\n' "$(git status --short 2>/dev/null | wc -l | tr -d ' ')"

printf '\nNext actions:\n'
sed -n '/^## Next actions$/,/^## /p' docs/STATUS.md | sed '1d;$d' | sed '/^[[:space:]]*$/d'
