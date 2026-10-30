// Blüten-Jahresrad und Beziehungsnetz zum Anfassen. Ohne dieses Skript zeigen
// beide alles auf einmal; mit ihm lässt sich ein Monat wählen, und im Netz hebt
// ein Tier oder eine Pflanze unter dem Mauszeiger die eigenen Verbindungen hervor.
(() => {
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  // Ein Monat ist ein Zwölftel des Rades, 0 Grad oben, im Uhrzeigersinn (wie lib/grafiken.js)
  const C = 200, INNEN = 60, AUSSEN = 194;
  const punkt = (r, grad) => {
    const w = ((grad - 90) * Math.PI) / 180;
    return [C + r * Math.cos(w), C + r * Math.sin(w)].map((n) => Math.round(n * 100) / 100);
  };
  const keil = (m) => {
    const [a1, b1] = punkt(AUSSEN, (m - 1) * 30), [a2, b2] = punkt(AUSSEN, m * 30);
    const [i2, j2] = punkt(INNEN, m * 30), [i1, j1] = punkt(INNEN, (m - 1) * 30);
    return `M${a1} ${b1}A${AUSSEN} ${AUSSEN} 0 0 1 ${a2} ${b2}L${i2} ${j2}A${INNEN} ${INNEN} 0 0 0 ${i1} ${j1}Z`;
  };

  for (const teil of document.querySelectorAll(".radteil")) {
    const knoepfe = teil.querySelector(".rad-knoepfe");
    const boegen = [...teil.querySelectorAll(".rad-bogen")];
    const zeilen = [...teil.querySelectorAll(".rad-liste li")];
    const monate = [...teil.querySelectorAll(".rad-monat")];
    const flaeche = teil.querySelector(".rad-keil");
    const titel = teil.querySelector("[data-rad-monat]");
    const zahl = teil.querySelector("[data-rad-zahl]");
    const ansage = teil.querySelector("[data-rad-ansage]");
    const jahr = [titel.textContent, zahl.textContent];
    const blueht = (el, m) => m >= Number(el.dataset.von) && m <= Number(el.dataset.bis);
    const naechster = (m) => {
      for (let i = 1; i < 12; i++) {
        const k = ((m - 1 + i) % 12) + 1;
        if (zeilen.some((z) => blueht(z, k))) return k;
      }
      return 0;
    };

    const zeige = (m, ansagen) => {
      for (const b of knoepfe.querySelectorAll("button")) b.setAttribute("aria-pressed", String(Number(b.dataset.monat) === m));
      monate.forEach((t, i) => t.classList.toggle("jetzt", i + 1 === m));
      flaeche.setAttribute("d", m ? keil(m) : "");
      teil.classList.toggle("gewaehlt", Boolean(m));
      for (const el of [...boegen, ...zeilen]) el.classList.toggle("aus", Boolean(m) && !blueht(el, m));
      const namen = m ? zeilen.filter((z) => blueht(z, m)).map((z) => z.querySelector(".rad-name").textContent) : [];
      if (!m) {
        [titel.textContent, zahl.textContent] = jahr;
      } else {
        titel.textContent = MONATE[m - 1];
        const ab = naechster(m);
        zahl.textContent = namen.length === 0 ? `Keine blüht, ab ${MONATE[ab - 1]} wieder` : namen.length === 1 ? "Eine Pflanze blüht" : `${namen.length} Pflanzen blühen`;
      }
      if (ansagen && ansage) ansage.textContent = m ? `${MONATE[m - 1]}: ${namen.length ? namen.join(", ") : "keine dieser Pflanzen blüht"}.` : "Das ganze Jahr.";
    };

    knoepfe.hidden = false;
    knoepfe.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-monat]");
      if (b) zeige(b.getAttribute("aria-pressed") === "true" ? 0 : Number(b.dataset.monat), true);
    });
    zeige(new Date().getMonth() + 1, false);
  }

  for (const netz of document.querySelectorAll(".kreisnetz")) {
    const kanten = [...netz.querySelectorAll(".kante")];
    const etiketten = [...netz.querySelectorAll(".netz-etikett")];
    const schluessel = (el) => ("l" in el.dataset ? `l${el.dataset.l}` : `t${el.dataset.t}`);
    const ruhe = () => {
      netz.classList.remove("hervor");
      for (const el of [...kanten, ...etiketten]) el.classList.remove("an");
    };
    for (const e of etiketten) {
      e.addEventListener("pointerenter", () => {
        const seite = "l" in e.dataset ? "l" : "t";
        const gegen = seite === "l" ? "t" : "l";
        const treffer = kanten.filter((k) => k.dataset[seite] === e.dataset[seite]);
        const partner = new Set(treffer.map((k) => gegen + k.dataset[gegen]));
        netz.classList.add("hervor");
        for (const k of kanten) k.classList.toggle("an", treffer.includes(k));
        for (const x of etiketten) x.classList.toggle("an", x === e || partner.has(schluessel(x)));
      });
      e.addEventListener("pointerleave", ruhe);
    }
  }
})();
