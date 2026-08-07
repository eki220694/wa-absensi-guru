#!/usr/bin/env bash
# Count files recursively, symlinks handled:
#   - symlinks pointing to files counted as files
#   - broken symlinks counted separately, not as files
set -euo pipefail

dir="${1:-.}"
[ -e "$dir" ] || { echo "error: no such path: $dir" >&2; exit 1; }

# -P (default): regular files only; symlinks via -xtype f = points to a regular file
files=$(find "$dir" -type f 2>/dev/null | wc -l)
symlink_files=$(find "$dir" -type l -xtype f 2>/dev/null | wc -l)
# under -L a dereferenceable symlink resolves away; only broken ones stay type l
broken=$(find -L "$dir" -type l 2>/dev/null | wc -l)

echo "regular files:     $files"
echo "symlinks to files: $symlink_files"
echo "TOTAL files:       $((files + symlink_files))"
echo "broken symlinks:   $broken"
