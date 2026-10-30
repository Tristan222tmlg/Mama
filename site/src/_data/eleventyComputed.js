export default {
  // Nur für den Formulartest (tools/browser.cjs): TESTPOSTFACH=adresse setzt
  // Empfänger und Absender, ohne site.yml zu ändern.
  site: (data) =>
    process.env.TESTPOSTFACH ? { ...data.site, email: process.env.TESTPOSTFACH, absender: process.env.TESTPOSTFACH } : data.site,
  // Link zur Startseite: "./" auf der Website, "index.html" in der Vorschau
  start: (data) => data.base || (data.build.vorschau ? "index.html" : "./"),
};
