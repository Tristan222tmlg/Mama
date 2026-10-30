// Grafiken aus den Pflanzendaten, beim Bauen als HTML und SVG erzeugt.
// Sie funktionieren ohne JavaScript; assets/js/grafik.js macht Rad und Netz nur bedienbar.
// Farben und Linienarten kommen aus style.css.

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const KURZ = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const zahl = (n) => Math.round(n * 100) / 100;

// Zwölf Felder, die Blühmonate gefüllt
export function monatsband([von, bis], farbe = "") {
  let felder = "";
  for (let m = 1; m <= 12; m++) felder += `<span class="mb${m >= von && m <= bis ? " an" : ""}"></span>`;
  return `<span class="monatsband farbe-${esc(farbe)}" aria-hidden="true">${felder}</span>`;
}

// Alle Pflanzen mit Blühmonaten als Balken über das Jahr
export function bluehkalender(daten) {
  const reihen = [...daten.pflanzen, ...daten.weitere].filter((p) => p.bluete).sort((a, b) => a.bluete[0] - b.bluete[0] || a.bluete[1] - b.bluete[1]);
  const kopf = KURZ.map((k, i) => `<span title="${MONATE[i]}">${k}</span>`).join("");
  const zeilen = reihen
    .map((p) => {
      const [von, bis] = p.bluete;
      const zeit = von === bis ? MONATE[von - 1] : `${MONATE[von - 1]} bis ${MONATE[bis - 1]}`;
      return `<li class="kalender-zeile"><span class="kalender-name">${esc(p.name)}<span class="sr">: blüht ${zeit}</span></span><span class="kalender-spur" aria-hidden="true"><span class="kalender-balken farbe-${esc(p.bluetenfarbe)} von-${von} bis-${bis}"></span></span></li>`;
    })
    .join("\n");
  return `<div class="kalender-kopf" aria-hidden="true"><span></span><span class="kalender-monate">${kopf}</span></div>\n<ul class="kalender-zeilen">\n${zeilen}\n</ul>`;
}

// Pflanzen links, Tiere rechts, dazwischen die belegten Verbindungen
export function beziehungsnetz(daten) {
  const links = [];
  const tiere = new Map();
  const kanten = [];
  const tier = (b) => {
    if (!tiere.has(b.tier)) tiere.set(b.tier, { name: b.tier, latein: b.latein, offen: b.status === "bestimmen-lassen", nr: tiere.size });
    return tiere.get(b.tier);
  };
  for (const p of daten.pflanzen) {
    links.push({ name: p.name, unter: p.latein, farbe: p.bluetenfarbe || "gruen" });
    for (const b of p.beziehungen) kanten.push({ l: links.length - 1, t: tier(b), art: b.art, status: b.status });
  }
  for (const p of daten.pflanzen) {
    for (const b of p.beziehungen) {
      if (!b.raupen_an) continue;
      links.push({ name: b.raupen_an, unter: "Raupenfutter", farbe: "gruen" });
      kanten.push({ l: links.length - 1, t: tier(b), art: "raupe", status: "belegt" });
    }
  }
  const n = daten.nisthilfe;
  links.push({ name: n.titel, unter: "Wohnung", farbe: "holz" });
  kanten.push({ l: links.length - 1, t: tier(n), art: n.art, status: n.status });

  // Tiere nach dem Schwerpunkt ihrer Pflanzen ordnen, damit sich wenig kreuzt
  const rechts = [...tiere.values()];
  for (const t of rechts) {
    const ls = kanten.filter((k) => k.t === t).map((k) => k.l);
    t.schwer = ls.reduce((a, b) => a + b, 0) / ls.length;
  }
  rechts.sort((a, b) => a.schwer - b.schwer || a.nr - b.nr);
  rechts.forEach((t, i) => (t.i = i));

  const y = (i, n) => zahl(((i + 0.5) / n) * 100);
  const pfade = kanten
    .map((k) => {
      const y1 = y(k.l, links.length);
      const y2 = y(k.t.i, rechts.length);
      return `<path class="kante art-${k.art} status-${k.status}" data-l="${k.l}" data-t="${k.t.i}" d="M0 ${y1}C50 ${y1} 50 ${y2} 100 ${y2}" vector-effect="non-scaling-stroke"/>`;
    })
    .join("");
  const knoten = (k, seite, i) =>
    `<li class="netz-knoten" data-${seite === "links" ? "l" : "t"}="${i}"><span class="netz-punkt farbe-${esc(k.farbe || "gruen")}"></span><span class="netz-name">${esc(k.name)}${
      k.unter ? `<span class="netz-unter">${esc(k.unter)}</span>` : ""
    }${k.offen ? `<span class="netz-unter">Art noch offen</span>` : ""}</span></li>`;
  const zeilen = Math.max(links.length, rechts.length);
  return (
    `<div class="netz-flaeche zeilen-${zeilen}" aria-hidden="true">` +
    `<ul class="netz-links">${links.map((k, i) => knoten(k, "links", i)).join("")}</ul>` +
    `<svg class="netz-linien" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">${pfade}</svg>` +
    `<ul class="netz-rechts">${rechts.map((t, i) => knoten({ ...t, unter: t.latein, farbe: "tier" }, "rechts", i)).join("")}</ul>` +
    `</div>`
  );
}

