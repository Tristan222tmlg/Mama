# Übergabe: Website „Bessere Welt ergärtnern“

Claude liest diese Datei zu Beginn jedes neuen Chats in diesem Repository. Sie
hält fest, was sonst nur im Chat stand: wer was will, was entschieden ist, was
abgelehnt wurde und was noch offen ist. Stand: 31. Oktober 2026. Neue
Entscheidungen hier nachtragen.

## Wer und was

- **Tristan** (der Nutzer) baut die Website für seine Mutter, **Dr. A. Sabine
  Schröder-Gravendyck**: Tierärztin, heute Begleiterin für naturnahes Gärtnern,
  Mitglied im Naturgarten e. V. Das Angebot heißt „Bessere Welt ergärtnern“.
  Sabine liefert Inhalte und gibt sie frei, Tristan reicht beides weiter.
- Tristan schreibt meist Deutsch, kurz und oft diktiert. Antworte in seiner
  Sprache. Er will Ergebnisse sehen, als Link oder als HTML-Datei, die in
  Safari aufgeht, nicht nur als Screenshot.
- **Nur online**, auf Sabines Wunsch: Gartenbrief (Newsletter), kostenloser
  Online-Abend (etwa 45 Minuten), Erstgespräch, Online-Begleitprogramm (sieben
  Wochen in einer Gruppe, zwei Live-Calls pro Woche). Keine Arbeit vor Ort und
  keine Angebote für Schulen, Kitas oder Firmen; deren Projekte stehen nur als
  Belege auf „Über mich“. **Keine Preise** auf der Website.
- Wunschkundschaft: Privatleute mit Garten, Balkon oder Gemeinschaftsgarten,
  die selbst gärtnern wollen. Gefunden werden soll die Seite über Themen wie
  Wildbienen und naturnahes Gärtnern, nicht über die Region.
- Anrede auf der Website: **du**.

## Wo was liegt

| Ort | Was |
| --- | --- |
| `site/` | **die aktuelle Website** (Eleventy). Technik, Prüfungen, Bearbeiten, Livegang: `site/README.md` |
| `v2/` | Prototyp vom 29.10.2026. Von dort stammen das Blütenrad und die Interaktivität, die Tristan am besten gefallen haben |
| Hauptordner (`index.html` usw.), `PROJECT-BRIEF.md` | Version 1 vom Juli 2026, **veraltet**, nicht als Vorlage nehmen |
| `docs/ki-slop-merkmale.md` | 100 Design-Muster, die die Website nicht haben soll |
| `site/tools/vorschau/` | Vorschau als Claude-Artifact (`vorschau.py`) oder als eine einzige HTML-Datei (`einzeldatei.py`) |

**Branch:** Bis PR #1 gemerged ist, liegt die ganze Arbeit nur auf
`claude/mothers-website-2hqaz9`; `main` enthält dann nur Version 1 und
hochgeladene Fotos. Fehlt `site/`, diesen Branch auschecken und dort
weiterarbeiten.

**Claude-Artifacts**, privat in Tristans claude.ai-Konto. Mit dem
Artifact-Werkzeug (`list`) über den Titel finden:

- „Website-Konzept Bessere Welt ergärtnern“: Persona, Positionierung, Angebote,
  Seitenplan, Tonalität, Pflanzen-Tier-Tabelle mit Quellen, rechtliche Hinweise
  zum Programm (Fernunterricht)
- „Recherche-Kit Bessere Welt ergärtnern“: Interview-Leitfaden für Sabine,
  Leitfaden für Kundengespräche, Liste des Rohmaterials
- „Bessere Welt ergärtnern – naturnah gärtnern, online begleitet“: Vorschau der
  aktuellen Website. Unter derselben Adresse neu veröffentlichen, dann bleibt
  der Link gültig, den Tristan schon hat
- „Bessere Welt ergärtnern v2“: Vorschau von v2
- „Logo-Ideen Bessere Welt ergärtnern“: Leinwand mit allen Logo-Runden

**Nicht im Repository**, aus Datenschutzgründen: Sabines Unterlagen (Vision und
Mission, Tonalität, Über-mich-Text, „Mein Warum“, Moschusmalven-Steckbrief,
Persona, Farben) und ihre Antworten vom 30.10.2026 (Word-Datei und Fotos).
Tristan hat sie im Chat hochgeladen. Was die Website daraus braucht, steht in
den Texten unter `site/src/` und im Konzept. Braucht es mehr, Tristan bitten,
sie noch einmal hochzuladen. Einige ältere Unterlagen entstanden mit einer
Web-Agentur, mit der Sabine nicht mehr zusammenarbeitet: nur Rohmaterial, die
Agentur nicht erwähnen.

