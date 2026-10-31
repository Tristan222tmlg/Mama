#!/usr/bin/env python3
"""Zeichnet das Logo aus den beiden Bildschirmfotos als SVG nach.

Das ist eine Übergangslösung, bis die Originaldatei der Gestalterin vorliegt.
Die Formen werden als Masken nachgezogen; die Farbverläufe des Originals sind
durch einen Verlauf je Teil angenähert.

  pip install pillow numpy scipy vtracer
  python3 tools/logo/vektor.py     -> src/assets/logo/*.svg

Erzeugt:
  logo.svg                 Zeichen mit Schriftzug (Fassung mit Frosch), farbig
  logo-einfarbig.svg       dasselbe in einer Farbe
  zeichen.svg              nur das Zeichen (Fassung mit Frosch), farbig
  zeichen-einfarbig.svg    dasselbe in einer Farbe
  zeichen-eidechse.svg     die andere Fassung (Eidechse, Wurzeln), farbig
"""

import pathlib
import re
import tempfile

import numpy as np
import vtracer
from PIL import Image
from scipy import ndimage

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent.parent / "src" / "assets" / "logo"
SCALE = 3                 # vor dem Nachzeichnen hochrechnen, das glättet die Kanten
GREEN_LIGHT = "#A3C548"
GREEN_MID = "#7DAA45"
GREEN_MID_DARK = "#4A8540"
GREEN_DARK = "#2C6334"
ONE_COLOUR = "#1A3D25"


def load(name):
    im = Image.open(HERE / name).convert("RGB")
    w, h = im.size
    return np.asarray(im.resize((w * SCALE, h * SCALE), Image.LANCZOS)).astype(np.int16)


