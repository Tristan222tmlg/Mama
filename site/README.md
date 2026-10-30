# Bessere Welt ergärtnern – die Website

Die Website von Dr. Sabine Schröder-Gravendyck, gebaut mit
[Eleventy](https://www.11ty.dev/) aus Sabines eigenen Antworten vom
30. Oktober 2026. Grundlage ist das Konzept-Dokument („Website-Konzept
Bessere Welt ergärtnern“): Positionierung, Angebote, Seitenplan, Wortliste
und die Pflanzen-Tier-Tabelle mit Quellen.

Kleiner als der Prototyp in `v2/`, dafür mit echten Adressen, ohne Cookies,
ohne fremde Dienste und mit nur einem kleinen Skript für die Grafiken.

**Gestaltung „Kreislauf“:** Alles kreist, wie im Logo: Erdkugel und offener
Ring, dazu Fotos als Trabanten, die langsam um das große Foto ziehen. Die
Seiten nutzen die ganze Breite: Überschrift links, Text rechts, die Pflanzen
als Doppelseiten im Wechsel. Die Grafiken zeigen echte Daten aus
`src/_data/pflanzen.yml` und den Antworten: das runde Netz der belegten
Verbindungen, das Blüten-Jahresrad (beim Öffnen steht es auf dem aktuellen
Monat), jede Pflanze mit ihren Tieren als Trabanten, die sieben Programmwochen,
die Flugradien der Trittsteine, die Dreiviertelstunde des Online-Abends. Sie
entstehen beim Bauen (`lib/grafiken.js`, `src/_includes/teile/`) und zeigen
auch ohne JavaScript alles.

**Zum Anfassen** (`src/assets/js/grafik.js`, wie in Version 2): Im Blütenrad
wählt man einen Monat direkt im Rad oder mit den Knöpfen; ein Bogen zeigt beim
Darüberfahren seine Pflanze, ein Klick führt zu ihr. Im Netz leuchten die
Verbindungen einer Pflanze, eines Tiers oder einer Linie auf, darunter steht,
wer was nutzt; auf dem Handy reicht Antippen. Bei jeder Pflanze zeigt der
Kreis, was ein Tier an ihr tut, und hebt den Eintrag mit der Quelle hervor. Auf
der Startseite holt ein Klick auf einen Trabanten sein Foto in die Mitte, und
mit dem Regler bei den Trittsteinen lassen sich die Gärten auseinanderschieben.

Moderne Browser-Technik, ohne Bibliotheken: das Menü als Popover, weiche
Übergänge zwischen den Seiten (View Transitions, der Kreis wandert mit), Text,
der um den Kreis fließt (`shape-outside`), ein Rad, das sich beim Scrollen
eindreht. Wer in seinem Gerät „Bewegung reduzieren“ eingestellt hat, sieht
alles ruhig. Schriften wie in Version 2: Fraunces für Überschriften (kursiv wie
der Schriftzug im Logo) und Source Sans 3 für den Text. Beide unter der SIL Open
Font License, auf dem eigenen Server.

| Seite | Datei | Inhalt |
| --- | --- | --- |
| `/` | `src/index.md` | Wofür Sabine steht, das Programm, Gartenbrief und Online-Abend |
| `/online-programm.html` | `src/online-programm.md` | Ablauf, Inhalte, für wen, Erstgespräch |
| `/online-abend.html` | `src/online-abend.njk` | der kostenlose Abend, Termine, Anmeldung |
| `/ueber-mich.html` | `src/ueber-mich.md` | Tierärztin, Projekte, Naturgarten e. V. |
| `/pflanzen-und-tiere.html` | `src/_data/pflanzen.yml` | nur belegte Verbindungen, jede mit Quelle |
| `/fragen.html` | `src/_data/fragen.yml` | Sabines Antworten |
| `/kontakt.html` | `src/kontakt.njk` | Gartenbrief und Nachricht |
| Impressum, Datenschutz | `src/impressum.md`, `src/datenschutz.md` | Angaben aus `src/_data/site.yml` |

## Bearbeiten

**Für Sabine, im Browser:** Mit [Pages CMS](https://pagescms.org) und dem
GitHub-Konto anmelden und dieses Repository wählen. Dort lassen sich
Startseite, Programm, Über mich, Termine, Fragen, Pflanzen und die
Einstellungen bearbeiten. Die Einrichtung steht in `../.pages.yml`. Jede
Änderung wird gespeichert, geprüft und, sobald das Hochladen eingerichtet
ist, veröffentlicht (`../.github/workflows/website.yml`).

**Lücken markieren:** Was noch fehlt, schreibt man als `[[offen: was fehlt]]`.
Es erscheint gelb markiert auf der Seite und in `npm run offen`.

**Fotos:** In `src/bilder/` ablegen. Die Website liefert nur verkleinerte
Fassungen ohne Metadaten aus. Die Originale sollten trotzdem keine enthalten,
weil Handyfotos den Aufnahmeort speichern: `npm run bilder` prüft das.

## Bauen und prüfen

```
npm install
npm start          # Vorschau unter http://localhost:8080 (Formulare brauchen PHP, siehe unten)
npm run check      # bauen und prüfen
npm run livegang   # wie check, scheitert aber, solange etwas offen ist
```

`npm run check` baut die Seite nach `_site/` und prüft:

- **Ton** (`tools/ton.js`): Kein Wort aus der Spalte „Nie“ der Wortliste
  (`tools/ton.yml`), Wörter aus „Nur mit Bedacht“ werden aufgelistet.
- **HTML** (`tools/validate.js`): Nu Html Checker, das Programm hinter
  validator.w3.org. Fehler und Warnungen lassen den Lauf scheitern. Braucht Java.
- **Bilder** (`tools/bilder.js`): keine Metadaten.
- **Offen** (`tools/offen.js`): Liste aller Lücken.

Im Browser (`tools/browser.cjs`, braucht Playwright und PHP, Ablauf im
Dateikopf): axe für Barrierefreiheit, keine Anfragen an fremde Server, alle
internen Links und Sprungmarken, die drei Formulare bis zur E-Mail, die Falle
für Programme, ungültige Eingaben, kein seitliches Scrollen bei 320 und 390 px
Breite, der Sprunglink als erster Tab-Schritt.

**Stand 30. Oktober 2026:** alles bestanden. axe: keine Verstöße auf 12 Seiten.
Kein seitliches Scrollen von 320 bis 1920 px Breite.
Lighthouse mobil (13.5.0, lokal, ohne Komprimierung): Leistung 94–99,
Barrierefreiheit, Best Practices und SEO je 100 auf allen 9 Hauptseiten. Ob die Formular-Mails
in Sabines echtem Postfach ankommen, lässt sich erst auf dem Webspace testen.

**Vorschau ohne Server:** `VORSCHAU=1 npx eleventy` baut eine Fassung, deren
Formulare nichts abschicken.

## Formulare

`src/formular.njk` wird zu `formular.php`. Es nimmt Nachricht,
Gartenbrief-Anmeldung und Online-Abend-Anmeldung entgegen und schickt sie mit
PHP `mail()` an die Adresse aus `site.yml`. Auf dem Server wird nichts
gespeichert. Gegen Programme gibt es ein unsichtbares Feld, gegen
eingeschleuste Kopfzeilen eine Prüfung der Adresse.

Für den Gartenbrief gibt es noch keinen Versanddienst. Bis dahin kommen
Anmeldungen als E-Mail bei Sabine an. Sie bestätigt sie per Mail
(Double-Opt-in) und nimmt die Adresse erst danach auf.

## Online stellen

1. **Webspace in der EU mit PHP und SSH**, z. B. bei einem deutschen
   Webhoster. Die `.htaccess` (Weiterleitungen, 404-Seite, Sicherheitsregeln,
   nur HTTPS) gilt für Apache, das bei den meisten deutschen Webhostern läuft.
2. In `src/_data/site.yml` Adresse, E-Mail, Absender (eine Adresse auf der
   eigenen Domain, sonst landen die Mails im Spam), Anschrift, Hoster und
   Videodienst eintragen.
3. `npm run livegang` muss durchlaufen.
4. In den GitHub-Einstellungen die Secrets `DEPLOY_ZIEL`, `DEPLOY_SSH_KEY` und
   `DEPLOY_KNOWN_HOSTS` anlegen. Dann lädt jede Änderung auf `main` die Seite hoch.
5. Auf der fertigen Seite alle drei Formulare einmal abschicken und prüfen,
   dass die Mails ankommen.

## Logo

`tools/logo/vektor.py` zeichnet die beiden Bildschirmfotos des Logos als SVG
nach (`src/assets/logo/`): mit Schriftzug, nur das Zeichen, in einer Farbe,
hell für dunkle Flächen. Das ist eine Übergangslösung, bis die Originaldatei
vorliegt.

**Test bei 16 px:** Das Zeichen ist bei 16 px nicht mehr zu erkennen, erst ab
etwa 48 px. Für Browser-Tabs gibt es deshalb ein vereinfachtes Zeichen
(`favicon.svg`: Erde, offener Ring, ein Blatt), ein Vorschlag, den Sabine
freigeben muss. **In einer Farbe** funktioniert das Zeichen ab 48 px, weil die
Erdkugel eine schmale Lücke um die Pflanze bekommt. Auf dunklem Grund braucht
es die helle Fassung.

Es gibt zwei Fassungen des Logos: mit Frosch und Schriftzug, und mit
Eidechse, Schmetterling und Wurzeln. Die Website nutzt die mit Frosch. Welche
gilt, ist noch offen.

## Datenschutz im Repository

Keine Kundenmails, Aufnahmen oder Fotos mit Personen ins Repository. Zitate
von Kundinnen und Kunden nur ohne Namen, solange keine schriftliche
Einwilligung vorliegt.