## Regeln

1. **Nichts erfinden:** keine ausgedachten Projekte, Zitate, Zahlen, Termine
   oder Preise. Lücken als `[[offen: …]]` markieren (`npm run offen` listet
   sie). Jede Verbindung zwischen Pflanze und Tier braucht eine Quelle
   (`site/src/_data/pflanzen.yml`); Unbelegtes kennzeichnen.
2. **Sabines Worte:** Texte entstehen aus ihren Antworten. Ton: Fülle statt
   Mangel, ruhig, warm, ohne Dramatik; kein Krieg, kein Untergang, keine
   Schädlinge und Nützlinge. `npm run ton` prüft gegen die Wortliste
   `site/tools/ton.yml`.
3. **Freigabe:** Neue Texte von Claude, auch kleine Hinweise an den Grafiken,
   sind Vorschläge, bis Sabine sie freigibt. In der Antwort an Tristan
   auflisten.
4. **Das Repository ist öffentlich.** Nichts Privates hinein: keine
   Kundenmails, Aufnahmen oder Fotos mit Personen oder Kindern, keine Fotos mit
   GPS-Daten (`npm run bilder` prüft die Metadaten), keine privaten
   Kontaktdaten, keine Links zu den Artifacts. Kundenzitate nur ohne Namen,
   bis eine schriftliche Einwilligung vorliegt.
5. **Keine fremden Dienste:** keine Cookies, kein Tracking, keine CDNs,
   Schriften auf dem eigenen Server. Die Content-Security-Policy in
   `site/src/statisch/.htaccess` verbietet Inline-Skripte und
   `style`-Attribute.
6. **Git:** auf dem vorgegebenen Branch arbeiten, klare Commit-Nachrichten,
   pushen. Pull Requests nur auf Tristans Bitte. Logo-Entwürfe von der
   Design-Leinwand nur auf Bitte ins Repository.

## Gestaltung: was Tristan gesagt hat

Der Verlauf, damit nichts Abgelehntes wiederkommt:

- **Juli 2026, Version 1:** „komplettes Redesign … keine billigen Emojis,
  besser designen, moderner“, danach: Die Unterseiten „wirken noch sehr leer“.
- **29.10., Version 2 mit Logo:** bis heute Tristans Lieblingsdesign,
  „besonders dieses Blütending, dieser Kreis“.
- **29.10.:** „tiefer statt größer“. Daraus entstanden Recherche-Kit, Konzept
  und `site/`, gebaut aus Sabines Antworten.
- **30.10.:** Der Inhalt war genauer, das Design „ziemlich langweilig“. Auch
  die Fassung als Feldbuch reichte nicht. Tristan: Der Text stand nur auf der
  linken Seite und sah schlecht aus; er wollte „krasse Design-Sachen, richtig
  modern“ und „keine von diesen KI-Slop-Dingern“. Daraus wurde die Gestaltung
  „Kreislauf“: Kreise wie im Logo, volle Breite.
- **30.10. abends:** „andere Font, übersichtlicher, und die Darstellungen
  waren vorher interaktiv“. Seitdem Fraunces und Source Sans 3 wie in v2 und
  Grafiken zum Anfassen.

Daraus folgt:

- Die ganze Breite nutzen, nie alles in einer schmalen Spalte links.
- Grafiken interaktiv wie in v2 (Blütenrad, Netz, Pflanzen-Kreise,
  Foto-Trabanten, Trittstein-Regler), aber auch ohne JavaScript vollständig.
- Schriften nicht ohne Auftrag wechseln.
- Keine Emojis, keine Standard-Symbole, keine Muster aus
  `docs/ki-slop-merkmale.md`.
- „Bewegung reduzieren“ beachten; von 320 bis 1920 px Breite kein seitliches
  Scrollen.

## Logo (Stand 31.10.2026)

- Es gibt zwei Fassungen, beide nur als Bildschirmfoto und als SVG
  nachgezeichnet (`site/src/assets/logo/`, `site/tools/logo/vektor.py`): mit
  Frosch und Schriftzug (auf der Website) und mit Eidechse, Schmetterling und
  Wurzeln. Welche gilt, wer das Logo gestaltet hat und wo die Originaldatei
  ist, ist offen.
