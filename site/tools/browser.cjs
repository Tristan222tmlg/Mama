// Prüft die gebaute Website im Browser:
//   1. Barrierefreiheit mit axe (keine schweren oder kritischen Fehler)
//   2. keine Anfragen an fremde Server
//   3. alle internen Links und Sprungmarken erreichbar
//   4. die drei Formulare kommen als E-Mail an, die Falle für Programme greift
//   5. kein seitliches Scrollen auf schmalen Handys
//
// Vorbereitung (einmalig):  npm i --no-save playwright && npx playwright install chromium
// Ablauf:
//   TESTPOSTFACH=test@example.org npm run build
//   php -d sendmail_path="$PWD/tools/testpost.sh" -S 127.0.0.1:8300 -t _site
//   node tools/browser.cjs http://127.0.0.1:8300/
// Die Test-Mails landen in tools/testpost/. Danach normal neu bauen.

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASIS = process.argv[2] || "http://127.0.0.1:8300/";
const POST = path.join(__dirname, "testpost");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const SEITEN = fs.readdirSync(path.join(__dirname, "..", "_site")).filter((f) => f.endsWith(".html") && f !== "404.html");

const fehler = [];
const notiz = (z) => console.log(z);
const fehlt = (z) => { fehler.push(z); console.log("FEHLER " + z); };

