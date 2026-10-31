"""Baut aus einer Vorschau-Fassung (VORSCHAU=1) die Dateien für das Artifact:
index.html nur mit dem Inhalt von <body> (der Rahmen kommt vom Artifact),
alle anderen Dateien unverändert. Schreibt die Dateiliste für den Upload.

Aufruf aus site/: rm -rf _site && VORSCHAU=1 npx @11ty/eleventy
                 python3 tools/vorschau/vorschau.py _site ZIELORDNER ALTE-LISTE.json > NEUE-LISTE.json
ZIELORDNER wird neu angelegt. ALTE-LISTE.json ist die Liste vom letzten Upload
(fehlt sie, wird nichts entfernt); was dort steht und jetzt fehlt, bekommt null.
NEUE-LISTE.json ist die files-Zuordnung für das Artifact-Werkzeug; index.html
aus ZIELORDNER ist die Seite selbst."""
import json, pathlib, re, shutil, sys

quelle, ziel, altliste = map(pathlib.Path, sys.argv[1:4])
if ziel.exists():
    shutil.rmtree(ziel)
shutil.copytree(quelle, ziel, ignore=shutil.ignore_patterns(".htaccess", "formular.php", "robots.txt", "sitemap.xml", "*.php"))

html = (ziel / "index.html").read_text()
titel = re.search(r"<title>.*?</title>", html, re.S).group(0)
kopf = "\n".join(re.findall(r'<link rel="(?:preload|stylesheet)"[^>]*>', html))
body = re.search(r"<body>(.*)</body>", html, re.S).group(1).strip()
(ziel / "index.html").write_text(f'{titel}\n<script>document.documentElement.lang = "de";</script>\n{kopf}\n{body}\n')

typen = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png",
         ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain"}
dateien = {}
for f in sorted(ziel.rglob("*")):
    if f.is_file() and f.name != "index.html" and not (f.parent == ziel and f.name == "index.html"):
        rel = f.relative_to(ziel).as_posix()
        if rel == "index.html":
            continue
        dateien[rel] = {"from": str(f.resolve()), "contentType": typen[f.suffix]}
alt = [e["path"] for e in json.loads(altliste.read_text())] if altliste.exists() else []
for weg in alt:
    if weg not in dateien:
        dateien[weg] = None
print(json.dumps(dateien, ensure_ascii=False))
print(len([d for d in dateien.values() if d]), "Dateien,", len([d for d in dateien.values() if d is None]), "entfernt", file=sys.stderr)