- Tristan will das Logo weniger komplex und detailreich, mit derselben
  Botschaft.
- Runde 1, stark vereinfachte Neuentwürfe: abgelehnt („viel zu stark
  vereinfacht“).
- Runde 2, behutsam aus den Originalformen: Es fehlten Tiere.
- Runde 3: **Alle Tiere bleiben**: Vogel, Frosch und der Schmetterling oben
  rechts, übernommen aus der Eidechsen-Fassung. Ruhiger wird nur das
  Drumherum. Stufen auf der Leinwand: R0 wie heute, R1 ohne die vielen kleinen
  Blätter, R2 Blätter nur noch am Baum, R3 drei Blätter oben, R4 ohne lose
  Blätter, R5 und R6 dasselbe mit Eidechse statt Frosch. Jede Stufe gibt es mit
  Verlauf, flach, einfarbig und negativ.
- Gebaut sind die Stufen aus den nachgezeichneten SVGs: Formgruppen (Vogel,
  Ring, Pflanze, lose Blätter) weglassen und den Schmetterling aus der
  Eidechsen-Fassung einsetzen.
- Empfehlung: R2 oder R3, dazu für 16 bis 32 px ein eigenes, einfacheres
  Zeichen (bisher `favicon.svg`: Erde, offener Ring, ein Blatt; nicht
  freigegeben).
- Nächster Schritt: Tristan wählt eine Stufe. Dann verfeinern und in `site/`
  einbauen.

## Stand und offene Punkte

- **30.10.2026:** alle Prüfungen bestanden, Einzelheiten in `site/README.md`.
- **`npm run offen`** listet 28 Lücken: Domain, E-Mail, Absender, Anschrift,
  Hoster, Videodienst, Versanddienst für den Gartenbrief, Impressum
  (Umsatzsteuer-ID, Bildnachweis, Gestalterin und Rechte am Logo), Datenschutz
  (rechtlich prüfen lassen), Erstgespräch (Dauer, Kosten), Programm
  (Starttermin, Gruppengröße, wie oft Coworking), Gartenbrief (wie oft,
  worüber).
- **Fertig ist die Website**, wenn (Tristans Vorgabe vom 29.10.):
  - Sabine jede Seite und jede Angabe freigegeben hat, auch die neuen
    Hinweistexte an den Grafiken und die Sätze am Trittstein-Regler;
  - eine unabhängige Wildbienen- oder Naturkundige die Pflanzen-Tier-Tabelle
    geprüft hat;
  - fünf Menschen aus Sabines Zielgruppen einen moderierten Aufgabentest
    bestanden haben;
  - axe keine ernsten Fehler zeigt, Lighthouse mobil mindestens 90 erreicht,
    der W3C-Validator nichts findet, es keine Anfragen an fremde Server gibt und
    Test-Mails aus den Formularen in Sabines Postfach ankommen;
  - Tristan eine Liste bekommt, was noch unbelegt ist und warum.
- **Außerdem offen:** schriftliche Einwilligung für das Kundenzitat (sonst
  bleibt es ohne Namen); das Programm vor dem Start rechtlich prüfen lassen
  (Fernunterricht, siehe Konzept); Sabines Antworten zu Block 7 des
  Interview-Leitfadens; die Kundengespräche aus dem Recherche-Kit; die Wahl
  beim Logo (oben).

## Arbeiten in der Cloud-Umgebung

- Bauen und prüfen: `site/README.md` (`npm run check`; Browser-Tests mit
  `site/tools/browser.cjs`, Ablauf im Dateikopf).
- Vor jedem Bauen `rm -rf site/_site`: Die Bildverarbeitung schreibt fest nach
  `_site/bilder/`, alte Dateien bleiben sonst liegen.
- Chromium liegt unter `/opt/pw-browsers/chromium` (für `CHROMIUM_PFAD` und
  Lighthouse).
- Vorschau für Tristan: `VORSCHAU=1 npx @11ty/eleventy`, dann
  `site/tools/vorschau/vorschau.py` (Artifact, unter derselben Adresse
  aktualisieren) oder `site/tools/vorschau/einzeldatei.py` (eine HTML-Datei von
  etwa 2 MB zum Verschicken). Aufruf jeweils im Dateikopf.
- Was nur im Container liegt (Notizen, Skripte, Screenshots), ist mit dem Ende
  der Sitzung weg. Wichtiges committen oder hier eintragen.
