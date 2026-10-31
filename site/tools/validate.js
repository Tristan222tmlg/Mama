// HTML-Prüfung mit dem Nu Html Checker, dem Prüfprogramm hinter
// validator.w3.org. Braucht Java.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import vnu from "vnu-jar";

const seiten = fs.readdirSync("_site").filter((f) => f.endsWith(".html")).map((f) => `_site/${f}`);
try {
  execFileSync("java", ["-jar", vnu, "--format", "text", "--Werror", ...seiten], { stdio: ["ignore", "inherit", "pipe"] });
  console.log(`HTML: ${seiten.length} Seiten ohne Fehler und ohne Warnungen.`);
} catch (e) {
  process.stderr.write(e.stderr?.toString() || String(e));
  process.exit(1);
}
