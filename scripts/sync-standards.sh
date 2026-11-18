#!/usr/bin/env bash
# Refresh this app's copies of the LLUH standards.
#
#   scripts/sync-standards.sh [path-to-lluh-design-standards]
#
# Copies rather than symlinks or submodules: coding agents read the working
# tree, and a standard that is not physically present is one that quietly does
# not get followed.
set -euo pipefail

SRC="${1:-../lluh-design-standards}"
DEST="docs/standards"

if [ ! -d "$SRC/standards" ]; then
  echo "Cannot find $SRC/standards" >&2
  echo "Clone it first:  git clone https://github.com/ashline951/lluh-design-standards" >&2
  exit 1
fi

mkdir -p "$DEST"
for f in "$SRC"/standards/*.md; do
  name=$(basename "$f")
  if [ -f "$DEST/$name" ] && ! diff -q "$f" "$DEST/$name" >/dev/null; then
    echo "updated: $name"
    echo "  was: $(grep -m1 '^\*\*Status' "$DEST/$name" || echo 'no version line')"
    echo "  now: $(grep -m1 '^\*\*Status' "$f" || echo 'no version line')"
  elif [ ! -f "$DEST/$name" ]; then
    echo "added:   $name"
  fi
  cp "$f" "$DEST/$name"
done

echo
echo "Done. Review the diff and commit with the code change that needed it."
