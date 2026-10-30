// Listet alles, was vor dem Livegang noch fehlt: markierte Lücken
// ([[offen: …]]) in den gebauten Seiten und leere Pflichtfelder in site.yml.
// Mit --streng scheitert der Lauf, solange etwas offen ist.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const streng = process.argv.includes("--streng");
const site = yaml.load(fs.readFileSync("src/_data/site.yml", "utf8"));
const offen = [];

const pflicht = {
  url: "Adresse der Website",
  email: "E-Mail-Adresse",
  absender: "Absender der Formular-Mails",
  "anschrift.strasse": "Straße",
  "anschrift.plz": "Postleitzahl",
  "anschrift.ort": "Ort",
  hoster: "Hoster",
  videodienst: "Videodienst",
};
for (const [schluessel, name] of Object.entries(pflicht)) {
  const wert = schluessel.split(".").reduce((o, k) => (o || {})[k], site);
  if (!wert) offen.push(`site.yml: ${name} (${schluessel})`);
}
if (site.email && !/^[^\s@'"<>]+@[^\s@'"<>]+\.[a-z]{2,}$/i.test(site.email)) offen.push("site.yml: E-Mail-Adresse sieht ungültig aus");

for (const datei of fs.readdirSync("_site").filter((f) => f.endsWith(".html")).sort()) {
  const html = fs.readFileSync(path.join("_site", datei), "utf8");
  for (const m of html.matchAll(/<mark class="offen">offen: ([^<]+)<\/mark>/g)) offen.push(`${datei}: ${m[1]}`);
}

if (offen.length) {
  console.log(`Noch offen (${offen.length}):`);
  offen.forEach((z) => console.log("  " + z));
} else {
  console.log("Nichts mehr offen.");
}
process.exit(streng && offen.length ? 1 : 0);
