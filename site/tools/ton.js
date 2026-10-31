// Prüft alle gebauten Seiten gegen Sabines Wortliste (tools/ton.yml).
// Wörter aus "nie" lassen den Lauf scheitern, "bedacht" wird nur aufgelistet.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const liste = yaml.load(fs.readFileSync(new URL("ton.yml", import.meta.url), "utf8"));
const ordner = "_site";
const seiten = fs.readdirSync(ordner).filter((f) => f.endsWith(".html"));

function text(html) {
  const attribute = [...html.matchAll(/\s(?:alt|title|content|aria-label)="([^"]*)"/g)].map((m) => m[1]);
  const ausnahmen = [...html.matchAll(/<(\w+)[^>]*\sdata-ton-ok[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2].replace(/<[^>]+>/g, ""));
  const sichtbar = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<(\w+)[^>]*\sdata-ton-ok[^>]*>[\s\S]*?<\/\1>/g, " ")
    .replace(/<\/(p|li|h[1-6]|div|dd|dt|figcaption|blockquote|td|th)>/g, "\n")
    .replace(/<[^>]+>/g, " ");
  const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return { inhalt: decode(sichtbar + " " + attribute.join(" ")), ausnahmen };
}

function treffer(inhalt, eintrag) {
  const re = new RegExp(`(?<!\\p{L})(?:${eintrag.muster})`, "giu");
  return [...inhalt.matchAll(re)].map((m) => {
    const von = Math.max(0, m.index - 40);
    return "… " + inhalt.slice(von, m.index + m[0].length + 40).replace(/\s+/g, " ").trim() + " …";
  });
}

let fehler = 0;
const bedacht = [];
const erlaubt = [];
for (const seite of seiten) {
  const { inhalt, ausnahmen } = text(fs.readFileSync(path.join(ordner, seite), "utf8"));
  for (const e of liste.nie) {
    for (const t of treffer(inhalt, e)) {
      console.log(`NIE  ${seite}: „${e.wort}“  ${t}`);
      fehler++;
    }
  }
  for (const e of liste.bedacht) {
    for (const t of treffer(inhalt, e)) bedacht.push(`${seite}: „${e.wort}“  ${t}`);
  }
  for (const a of ausnahmen) erlaubt.push(`${seite}: ${a.trim()}`);
  // Anrede: Die Website duzt. Höfliche Anrede mitten im Satz ist verdächtig.
  for (const m of inhalt.matchAll(/(?<![.!?:]\s|^|\n\s*)\b(Ihnen|Ihre[mnrs]?)\b/g)) {
    console.log(`SIE  ${seite}: „${m[0]}“ – die Website duzt`);
  }
}

if (bedacht.length) {
  console.log(`\nMit Bedacht (${bedacht.length}), bitte einzeln entscheiden:`);
  bedacht.forEach((z) => console.log("  " + z));
}
if (erlaubt.length) {
  console.log(`\nAls Ausnahme markiert (data-ton-ok):`);
  erlaubt.forEach((z) => console.log("  " + z));
}
console.log(fehler ? `\n${fehler} Wörter aus „Nie“ gefunden.` : `\nTon: keine Wörter aus „Nie“ in ${seiten.length} Seiten.`);
process.exit(fehler ? 1 : 0);
