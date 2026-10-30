// Fotos dürfen keine Metadaten enthalten: Handyfotos speichern oft den
// Aufnahmeort, also Sabines Adresse. Geprüft werden die Originale in
// src/bilder/ und alles, was im fertigen Ordner _site/ liegt.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ordner = ["src/bilder", "_site/bilder", "_site"];
const endungen = /\.(jpe?g|png|webp|avif|tiff?)$/i;
let fehler = 0;
let anzahl = 0;
for (const o of ordner) {
  if (!fs.existsSync(o)) continue;
  for (const datei of fs.readdirSync(o).filter((f) => endungen.test(f))) {
    const meta = await sharp(path.join(o, datei)).metadata();
    anzahl++;
    if (meta.exif || meta.xmp || meta.iptc) {
      console.log(`Metadaten in ${o}/${datei}: ${["exif", "xmp", "iptc"].filter((k) => meta[k]).join(", ")}`);
      fehler++;
    }
  }
}
console.log(fehler ? `\n${fehler} Bilder mit Metadaten. Entfernen, z. B.: convert bild.jpg -strip bild.jpg` : `Bilder: ${anzahl} geprüft, keine Metadaten.`);
process.exit(fehler ? 1 : 0);