// ---------- Blüten-Jahresrad: jede Pflanze ein Bogen über ihre Blühmonate ----------

const KURZ3 = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const punkt = (cx, cy, r, grad) => {
  const w = ((grad - 90) * Math.PI) / 180;
  return [zahl(cx + r * Math.cos(w)), zahl(cy + r * Math.sin(w))];
};
const bogen = (cx, cy, r, von, bis) => {
  const [x1, y1] = punkt(cx, cy, r, von);
  const [x2, y2] = punkt(cx, cy, r, bis);
  return `M${x1} ${y1}A${r} ${r} 0 ${bis - von > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};
const slug = (s) => String(s).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const keil = (c, r0, r1, von, bis) => {
  const [ax, ay] = punkt(c, c, r0, von), [bx, by] = punkt(c, c, r1, von);
  const [dx, dy] = punkt(c, c, r1, bis), [ex, ey] = punkt(c, c, r0, bis);
  return `M${ax} ${ay}L${bx} ${by}A${r1} ${r1} 0 0 1 ${dx} ${dy}L${ex} ${ey}A${r0} ${r0} 0 0 0 ${ax} ${ay}Z`;
};
const zeitraum = ([von, bis]) => (von === bis ? MONATE[von - 1] : `${MONATE[von - 1]} bis ${MONATE[bis - 1]}`);

export function bluehrad(daten) {
  const reihen = [...daten.pflanzen, ...daten.weitere].filter((p) => p.bluete).sort((a, b) => a.bluete[0] - b.bluete[0] || a.bluete[1] - b.bluete[1]);
  const S = 600, C = 300, innen = 96, aussen = 248;
  const schritt = (aussen - innen) / reihen.length, breite = schritt * 0.72;
  let svg = `<svg class="rad" viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">`;
  // Monatsfelder zum Anklicken, darunter die Bögen
  for (let m = 1; m <= 12; m++) svg += `<path class="rad-sektor" data-monat="${m}" d="${keil(C, innen - 10, aussen + 36, (m - 1) * 30, m * 30)}"/>`;
  reihen.forEach((p, i) => {
    const r = zahl(innen + schritt * (i + 0.5));
    const kappe = (breite / 2 / r) * (180 / Math.PI);
    const [von, bis] = p.bluete;
    const d = bogen(C, C, r, (von - 1) * 30 + kappe + 1.5, bis * 30 - kappe - 1.5);
    svg += `<circle class="rad-spur" cx="${C}" cy="${C}" r="${r}"/>`;
    svg += `<path class="rad-rand" d="${d}" stroke-width="${zahl(breite + 3)}"/>`;
    svg += `<path class="rad-bogen farbe-${esc(p.bluetenfarbe)}" data-pflanze="${slug(p.name)}" data-von="${von}" data-bis="${bis}" stroke-width="${zahl(breite)}" d="${d}"/>`;
  });
  for (let m = 0; m < 12; m++) {
    const [x1, y1] = punkt(C, C, innen - 8, m * 30);
    const [x2, y2] = punkt(C, C, aussen + 6, m * 30);
    svg += `<line class="rad-speiche" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (let m = 1; m <= 12; m++) {
    const [tx, ty] = punkt(C, C, aussen + 22, (m - 0.5) * 30);
    svg += `<text class="rad-monat" data-monat="${m}" x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central">${KURZ3[m - 1]}</text>`;
  }
  svg += `<circle class="rad-heute" cx="${C}" cy="${C}" r="5"/></svg>`;
  const liste = reihen
    .map((p) => {
      const [von, bis] = p.bluete;
      return `<li data-pflanze="${slug(p.name)}" data-von="${von}" data-bis="${bis}"><a href="pflanzen-und-tiere.html#${slug(p.name)}"><span class="rad-farbe farbe-${esc(p.bluetenfarbe)}" aria-hidden="true"></span><span class="rad-name">${esc(p.name)}</span><span class="rad-zeit">${zeitraum(p.bluete)}</span></a></li>`;
    })
    .join("");
  const knoepfe = KURZ3.map((k, i) => `<button type="button" data-monat="${i + 1}" aria-pressed="false">${k}</button>`).join("");
  return { svg, liste, knoepfe, anzahl: reihen.length };
}

// ---------- Rundes Beziehungsnetz: Pflanzen links, Tiere rechts auf einem Kreis ----------

