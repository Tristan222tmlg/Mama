// Die Grafiken zum Anfassen. Ohne dieses Skript zeigen sie alles auf einmal;
// mit ihm reagieren sie auf Maus, Finger und Tastatur.
(() => {
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const mitBewegung = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Blüten-Jahresrad: Monat wählen, Bogen zeigen, Klick führt zur Pflanze ---------- */

  const C = 300, AUSSEN = 248; // wie bluehrad() in lib/grafiken.js; 0 Grad oben, im Uhrzeigersinn
  const punkt = (r, grad) => {
    const w = ((grad - 90) * Math.PI) / 180;
    return [C + r * Math.cos(w), C + r * Math.sin(w)].map((n) => n.toFixed(1));
  };

  for (const teil of document.querySelectorAll(".radteil")) {
    const svg = teil.querySelector(".rad");
    const sektoren = [...svg.querySelectorAll(".rad-sektor")];
    const monate = [...svg.querySelectorAll(".rad-monat")];
    const boegen = [...svg.querySelectorAll(".rad-bogen")];
    const liste = teil.querySelector(".rad-liste");
    const zeilen = [...liste.querySelectorAll("li")];
    const knoepfe = teil.querySelector(".rad-knoepfe");
    const titel = teil.querySelector("[data-rad-titel]");
    const unter = teil.querySelector("[data-rad-unter]");
    const listenTitel = teil.querySelector("[data-rad-liste-titel]");
    const leer = teil.querySelector("[data-rad-leer]");
    const ansage = teil.querySelector("[data-rad-ansage]");
    const heute = new Date().getMonth() + 1;
    const blueht = (el, m) => m >= Number(el.dataset.von) && m <= Number(el.dataset.bis);
    const name = (z) => z.querySelector(".rad-name").textContent;
    let mitte = [titel.textContent, unter.textContent];

    const [hx, hy] = punkt(AUSSEN + 38, (heute - 0.5) * 30);
    svg.querySelector(".rad-heute").setAttribute("cx", hx);
    svg.querySelector(".rad-heute").setAttribute("cy", hy);

    const waehle = (m, ansagen) => {
      for (const el of [...sektoren, ...monate]) el.classList.toggle("gewaehlt", Number(el.dataset.monat) === m);
      for (const b of knoepfe.querySelectorAll("button")) b.setAttribute("aria-pressed", String(Number(b.dataset.monat) === m));
      for (const b of boegen) b.classList.toggle("aus", !blueht(b, m));
      const an = zeilen.filter((z) => blueht(z, m));
      for (const z of zeilen) z.hidden = !an.includes(z);
      const monat = MONATE[m - 1];
      if (an.length) {
        listenTitel.textContent = m === heute ? `Jetzt im ${monat} blühen` : `Im ${monat} blühen`;
        leer.hidden = true;
      } else {
        let ab = m;
        do ab = (ab % 12) + 1; while (!zeilen.some((z) => blueht(z, ab)) && ab !== m);
        listenTitel.textContent = `Im ${monat} blüht keine dieser Pflanzen`;
        leer.textContent = `Ab ${MONATE[ab - 1]} geht es wieder los: ${zeilen.filter((z) => blueht(z, ab)).map(name).join(", ")}.`;
        leer.hidden = false;
      }
      mitte = [monat, an.length === 0 ? "keine blüht" : an.length === 1 ? "eine Pflanze blüht" : `${an.length} Pflanzen blühen`];
      [titel.textContent, unter.textContent] = mitte;
      if (ansagen) ansage.textContent = `${monat}: ${an.length ? an.map(name).join(", ") : "keine dieser Pflanzen blüht"}.`;
    };

    // Eine Pflanze hervorheben: Bogen, Zeile und Mitte
    const zeige = (pflanze) => {
      svg.classList.toggle("zeigt", Boolean(pflanze));
      for (const b of boegen) b.classList.toggle("an", b.dataset.pflanze === pflanze);
      for (const z of zeilen) z.classList.toggle("an", z.dataset.pflanze === pflanze);
      const z = pflanze && zeilen.find((x) => x.dataset.pflanze === pflanze);
      titel.textContent = z ? name(z) : mitte[0];
      unter.textContent = z ? z.querySelector(".rad-zeit").textContent : mitte[1];
    };

    svg.addEventListener("pointerover", (e) => zeige(e.target.closest(".rad-bogen")?.dataset.pflanze));
    svg.addEventListener("pointerleave", () => zeige(null));
    svg.addEventListener("click", (e) => {
      const bogen = e.target.closest(".rad-bogen");
      const zeile = bogen && zeilen.find((z) => z.dataset.pflanze === bogen.dataset.pflanze);
      if (zeile) location.href = zeile.querySelector("a").href;
      else if (e.target.closest("[data-monat]")) waehle(Number(e.target.closest("[data-monat]").dataset.monat), true);
    });
    liste.addEventListener("pointerover", (e) => zeige(e.target.closest("li")?.dataset.pflanze));
    liste.addEventListener("pointerleave", () => zeige(null));
    liste.addEventListener("focusin", (e) => zeige(e.target.closest("li")?.dataset.pflanze));
    liste.addEventListener("focusout", () => zeige(null));
    knoepfe.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-monat]");
      if (b) waehle(Number(b.dataset.monat), true);
    });

    knoepfe.hidden = false;
    teil.querySelector(".rad-tipp").hidden = false;
    teil.classList.add("bedienbar");
    waehle(heute, false);
  }

  /* ---------- Rundes Netz: Pflanze, Tier oder Linie zeigen ihre Verbindungen ---------- */

  for (const netz of document.querySelectorAll(".kreisnetz")) {
    const kanten = [...netz.querySelectorAll(".kante")];
    const knoten = [...netz.querySelectorAll(".netz-punkt, .netz-etikett")];
    const info = netz.querySelector("[data-netz-info]");
    const grundtext = info.textContent;
    const schluessel = (el) => ("l" in el.dataset ? `l${el.dataset.l}` : `t${el.dataset.t}`);

    const ruhe = () => {
      netz.classList.remove("hervor");
      for (const el of [...kanten, ...knoten]) el.classList.remove("an");
      info.textContent = grundtext;
    };
    const hebe = (treffer, text) => {
      const dabei = new Set(treffer.flatMap((k) => [`l${k.dataset.l}`, `t${k.dataset.t}`]));
      netz.classList.add("hervor");
      for (const k of kanten) k.classList.toggle("an", treffer.includes(k));
      for (const el of knoten) el.classList.toggle("an", dabei.has(schluessel(el)));
      info.textContent = text;
    };

    netz.addEventListener("pointerover", (e) => {
      const kante = e.target.closest(".kante");
      if (kante) return hebe([kante], `${kante.dataset.tier} und ${kante.dataset.pflanze}: ${kante.dataset.kurz}`);
      const el = e.target.closest(".netz-punkt, .netz-etikett");
      if (!el) return ruhe();
      const seite = "l" in el.dataset ? "l" : "t";
      const treffer = kanten.filter((k) => k.dataset[seite] === el.dataset[seite]);
      const wer = seite === "l" ? treffer[0].dataset.pflanze : treffer[0].dataset.tier;
      const liste = treffer.map((k) => `${seite === "l" ? k.dataset.tier : k.dataset.pflanze} (${k.dataset.kurz})`);
      hebe(treffer, `${wer}: ${liste.join(", ")}`);
    });
    netz.addEventListener("pointerleave", ruhe);
  }

  // Schmale Fassung: Antippen hebt hervor, nochmals Antippen hebt auf
  for (const flaeche of document.querySelectorAll(".netz-flaeche")) {
    const kanten = [...flaeche.querySelectorAll(".kante")];
    const knoten = [...flaeche.querySelectorAll(".netz-knoten")];
    let aktiv = null;
    flaeche.addEventListener("click", (e) => {
      const k = e.target.closest(".netz-knoten");
      aktiv = k && k !== aktiv ? k : null;
      flaeche.classList.toggle("hervor", Boolean(aktiv));
      if (!aktiv) {
        for (const el of [...kanten, ...knoten]) el.classList.remove("an");
        return;
      }
      const seite = "l" in k.dataset ? "l" : "t", gegen = seite === "l" ? "t" : "l";
      const treffer = kanten.filter((x) => x.dataset[seite] === k.dataset[seite]);
      const partner = new Set(treffer.map((x) => x.dataset[gegen]));
      for (const x of kanten) x.classList.toggle("an", treffer.includes(x));
      for (const x of knoten) x.classList.toggle("an", x === k || (gegen in x.dataset && partner.has(x.dataset[gegen])));
    });
    const tipp = flaeche.parentElement.querySelector(".netz-tipp");
    if (tipp) tipp.hidden = false;
  }

  /* ---------- Pflanze mit Tieren: zeigt, was das Tier an der Pflanze tut ---------- */

  for (const orbit of document.querySelectorAll(".pflanzenorbit")) {
    const info = orbit.querySelector(".po-info");
    const wer = info.querySelector("strong"), was = info.querySelector("span");
    const zeige = (a) => {
      orbit.classList.toggle("zeigt", Boolean(a));
      for (const x of orbit.querySelectorAll(".po-tier a")) x.classList.toggle("an", x === a);
      for (const li of document.querySelectorAll(".beziehungen li.an")) li.classList.remove("an");
      if (!a) return;
      wer.textContent = a.querySelector(".po-name").textContent;
      was.textContent = a.dataset.was;
      document.getElementById(a.dataset.eintrag)?.classList.add("an");
    };
    orbit.addEventListener("pointerover", (e) => zeige(e.target.closest(".po-tier a")));
    orbit.addEventListener("pointerleave", () => zeige(null));
    orbit.addEventListener("focusin", (e) => zeige(e.target.closest(".po-tier a")));
    orbit.addEventListener("focusout", () => zeige(null));
  }

  /* ---------- Startseite: ein Trabant holt sein Foto in die Mitte ---------- */

  for (const orbit of document.querySelectorAll(".orbit")) {
    const mitte = orbit.querySelector(".orbit-bild");
    const link = orbit.querySelector("[data-orbit-link]");
    if (!mitte || !link) continue;

    const tausche = (knopf) => {
      const teile = (el) => [...el.querySelectorAll("source"), el.querySelector("img")];
      const a = teile(mitte), b = teile(knopf);
      a.forEach((el, i) => {
        // Nur die Bildquellen wandern; jedes Bild behält seine eigene Größe (sizes)
        for (const attr of ["srcset", "src", "width", "height"]) {
          const x = el.getAttribute(attr), y = b[i].getAttribute(attr);
          if (y === null) el.removeAttribute(attr); else el.setAttribute(attr, y);
          if (x === null) b[i].removeAttribute(attr); else b[i].setAttribute(attr, x);
        }
      });
      const vorher = { alt: mitte.dataset.alt, text: mitte.dataset.text, ziel: mitte.dataset.ziel };
      Object.assign(mitte.dataset, { alt: knopf.dataset.alt, text: knopf.dataset.text, ziel: knopf.dataset.ziel });
      Object.assign(knopf.dataset, vorher);
      mitte.querySelector("img").alt = mitte.dataset.alt;
      knopf.setAttribute("aria-label", `Foto in die Mitte holen: ${vorher.text}`);
      link.textContent = mitte.dataset.text;
      link.classList.remove("vorschau");
      link.setAttribute("href", link.dataset.basis + mitte.dataset.ziel);
    };

    // Beim Zeigen nennt die Unterschrift das Foto des Trabanten
    const vorschau = (knopf) => {
      link.textContent = knopf ? knopf.dataset.text : mitte.dataset.text;
      link.classList.toggle("vorschau", Boolean(knopf));
    };
    // Nach einem Klick zeigt der Trabant das alte Foto; die Vorschau ruht, bis die Maus weiterzieht
    let geklickt = null;
    orbit.addEventListener("pointerover", (e) => {
      const knopf = e.target.closest(".trabant");
      if (knopf !== geklickt) geklickt = null;
      if (!geklickt) vorschau(knopf);
    });
    orbit.addEventListener("pointerleave", () => vorschau(null));
    orbit.addEventListener("focusin", (e) => vorschau(e.target.closest(".trabant")));
    orbit.addEventListener("focusout", () => vorschau(null));

    // Ohne Skript sind die Trabanten Schmuck; jetzt werden sie zu Knöpfen
    orbit.querySelector(".orbit-bahn").removeAttribute("aria-hidden");
    for (const k of orbit.querySelectorAll(".trabant")) k.removeAttribute("tabindex");
    orbit.classList.add("bedienbar");

    orbit.addEventListener("click", (e) => {
      const knopf = e.target.closest(".trabant");
      if (!knopf) return;
      geklickt = knopf;
      if (!document.startViewTransition || !mitBewegung) return tausche(knopf);
      // Der Trabant wächst in die Mitte, das alte Foto schrumpft an seinen Platz
      const foto = knopf.querySelector(".trabant-foto");
      foto.style.viewTransitionName = "hauptkreis";
      mitte.style.viewTransitionName = "tauschkreis";
      const t = document.startViewTransition(() => {
        tausche(knopf);
        foto.style.viewTransitionName = "tauschkreis";
        mitte.style.viewTransitionName = "";
      });
      t.finished.finally(() => (foto.style.viewTransitionName = ""));
    });
  }

  /* ---------- Trittsteine: Gärten auseinanderschieben ---------- */

  for (const fig of document.querySelectorAll(".tritt")) {
    const regler = fig.querySelector(".tritt-regler");
    if (!regler) continue;
    const eingabe = regler.querySelector("input");
    const satz = regler.querySelector(".tritt-satz");
    const r = Number(fig.dataset.radius), B = Number(fig.dataset.breite), M = Number(fig.dataset.mitte), Y = 165;
    const gruppen = [...fig.querySelectorAll(".tritt-garten-gruppe")];
    const labels = [...fig.querySelectorAll(".tritt-label")];
    const flug = fig.querySelector(".tritt-flug");
    const linie = fig.querySelector(".tritt-mass-linie");
    const mass = fig.querySelector(".tritt-mass");
    let verbunden = null;
    const setze = () => {
      const d = Number(eingabe.value);
      const xs = [M - d, M, M + d];
      gruppen.forEach((g, i) => g.querySelectorAll("circle").forEach((c) => c.setAttribute("cx", xs[i])));
      labels.forEach((l, i) => (l.style.left = `${(xs[i] / B) * 100}%`));
      flug.setAttribute("d", `M${xs[0]} ${Y}C${M - d * 0.68} 112 ${M - d * 0.32} 112 ${M} ${Y}S${M + d * 0.68} 218 ${xs[2]} ${Y}`);
      linie.setAttribute("d", `M${xs[0]} 22H${xs[0] + r}M${xs[0]} 12v20M${xs[0] + r} 12v20`);
      mass.style.left = `${((xs[0] + r / 2) / B) * 100}%`;
      const nah = d <= r;
      fig.classList.toggle("luecke", !nah);
      eingabe.setAttribute("aria-valuetext", nah ? "nah genug" : "zu weit auseinander");
      if (nah !== verbunden) {
        verbunden = nah;
        satz.textContent = nah ? "Der nächste Garten liegt im Flugkreis: Er ist ein Trittstein." : "Der nächste Garten liegt außerhalb des Flugkreises: Hier fehlt ein Trittstein.";
      }
    };
    eingabe.addEventListener("input", setze);
    regler.hidden = false;
    setze();
  }
})();
