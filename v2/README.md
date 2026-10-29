# Bessere Welt ergärtnern – Version 2

Die ausgebaute zweite Fassung der Website. Version 1 liegt unverändert im
Hauptordner des Repos; v2 steht komplett für sich in diesem Ordner.

## Ansehen

```
python3 -m http.server 8000 --directory v2
```

und `http://localhost:8000` öffnen.

**Als einzelne Datei** (zum Verschicken, funktioniert offline per Doppelklick):

```
python3 v2/build.py
```

Das erzeugt `v2/dist/bessere-welt-ergaertnern.html` mit allen Schriften und
Bildern eingebettet (ca. 2,5 MB). Der Ordner `dist/` wird nicht eingecheckt.

## Was neu ist

- **Logo** (mögliche Version) im Kopf, im Fuß und auf „Über mich“ – freigestellt aus den hochgeladenen PNGs
- **Kreislauf-Motiv** aus dem Logo: offener Ring, Erdkugel, Fotos als „Trabanten“ – auf der Startseite, in jedem Seitenkopf und auf den Detailseiten (dort kreisen die Tiere um ihre Pflanze bzw. die Pflanzen um ihr Tier)
- **Pflanzen & Tiere**: Pflanzen-Finder (4 Fragen), Archiv mit Filtern und Suche, Blühkalender als Jahresrad, Detailseite für jede Pflanze und jedes Tier
- **Gartenjahr**: Zu jedem Monat drei Dinge, die man tun – oder lassen – kann (Startseite und Blühkalender)
- **Vorher/Nachher-Garten** zum Ziehen (gezeichnet, kein Foto nötig)
- **Journal** mit vier Beiträgen, Inhaltsverzeichnis und Querverweisen auf Pflanzen und Tiere
- **Angebot** mit Reitern für Privat / Schulen & Kitas / Unternehmen, Projekte, Fragen & Irrglauben, Kontaktformular

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | alle Seiten als Ansichten (`<div class="page" data-page="…">`) |
| `assets/js/data.js` | **alle Inhalte**: Kontakt-Einstellungen, Pflanzen, Tiere, Gartenjahr-Tipps, Journal |
| `assets/js/app.js` | Seitenwechsel und alle interaktiven Teile |
| `assets/css/style.css` | gesamtes Design (Farben aus dem Logo, Schriften Fraunces + Source Sans 3) |
| `assets/img/`, `assets/fonts/` | Bilder und selbst gehostete Schriften (keine Verbindung zu Google) |
| `build.py` | baut die Ein-Datei-Version |

Seitenadressen sind einfache Namen hinter `#`, z. B. `#ueber-mich`,
`#pflanze--moschusmalve`, `#tier--zitronenfalter`, `#angebot--schulen`,
`#artikel--liegen-lassen`.

**Neue Pflanze, neues Tier, neuer Beitrag:** in `data.js` einen bestehenden
Eintrag kopieren und anpassen. Welche Tiere eine Pflanze nutzt, steht nur bei
der Pflanze (`guests`); die Tierseiten finden ihre Pflanzen daraus von selbst.
Fotos kommen nach `assets/img/` und werden in `data.js` unter `img` eingetragen.

**Logo austauschen:** `assets/img/logo-icon.png` (nur Zeichen),
`assets/img/logo-full.png` (Zeichen mit Schriftzug) und die beiden
`favicon-*.png` ersetzen.

## Vor dem Livegang

1. **Kontakt:** In `data.js` die echte E-Mail-Adresse eintragen und
   `contactIsPlaceholder` auf `false` setzen; Region dort und die
   Telefonnummer in `index.html` ergänzen. Dann öffnet das Formular das
   E-Mail-Programm mit der fertigen Nachricht.
2. **Impressum und Datenschutz** mit echten Angaben füllen (Platzhalter sind markiert).
3. **Gartenbrief:** Die Anmeldung ist noch nicht an einen Newsletter-Dienst angebunden.
4. **Texte prüfen lassen:** Außer der Moschusmalve, „Über mich“ und den
   Werten sind die Texte Entwürfe in Sabines Ton – Journal, Fragen,
   Projekte, Pflanzen- und Tiertexte und die Gartenjahr-Tipps sollte sie
   durchsehen.
5. **Fotos:** Pflanzen und Tiere ohne eigenes Foto zeigen „Foto folgt“.
   Das Porträt ist nur 200 × 200 px groß; ein größeres wäre gut.
6. Eine englische Fassung gibt es noch nicht.
