// Strukturierte Daten für Suchmaschinen (schema.org), nur mit Angaben, die
// in site.yml wirklich eingetragen sind.
import fs from "node:fs";
import yaml from "js-yaml";

export default function () {
  const site = yaml.load(fs.readFileSync("src/_data/site.yml", "utf8"));
  const daten = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.name,
    description:
      "Online-Begleitung für naturnahes Gärtnern: Garten, Balkon oder Gemeinschaftsgarten so gestalten, dass Wildbienen, Schmetterlinge und Vögel Wohnung und Nahrung finden.",
    founder: {
      "@type": "Person",
      name: site.person,
      jobTitle: "Tierärztin",
      memberOf: { "@type": "Organization", name: "Naturgarten e. V.", url: "https://naturgarten.org/" },
    },
    knowsAbout: ["Naturnaher Garten", "Wildbienen", "Schmetterlinge", "Biodiversität"],
  };
  if (site.url) daten.url = site.url + "/";
  if (site.email) daten.email = site.email;
  const a = site.anschrift || {};
  if (a.strasse && a.plz && a.ort) {
    daten.address = { "@type": "PostalAddress", streetAddress: a.strasse, postalCode: a.plz, addressLocality: a.ort, addressCountry: "DE" };
  }
  return daten;
}