def masks(a):
    """Hintergrund, blaue Erdkugel und grüne Formen trennen (Kante bei halber Deckung)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    ink = a.min(-1) < 155
    blue = ink & (b > g + 10) & (b > r + 40)
    green = ink & ~blue
    return clean(green), clean(blue)


def clean(mask, min_px=60 * SCALE * SCALE):
    labels, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= min_px
    return keep[labels]


def fit_circle(blue, ink):
    """Kreis an den Rand der Kugel legen, wo sie an den Hintergrund grenzt."""
    edge = blue & ndimage.binary_dilation(~ink, iterations=2)
    ys, xs = np.nonzero(edge)
    A = np.column_stack([xs, ys, np.ones_like(xs)])
    rhs = -(xs ** 2 + ys ** 2)
    D, E, F = np.linalg.lstsq(A, rhs, rcond=None)[0]
    cx, cy = -D / 2, -E / 2
    return cx, cy, float(np.sqrt(cx ** 2 + cy ** 2 - F))


def trace(mask):
    """Maske mit vtracer nachzeichnen, Pfade als Liste von (d, transform)."""
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = pathlib.Path(tmp) / "m.png", pathlib.Path(tmp) / "m.svg"
        Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).save(src)
        vtracer.convert_image_to_svg_py(
            str(src), str(dst), colormode="binary", mode="spline",
            filter_speckle=6, corner_threshold=60, length_threshold=4.0,
            splice_threshold=45, path_precision=1,
        )
        svg = dst.read_text()
    paths = []
    for m in re.finditer(r"<path ([^>]*)/>", svg):
        attrs = m.group(1)
        d = re.search(r'd="([^"]+)"', attrs).group(1)
        t = re.search(r'translate\(([-\d.]+),([-\d.]+)\)', attrs)
        paths.append(shift(d, *(map(float, t.groups()) if t else (0.0, 0.0))))
    return paths


def shift(d, tx, ty):
    """Verschiebung in die Koordinaten einrechnen (vtracer schreibt nur M, C, Z).

    Ohne transform-Attribut liegen die Farbverläufe für alle Teile richtig.
    Gerundet auf ganze Zahlen, das ist bei dreifacher Vergrößerung genau genug.
    """
    if re.search(r"[^MCZ\d\s.,-]", d):
        raise SystemExit("unerwarteter Pfadbefehl in: " + d[:60])
    n = iter(range(10 ** 9))
    return re.sub(r"-?\d+(?:\.\d+)?", lambda m: "%d" % round(float(m.group()) + (tx if next(n) % 2 == 0 else ty)), d).strip()


def path_tags(paths, fill):
    return "\n".join('<path d="%s" fill="%s"/>' % (d, fill) for d in paths)


def bbox(mask, pad):
    ys, xs = np.nonzero(mask)
    return xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad


def svg(view, defs, body, title):
    x0, y0, x1, y1 = view
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%d %d %d %d" role="img">\n'
        "<title>%s</title>\n%s\n%s\n</svg>\n" % (x0, y0, x1 - x0, y1 - y0, title, defs, body)
    )


def radial(id_, cx, cy, r):
    return (
        '<radialGradient id="%s" gradientUnits="userSpaceOnUse" cx="%.0f" cy="%.0f" r="%.0f">'
        '<stop offset="0" stop-color="%s"/><stop offset=".5" stop-color="%s"/>'
        '<stop offset=".85" stop-color="%s"/><stop offset="1" stop-color="%s"/></radialGradient>'
        % (id_, cx, cy, r, GREEN_LIGHT, GREEN_MID, GREEN_MID_DARK, GREEN_DARK)
    )


def mark(name, split_x=None):
    """Ein Zeichen nachzeichnen. split_x trennt den Schriftzug ab (Originalpixel)."""
    a = load(name)
    green, blue = masks(a)
    text = np.zeros_like(green)
    if split_x:
        labels, n = ndimage.label(green)
        for i, sl in enumerate(ndimage.find_objects(labels), start=1):
            if sl[1].start >= split_x * SCALE:
                text |= labels == i
        green &= ~text
    ink = green | blue | text
    cx, cy, r = fit_circle(blue, ink)
    inner = ndimage.binary_erosion(blue, iterations=3 * SCALE)
    globe = "#%02X%02X%02X" % tuple(int(v) for v in np.median(a[inner], axis=0))
    return dict(green=green, blue=blue, text=text, circle=(cx, cy, r), shape=a.shape, globe=globe)


def disc(shape, cx, cy, r):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return (xx - cx) ** 2 + (yy - cy) ** 2 <= r ** 2


def build(m, with_text, title, name_colour, name_mono=None):
    cx, cy, r = m["circle"]
    motif = trace(m["green"])
    pad = 6 * SCALE
    area = m["green"] | disc(m["shape"], cx, cy, r) | (m["text"] if with_text else False)
    view = bbox(area, pad)
    defs = radial("gruen", cx, cy - 0.1 * r, 2.1 * r)
    body = '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>\n' % (cx, cy, r, m["globe"])
    body += path_tags(motif, "url(#gruen)")
    if with_text:
        tx0, _, tx1, _ = bbox(m["text"], 0)
        defs += (
            '<linearGradient id="schrift" gradientUnits="userSpaceOnUse" x1="%d" y1="0" x2="%d" y2="0">'
            '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>'
            % (tx0, tx1, GREEN_DARK, "#7BA84A")
        )
        body += "\n" + path_tags(trace(m["text"]), "url(#schrift)")
    (OUT / name_colour).write_text(svg(view, "<defs>%s</defs>" % defs, body, title))

    if name_mono:
        # Eine Farbe: Die Kugel bekommt eine schmale Lücke um die grünen Formen,
        # sonst verschmelzen Kugel und Pflanze zu einer Fläche.
        gap = int(0.009 * (view[2] - view[0]))
        globe = disc(m["shape"], cx, cy, r) & ~ndimage.binary_dilation(m["green"], iterations=gap)
        body = path_tags(trace(globe), ONE_COLOUR) + "\n" + path_tags(motif, ONE_COLOUR)
        if with_text:
            body += "\n" + path_tags(trace(m["text"]), ONE_COLOUR)
        (OUT / name_mono).write_text(svg(view, "", body, title))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    frog = mark("quelle-logo-frosch.png", split_x=930)
    build(frog, True, "Bessere Welt ergärtnern", "logo.svg", "logo-einfarbig.svg")
    build(frog, False, "Bessere Welt ergärtnern", "zeichen.svg", "zeichen-einfarbig.svg")
    lizard = mark("quelle-zeichen-eidechse.png")
    build(lizard, False, "Bessere Welt ergärtnern", "zeichen-eidechse.svg")
    for f in sorted(OUT.glob("*.svg")):
        print("%-26s %6.1f kB" % (f.name, f.stat().st_size / 1000))


if __name__ == "__main__":
    main()
