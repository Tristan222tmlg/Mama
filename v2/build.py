#!/usr/bin/env python3
"""Packt die Website aus v2/ in eine einzige, eigenständige HTML-Datei.

Schriften und Bilder werden eingebettet, CSS und JavaScript eingefügt. Die
Datei funktioniert ohne Server und ohne Internet – man kann sie per Mail
verschicken oder einfach doppelklicken.

  python3 v2/build.py                  -> v2/dist/bessere-welt-ergaertnern.html
  python3 v2/build.py --body ZIEL.html -> nur der Seiteninhalt ohne <html>/<head>
                                          (für Umgebungen, die das Grundgerüst selbst stellen)

Alle Nicht-ASCII-Zeichen werden maskiert (HTML-Entities, \\u-Escapes in
JavaScript), damit Umlaute unabhängig von der Zeichensatz-Erkennung stimmen.
"""

import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
MIME = {".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"}


def data_uri(path):
    return "data:%s;base64,%s" % (MIME[path.suffix], base64.b64encode(path.read_bytes()).decode("ascii"))


def ascii_html(text):
    return "".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in text)


def ascii_js(text):
    out = []
    for c in text:
        n = ord(c)
        if n < 128:
            out.append(c)
        elif n <= 0xFFFF:
            out.append("\\u%04x" % n)
        else:
            n -= 0x10000
            out.append("\\u%04x\\u%04x" % (0xD800 + (n >> 10), 0xDC00 + (n & 0x3FF)))
    return "".join(out).replace("</script", "<\\/script")


def css():
    text = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("%s")' % data_uri(ROOT / "assets/fonts" / m.group(1)), text)
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    if any(ord(c) > 127 for c in text):
        raise SystemExit("style.css: Nicht-ASCII-Zeichen außerhalb von Kommentaren – bitte als CSS-Escape schreiben.")
    return text


def scripts():
    data = (ROOT / "assets/js/data.js").read_text(encoding="utf-8")
    data = re.sub(r'"assets/img/([^"]+)"', lambda m: '"%s"' % data_uri(ROOT / "assets/img" / m.group(1)), data)
    app = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
    return "<script>\n%s\n</script>\n<script>\n%s\n</script>" % (ascii_js(data), ascii_js(app))


def split_page():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    body = re.sub(r'\s*<script src="[^"]+"></script>', "", body)
    if "assets/" in body:
        raise SystemExit("index.html: Pfad auf assets/ im Seiteninhalt – Bilder bitte über data-img einbinden.")
    return head, body.strip()


def full_document():
    head, body = split_page()
    head = re.sub(r'\s*<link rel="preload"[^>]*>', "", head)
    head = head.replace('<link rel="stylesheet" href="assets/css/style.css" />', "<style>\n%s\n</style>" % css())
    head = re.sub(r'href="assets/img/([^"]+)"', lambda m: 'href="%s"' % data_uri(ROOT / "assets/img" / m.group(1)), head)
    # keep the JSON-LD block out of the entity pass (script content is raw text)
    ld = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', head, re.S)
    head = ascii_html(head.replace(ld.group(0), "@@LD@@")).replace("@@LD@@", ld.group(1) + ascii_js(ld.group(2)) + ld.group(3))
    return '<!doctype html>\n<html lang="de">\n<head>%s</head>\n<body>\n%s\n%s\n</body>\n</html>\n' % (head, ascii_html(body), scripts())


def body_only():
    _, body = split_page()
    return (
        "<title>%s</title>\n" % ascii_html("Bessere Welt ergärtnern v2")
        + "<style>\n%s\n</style>\n" % css()
        + '<script>document.documentElement.lang = "de";</script>\n'
        + ascii_html(body) + "\n" + scripts() + "\n"
    )


def main(argv):
    if len(argv) == 3 and argv[1] == "--body":
        target, text = pathlib.Path(argv[2]), body_only()
    elif len(argv) == 1:
        target, text = ROOT / "dist" / "bessere-welt-ergaertnern.html", full_document()
    else:
        raise SystemExit(__doc__)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="ascii")
    print("%s  (%.1f MB)" % (target, target.stat().st_size / 1e6))


if __name__ == "__main__":
    main(sys.argv)
