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
      return `<path class="kante art-${k.art} status-${k.status}" d="M0 ${y1}C50 ${y1} 50 ${y2} 100 ${y2}" vector-effect="non-scaling-stroke"/>`;
    })
    .join("");
  const knoten = (k, seite) =>
    `<li class="netz-knoten"><span class="netz-punkt farbe-${esc(k.farbe || "gruen")}"></span><span class="netz-name">${esc(k.name)}${
      k.unter ? `<span class="netz-unter">${esc(k.unter)}</span>` : ""
    }${k.offen ? `<span class="netz-unter">Art noch offen</span>` : ""}</span></li>`;
  const zeilen = Math.max(links.length, rechts.length);
  return (
    `<div class="netz-flaeche zeilen-${zeilen}" aria-hidden="true">` +
    `<ul class="netz-links">${links.map((k) => knoten(k, "links")).join("")}</ul>` +
    `<svg class="netz-linien" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">${pfade}</svg>` +
    `<ul class="netz-rechts">${rechts.map((t) => knoten({ ...t, unter: t.latein, farbe: "tier" }, "rechts")).join("")}</ul>` +
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

export function bluehrad(daten) {
  const reihen = [...daten.pflanzen, ...daten.weitere].filter((p) => p.bluete).sort((a, b) => a.bluete[0] - b.bluete[0] || a.bluete[1] - b.bluete[1]);
  const C = 200, innen = 74, aussen = 168;
  const schritt = (aussen - innen) / reihen.length;
  let svg = `<svg class="rad" viewBox="0 0 400 400" aria-hidden="true" focusable="false">`;
  svg += `<path class="rad-keil" d=""/>`;
  for (let m = 0; m < 12; m++) {
    const [x1, y1] = punkt(C, C, innen - 6, m * 30);
    const [x2, y2] = punkt(C, C, aussen + 6, m * 30);
    svg += `<line class="rad-speiche" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    const [tx, ty] = punkt(C, C, aussen + 19, m * 30 + 15);
    svg += `<text class="rad-monat" x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central">${KURZ3[m]}</text>`;
  }
  reihen.forEach((p, i) => {
    const r = zahl(innen + schritt * (i + 0.5));
    const [von, bis] = p.bluete;
    svg += `<path class="rad-spur" d="${bogen(C, C, r, 0.01, 359.99)}"/>`;
    svg += `<path class="rad-bogen farbe-${esc(p.bluetenfarbe)}" data-pflanze="${slug(p.name)}" data-von="${von}" data-bis="${bis}" stroke-width="${zahl(schritt * 0.62)}" d="${bogen(C, C, r, (von - 1) * 30 + 2, bis * 30 - 2)}"/>`;
  });
  svg += `</svg>`;
  const liste = reihen
    .map((p) => {
      const [von, bis] = p.bluete;
      const zeit = von === bis ? MONATE[von - 1] : `${MONATE[von - 1]} bis ${MONATE[bis - 1]}`;
      return `<li data-pflanze="${slug(p.name)}" data-von="${von}" data-bis="${bis}"><span class="rad-farbe farbe-${esc(p.bluetenfarbe)}" aria-hidden="true"></span><span class="rad-name">${esc(p.name)}</span><span class="rad-zeit">${zeit}</span></li>`;
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
  for (const p of daten.pflanzen) {
    links.push({ name: p.name, farbe: p.bluetenfarbe || "gruen" });
    for (const b of p.beziehungen) kanten.push({ l: links.length - 1, t: tier(b), art: b.art, status: b.status });
  }
  for (const p of daten.pflanzen) for (const b of p.beziehungen) {
    if (!b.raupen_an) continue;
    links.push({ name: b.raupen_an, farbe: "gruen", unter: "Raupenfutter" });
    kanten.push({ l: links.length - 1, t: tier(b), art: "raupe", status: "belegt" });
  }
  const n = daten.nisthilfe;
  links.push({ name: n.titel, farbe: "holz", unter: "Wohnung" });
  kanten.push({ l: links.length - 1, t: tier(n), art: n.art, status: n.status });
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
    pfade += `<path class="kante art-${k.art} status-${k.status}" data-l="${k.l}" data-t="${rechts.indexOf(k.t)}" d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}"/>`;
  }
  let punkte = "";
  pl.forEach(([x, y], i) => (punkte += `<circle class="netz-punkt farbe-${esc(links[i].farbe)}" cx="${x}" cy="${y}" r="9"/>`));
  tr.forEach(([x, y]) => (punkte += `<circle class="netz-punkt tier" cx="${x}" cy="${y}" r="9"/>`));
  const prozent = ([x, y]) => [zahl((x / W) * 100), zahl((y / H) * 100)];
  const etiketten =
    links.map((k, i) => {
      const [x, y] = prozent(pl[i]);
      return `<li class="netz-etikett links x-${Math.round(x)} y-${Math.round(y)}" data-l="${i}"><span>${esc(k.name)}</span>${k.unter ? `<small>${esc(k.unter)}</small>` : ""}</li>`;
    }).join("") +
    rechts.map((t, i) => {
      const [x, y] = prozent(t.pos);
      return `<li class="netz-etikett rechts x-${Math.round(x)} y-${Math.round(y)}" data-t="${i}"><span>${esc(t.name)}</span>${t.offen ? `<small>Art noch offen</small>` : ""}</li>`;
    }).join("");
  return `<div class="kreisnetz" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" focusable="false"><circle class="netz-kreis" cx="${cx}" cy="${cy}" r="${R}"/>${pfade}${punkte}</svg><ul>${etiketten}</ul></div>`;
}