function mails() {
  return fs.existsSync(POST) ? fs.readdirSync(POST).filter((f) => f.endsWith(".eml")).sort() : [];
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const herkunft = new URL(BASIS).origin;
  const fremd = new Set();
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("data:") && new URL(u).origin !== herkunft) fremd.add(u);
  });

  // 1 und 2: axe und Anfragen
  const links = new Set();
  for (const s of SEITEN) {
    await page.goto(BASIS + s, { waitUntil: "networkidle" });
    // alle Bilder laden lassen (sie laden erst beim Hinscrollen)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    });
    await page.waitForLoadState("networkidle");
    await page.addScriptTag({ content: AXE });
    const ergebnis = await page.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }));
    const schwer = ergebnis.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    const leicht = ergebnis.violations.filter((v) => !["serious", "critical"].includes(v.impact));
    schwer.forEach((v) => fehlt(`axe ${s}: ${v.id} (${v.impact}) – ${v.nodes.length}× – ${v.help}`));
    leicht.forEach((v) => notiz(`axe ${s}: ${v.id} (${v.impact}) – ${v.nodes.length}× – ${v.help}`));
    for (const href of await page.$$eval("a[href]", (as) => as.map((a) => a.href))) links.add(href);
  }
  if (fremd.size) [...fremd].forEach((u) => fehlt(`fremde Anfrage: ${u}`));
  else notiz(`Anfragen: ${SEITEN.length} Seiten, nur eigener Server.`);

  // 3: Links
  let geprueft = 0;
  for (const href of links) {
    const u = new URL(href);
    if (u.origin !== herkunft || u.protocol === "mailto:") continue;
    geprueft++;
    const antwort = await fetch(u.origin + u.pathname);
    if (antwort.status !== 200) { fehlt(`Link ${href}: ${antwort.status}`); continue; }
    if (u.hash) {
      const html = await antwort.text();
      if (!html.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)) fehlt(`Sprungmarke fehlt: ${href}`);
    }
  }
  notiz(`Links: ${geprueft} interne Links geprüft.`);
  const nicht = await fetch(BASIS + "gibt-es-nicht.html");
  if (nicht.status !== 404) fehlt(`unbekannte Adresse liefert ${nicht.status} statt 404`);

  // 4: Formulare
  const vorher = mails().length;
  const versuche = [
    { seite: "kontakt.html", form: 'form:has(input[value="kontakt"])', felder: { "#k-name": "Testperson Kontakt", "#k-email": "kontakt@example.org", "#k-nachricht": "Eine Testnachricht mit Umlauten: Wegwarte, Größe, Blüte." }, ziel: "danke.html" },
    { seite: "kontakt.html", form: 'form:has(input[value="gartenbrief"])', felder: { "#kgb-email": "gartenbrief@example.org", "#kgb-name": "Bärbel" }, ziel: "gartenbrief-danke.html" },
    { seite: "online-abend.html", form: 'form:has(input[value="abend"])', felder: { "#ab-name": "Testperson Abend", "#ab-email": "abend@example.org" }, ziel: "abend-danke.html" },
  ];
  for (const v of versuche) {
    await page.goto(BASIS + v.seite);
    for (const [feld, wert] of Object.entries(v.felder)) await page.fill(feld, wert);
    await Promise.all([page.waitForNavigation(), page.click(`${v.form} button[type="submit"]`)]);
    if (!page.url().endsWith(v.ziel)) fehlt(`Formular ${v.form}: landet auf ${page.url()} statt ${v.ziel}`);
  }
  const neu = mails().slice(vorher);
  if (neu.length !== 3) fehlt(`Formulare: ${neu.length} statt 3 Mails`);
  for (const f of neu) {
    const mail = fs.readFileSync(path.join(POST, f), "utf8");
    const betreff = (mail.match(/^Subject: (.*)$/m) || [])[1] || "";
    const antwortAn = (mail.match(/^Reply-To: (.*)$/m) || [])[1] || "";
    notiz(`Mail ${f}: Betreff ${betreff} | Antwort an ${antwortAn}`);
    if (!/^To: test@example\.org/m.test(mail)) fehlt(`Mail ${f}: falscher Empfänger`);
    if (!antwortAn.endsWith("@example.org")) fehlt(`Mail ${f}: Antwortadresse fehlt`);
  }

  // Falle: ausgefülltes unsichtbares Feld -> Weiterleitung, aber keine Mail
  const vorFalle = mails().length;
  const falle = await fetch(BASIS + "formular.php", {
    method: "POST", redirect: "manual",
    body: new URLSearchParams({ formular: "kontakt", name: "Programm", email: "bot@example.org", nachricht: "x", website: "http://spam.example" }),
  });
  if (falle.status !== 303 || mails().length !== vorFalle) fehlt("Falle für Programme greift nicht");
  // Kopfzeilen-Einschleusung und fehlende Angaben
  const boese = await fetch(BASIS + "formular.php", {
    method: "POST", redirect: "manual",
    body: new URLSearchParams({ formular: "kontakt", name: "x", email: "a@example.org\r\nBcc: opfer@example.org", nachricht: "x" }),
  });
  if (boese.status !== 400) fehlt(`ungültige Adresse mit Zeilenumbruch: ${boese.status} statt 400`);
  const leer = await fetch(BASIS + "formular.php", { method: "POST", redirect: "manual", body: new URLSearchParams({ formular: "kontakt" }) });
  if (leer.status !== 400) fehlt(`leeres Formular: ${leer.status} statt 400`);
  notiz(`Formulare: ${neu.length} Mails angekommen, Falle und Prüfungen getestet.`);

  // 5: schmale Bildschirme
  for (const breite of [320, 390]) {
    const p = await browser.newPage({ viewport: { width: breite, height: 800 } });
    for (const s of SEITEN) {
      await p.goto(BASIS + s);
      const ueber = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ueber > 0) fehlt(`${s} bei ${breite} px: ${ueber} px zu breit`);
    }
    await p.close();
  }

  // Tastatur: Der erste Tab-Schritt führt zum Sprunglink
  await page.goto(BASIS);
  await page.keyboard.press("Tab");
  const erster = await page.evaluate(() => document.activeElement.textContent.trim());
  if (erster !== "Zum Inhalt") fehlt(`erster Tab-Schritt: „${erster}“`);

  await browser.close();
  console.log(fehler.length ? `\n${fehler.length} Fehler.` : "\nAlles bestanden.");
  process.exit(fehler.length ? 1 : 0);
})();
