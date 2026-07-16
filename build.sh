#!/usr/bin/env bash
set -euo pipefail

ROOT=/Users/jackgreenberg/Desktop/rank-and-rent
S=$ROOT/David/clones/scripts
PROJ=$ROOT/commercial-roofing/commercialroofersspringfieldmo-com
REFHOST=spawglass-com
VOICE=$S/voice/commercial-roofing.json
PAGES="home=https://www.spawglass.com/,about=https://www.spawglass.com/about-us/,contact=https://www.spawglass.com/contact/,index=https://www.spawglass.com/our-projects/,slug=https://www.spawglass.com/spring-fire-department-training-center/"
CFG=$PROJ/home.config.json
MAP=$S/relabel-map-$REFHOST.json
CAP=$ROOT/David/clones/_captures/$REFHOST-v1

[ -f "$CFG" ] || { echo "MISSING $CFG"; exit 1; }
[ -f "$MAP" ] || { echo "MISSING $MAP"; exit 1; }
if [ ! -f "$CAP/public/home.html.ref" ]; then
  node "$S/faithful-home.mjs" --no-scripts --src "https://www.spawglass.com/" --pages "$PAGES" --dir "$CAP"
fi
mkdir -p "$PROJ/public"
cp "$CAP"/public/*.html.ref "$PROJ/public/" 2>/dev/null || true
[ -d "$PROJ/public/assets-f" ] || cp -R "$CAP/public/assets-f" "$PROJ/public/"
mkdir -p "$PROJ/qa-out"
cp "$CAP"/qa-out/ref-*.png "$PROJ/qa-out/" 2>/dev/null || true
python3 "$S/normalize_content.py" "$PROJ" --voice "$VOICE"
python3 - "$PROJ" <<'PY'
import shutil, sys, os
p = sys.argv[1]
src, dst = os.path.join(p, 'public/images'), os.path.join(p, 'public/ours')
if os.path.isdir(src): shutil.copytree(src, dst, dirs_exist_ok=True)
PY
python3 "$S/relabel_engine.py" --config "$CFG" --map "$MAP" --voice "$VOICE"
python3 "$PROJ/scripts/normalize-contact-forms.py" "$PROJ"
python3 "$PROJ/scripts/hobo-seo-finalize.py" "$PROJ"
python3 - "$PROJ" <<'PY'
from pathlib import Path
import sys

project = Path(sys.argv[1])
old = "Commercial Roofers of Springfield" + ", MO"
new = "Commercial Roofers of Springfield"
for path in project.rglob("*"):
    if not path.is_file() or ".git" in path.parts or "node_modules" in path.parts:
        continue
    if path.suffix.lower() not in {".html", ".txt", ".js", ".json", ".xml"}:
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    if old in text:
        path.write_text(text.replace(old, new), encoding="utf-8")
PY
python3 "$S/verify_site.py" "$PROJ" --map "$MAP" --json "$PROJ/qa-out/verify.json"
node "$S/qa_shots.mjs" "$PROJ"
echo "BUILD COMPLETE — gates green. Human QA: open $PROJ/qa-out/CONTACT-SHEET.html"
