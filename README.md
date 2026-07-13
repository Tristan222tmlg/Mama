# Bessere Welt ergärtnern — Website

Statische Website (reines HTML/CSS/JS, kein Build-Schritt nötig) für
Sabine Schröder-Gravendycks Biodiversitätsberatung.

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder z. B.:

```
python3 -m http.server 8000
```

und dann `http://localhost:8000` aufrufen.

## Struktur

- `index.html` — Startseite
- `ueber-mich.html` — Über mich / Werdegang
- `angebot.html` — Leistungen
- `pflanzenwelt.html` — Pflanzenporträts (bisher: Moschusmalve als Beispiel)
- `kontakt.html` — Kontakt
- `impressum.html`, `datenschutz.html` — rechtliche Pflichtseiten (Platzhalter)
- `assets/css/style.css` — gesamtes Design (Farbpalette: Grüntöne + Blau + Weiß, nach Sabines eigener Beschreibung)
- `assets/img/` — Bildmaterial

## Offene Punkte, bevor die Seite live gehen kann

1. **Echte Fotos.** Die im Chat eingefügten Bilder (Heckenskizze, Wiesenblumen,
   Akelei, Wildbiene) waren nur eingebettet, nicht als Datei-Uploads — sie
   liegen dem Projekt bisher nicht als Dateien vor. Bitte als Anhang
   (Upload) schicken, dann können sie die grau-gestreiften
   Platzhalter-Kästen ersetzen. Bisher ist nur ein echtes Bild eingebunden:
   das Moschusmalve-Pflanzenporträt aus der docx-Datei.
2. **Kontaktdaten.** E-Mail-Adresse, Telefonnummer und Einzugsgebiet in
   `kontakt.html` sind Platzhalter.
3. **Impressum/Datenschutz.** Rechtlich in Deutschland Pflicht — beide
   Seiten sind bewusst als Platzhalter markiert und müssen mit echten
   Angaben (Anschrift, ggf. USt-IdNr., Hosting-Anbieter) gefüllt werden.
4. **Kontaktformular.** Sendet aktuell noch keine Mails. Braucht entweder
   einen Formular-Dienst (z. B. Formspree, Netlify Forms) oder ein kleines
   Backend. Der „Jetzt schreiben“-Button daneben funktioniert schon als
   mailto-Link.
5. **Domain-Entscheidung.** In den Dokumenten tauchten zwei Namen auf:
   „Bessere Welt ergärtnern“ (aktueller Name, hier verwendet) und
   „florafauna.pro“ (ältere Domain). Falls florafauna.pro weiterleben soll,
   ggf. als Weiterleitung einrichten.
6. **Weitere Pflanzenporträts.** Das Format (Steckbrief-Icons + Foto +
   Insekten-Bezug) ist als Content-Vorlage etabliert — weitere folgen, sobald
   mehr Material da ist.
