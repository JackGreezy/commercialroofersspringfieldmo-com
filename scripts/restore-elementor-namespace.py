#!/usr/bin/env python3
"""Keep Springfield's rendered HTML and captured Elementor assets in one namespace."""
import sys
from pathlib import Path

root = Path(sys.argv[1]) / "public"
extensions = {".html", ".css", ".js", ".mjs", ".json", ".svg"}
changed = replacements = 0

for path in root.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in extensions:
        continue
    original = path.read_text(errors="ignore")
    updated = original.replace("jklrhel", "elementor")
    updated = updated.replace("data-e-type", "data-elementor-type")
    if updated != original:
        path.write_text(updated)
        changed += 1
        replacements += original.count("jklrhel") + original.count("data-e-type")

print(f"Springfield namespace restored: files={changed} replacements={replacements}")
