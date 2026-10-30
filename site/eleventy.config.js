import path from "node:path";
import yaml from "js-yaml";
import Image from "@11ty/eleventy-img";
import { EleventyRenderPlugin } from "@11ty/eleventy";
import { beziehungsnetz, bluehkalender, bluehrad, kreisnetz, monatsband } from "./lib/grafiken.js";

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addDataExtension("yml", (inhalt) => yaml.load(inhalt));

  eleventyConfig.addPassthroughCopy({
    "src/assets/css": "assets/css",
    "src/assets/fonts": "assets/fonts",
    "src/assets/js": "assets/js",
    "src/assets/logo": "assets/logo",
    "src/assets/logo/favicon.svg": "favicon.svg",
    "src/statisch/.htaccess": ".htaccess",
    "src/statisch/favicon-32.png": "favicon-32.png",
    "src/statisch/apple-touch-icon.png": "apple-touch-icon.png",
    "src/statisch/teilen.jpg": "teilen.jpg",
  });
  if (process.env.VORSCHAU === "1") {
    eleventyConfig.addPassthroughCopy({ "src/assets/vorschau.js": "assets/vorschau.js" });
  }

  // Fotos: verkleinert, als WebP und JPEG, ohne Metadaten. Die Originale in
  // src/bilder/ werden nie direkt ausgeliefert, so gelangt kein Aufnahmeort ins Netz.
  eleventyConfig.addShortcode("foto", async function (datei, alt, groessen = "100vw", oben = false, breiten = [400, 800, 1200]) {
    // Pages CMS schreibt Bilder als "bilder/name.jpg"; hier zählt nur der Dateiname.
    const meta = await Image(path.join("src/bilder", datei.replace(/^\/?bilder\//, "")), {
      widths: breiten,
      formats: ["webp", "jpeg"],
      outputDir: "_site/bilder/",
      urlPath: "bilder/",
      sharpWebpOptions: { quality: 76 },
      sharpJpegOptions: { quality: 78, mozjpeg: true },
      filenameFormat: (id, src, breite, format) => `${path.parse(src).name}-${breite}.${format}`,
    });
    // Ein kleines Bild gibt es nur in einer Breite; dann ohne "sizes", sonst ist das HTML ungültig.
    return Image.generateHTML(meta, {
      alt,
      ...(meta.webp.length > 1 ? { sizes: groessen } : {}),
      loading: oben ? "eager" : "lazy",
      decoding: "async",
      ...(oben ? { fetchpriority: "high" } : {}),
    });
  });

  // Grafiken aus den Pflanzendaten (lib/grafiken.js)
  eleventyConfig.addFilter("monatsband", monatsband);
  eleventyConfig.addFilter("bluehkalender", bluehkalender);
  eleventyConfig.addFilter("beziehungsnetz", beziehungsnetz);
  eleventyConfig.addFilter("bluehrad", bluehrad);
  eleventyConfig.addFilter("kreisnetz", kreisnetz);

  // Symbole für die Trabanten: Tiergruppe und Art der Verbindung
  eleventyConfig.addFilter("tiergruppe", (name = "") => (/falter|bläuling/i.test(name) ? "butterfly" : "bee"));
  eleventyConfig.addFilter("artsymbol", (art) => ({ raupe: "caterpillar", nest: "nest" })[art] || "flower");
  // Plätze der Trabanten auf dem Ring (0 = oben, im Uhrzeigersinn in Achteln)
  eleventyConfig.addFilter("plaetze", (n) => ({ 1: [1], 2: [1, 5], 3: [7, 1, 4], 4: [7, 1, 3, 5] })[Math.min(n, 4)] || [1]);

  // nur den ersten Buchstaben groß ("sammelt Pollen" -> "Sammelt Pollen")
  eleventyConfig.addFilter("anfang", (text = "") => String(text).charAt(0).toUpperCase() + String(text).slice(1));

  // *Wörter* in Überschriften hervorheben, sonst nur reiner Text
  eleventyConfig.addFilter("betont", (text = "") =>
    String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*([^*]+)\*/g, '<em class="strich">$1</em>'));

  // "bilder/moschusmalve-steckbrief.jpg" -> "moschusmalve-steckbrief"
  eleventyConfig.addFilter("dateiname", (pfad) => path.parse(pfad).name);

  // [6, 10] -> "Juni bis Oktober"
  eleventyConfig.addFilter("monate", ([von, bis]) => (von === bis ? MONATE[von - 1] : `${MONATE[von - 1]} bis ${MONATE[bis - 1]}`));

  // 2026-10-30 -> "30. Oktober 2026"
  eleventyConfig.addFilter("datum", (wert) => {
    const d = new Date(wert);
    return `${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });

  eleventyConfig.addFilter("kuenftig", (termine = []) => {
    const heute = new Date().toISOString().slice(0, 10);
    return termine.filter((t) => String(t.datum) >= heute);
  });

  // Lücken, die vor dem Livegang gefüllt werden müssen, schreibt man als
  // [[offen: was fehlt]]. Sie erscheinen markiert auf der Seite, und
  // "npm run livegang" bricht ab, solange es noch welche gibt.
  eleventyConfig.addTransform("offen", function (inhalt) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) return inhalt;
    return inhalt.replace(/\[\[offen:\s*([^\]]+?)\]\]/g, '<mark class="offen">offen: $1</mark>');
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "11ty.js"],
  };
}
