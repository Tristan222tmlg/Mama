---
layout: seite.njk
permalink: impressum.html
title: Impressum
description: Impressum der Website Bessere Welt ergärtnern von Dr. Sabine Schröder-Gravendyck.
abschluss: keiner
---

## Angaben nach § 5 DDG

{{ site.name_impressum }}<br>
{{ site.anschrift.strasse or "[[offen: Straße und Hausnummer]]" }}<br>
{{ site.anschrift.plz or "[[offen: Postleitzahl]]" }} {{ site.anschrift.ort or "[[offen: Ort]]" }}

## Kontakt

E-Mail: {% if site.email %}<a href="mailto:{{ site.email }}">{{ site.email }}</a>{% else %}[[offen: E-Mail-Adresse]]{% endif %}{% if site.telefon %}<br>
Telefon: {{ site.telefon }}{% endif %}

{% if site.ust_id -%}
## Umsatzsteuer

Umsatzsteuer-Identifikationsnummer nach § 27a Umsatzsteuergesetz: {{ site.ust_id }}
{%- elif not site.keine_ust_id -%}
## Umsatzsteuer

[[offen: Umsatzsteuer-ID, falls vorhanden]]
{%- endif %}

{% if site.tieraerztekammer -%}
## Berufsrechtliche Angaben

Berufsbezeichnung: Tierärztin, verliehen in Deutschland<br>
Zuständige Kammer: {{ site.tieraerztekammer }}
{%- endif %}

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

{{ site.name_impressum }}, Anschrift wie oben

## Fotos und Logo

Fotos: [[offen: alle von Sabine? Sonst Bildnachweis]]<br>
Logo: [[offen: Gestalterin und Nutzungsrechte]]