export function kreisnetz(daten) {
  const links = [];
  const tiere = new Map();
  const kanten = [];
  const tier = (b) => {
    if (!tiere.has(b.tier)) tiere.set(b.tier, { name: b.tier, latein: b.latein, offen: b.status === "bestimmen-lassen", nr: tiere.size });
    return tiere.get(b.tier);
  };
  const eintrag = (pflanze, tiername) => `${slug(pflanze)}-${slug(tiername)}`;
  for (const p of daten.pflanzen) {
    links.push({ name: p.name, farbe: p.bluetenfarbe || "gruen", ziel: slug(p.name) });
    for (const b of p.beziehungen) {
      const t = tier(b);
      t.ziel ??= eintrag(p.name, b.tier);
      kanten.push({ l: links.length - 1, t, art: b.art, status: b.status, pflanze: p.name, kurz: b.kurz });
    }
  }
  for (const p of daten.pflanzen) for (const b of p.beziehungen) {
    if (!b.raupen_an) continue;
    links.push({ name: b.raupen_an, farbe: "gruen", unter: "Raupenfutter", ziel: eintrag(p.name, b.tier) });
    kanten.push({ l: links.length - 1, t: tier(b), art: "raupe", status: "belegt", pflanze: b.raupen_an, kurz: "Futter für die Raupen" });
  }
  const n = daten.nisthilfe;
  links.push({ name: n.titel, farbe: "holz", unter: "Wohnung", ziel: "nisthilfe" });
  const nt = tier(n);
  nt.ziel ??= "nisthilfe";
  kanten.push({ l: links.length - 1, t: nt, art: n.art, status: n.status, pflanze: n.titel, kurz: n.kurz });
  const rechts = [...tiere.values()];
  for (const t of rechts) {
    const ls = kanten.filter((k) => k.t === t).map((k) => k.l);
    t.schwer = ls.reduce((a, b) => a + b, 0) / ls.length;
  }
  rechts.sort((a, b) => a.schwer - b.schwer || a.nr - b.nr);

  // Kreis in einer Fläche von 1000 × 700; Pflanzen von oben links nach unten links, Tiere rechts
  const W = 1000, H = 700, cx = 500, cy = 350, R = 300;
  const lage = (i, anzahl, start, ende) => {
    const g = start + ((ende - start) * (i + 0.5)) / anzahl;
    const w = (g * Math.PI) / 180;
    return [zahl(cx + R * Math.cos(w)), zahl(cy + R * Math.sin(w))];
  };
  const pl = links.map((k, i) => lage(i, links.length, 238, 122));
  const tr = rechts.map((t, i) => lage(i, rechts.length, -58, 58));
  rechts.forEach((t, i) => (t.pos = tr[i]));
  let pfade = "";
  for (const k of kanten) {
    const [x1, y1] = pl[k.l];
    const [x2, y2] = k.t.pos;
    pfade += `<path class="kante art-${k.art} status-${k.status}" data-l="${k.l}" data-t="${rechts.indexOf(k.t)}" data-tier="${esc(k.t.name)}" data-pflanze="${esc(k.pflanze)}" data-kurz="${esc(k.kurz)}" d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}"/>`;
  }
  let punkte = "";
  pl.forEach(([x, y], i) => (punkte += `<circle class="netz-punkt farbe-${esc(links[i].farbe)}" data-l="${i}" cx="${x}" cy="${y}" r="9"/>`));
  tr.forEach(([x, y], i) => (punkte += `<circle class="netz-punkt tier" data-t="${i}" cx="${x}" cy="${y}" r="9"/>`));
  const prozent = ([x, y]) => [zahl((x / W) * 100), zahl((y / H) * 100)];
  const etiketten =
    links.map((k, i) => {
      const [x, y] = prozent(pl[i]);
      return `<li class="netz-etikett links x-${Math.round(x)} y-${Math.round(y)}" data-l="${i}"><a href="#${k.ziel}" tabindex="-1">${esc(k.name)}${k.unter ? `<small>${esc(k.unter)}</small>` : ""}</a></li>`;
    }).join("") +
    rechts.map((t, i) => {
      const [x, y] = prozent(t.pos);
      return `<li class="netz-etikett rechts x-${Math.round(x)} y-${Math.round(y)}" data-t="${i}"><a href="#${t.ziel}" tabindex="-1">${esc(t.name)}${t.offen ? `<small>Art noch offen</small>` : ""}</a></li>`;
    }).join("");
  return `<div class="kreisnetz" aria-hidden="true"><div class="netz-buehne"><svg viewBox="0 0 ${W} ${H}" focusable="false"><circle class="netz-kreis" cx="${cx}" cy="${cy}" r="${R}"/>${pfade}${punkte}</svg><ul>${etiketten}</ul></div><p class="netz-info" data-netz-info>Zeig auf eine Pflanze, ein Tier oder eine Linie.</p></div>`;
}
