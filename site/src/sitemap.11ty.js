// Die Sitemap braucht vollständige Adressen; ohne site.url entsteht keine.
export const data = {
  permalink: (d) => (d.site.url ? "sitemap.xml" : false),
  eleventyExcludeFromCollections: true,
};

export function render({ site, collections }) {
  const seiten = collections.all.filter((s) => !s.data.noindex && s.url && (s.url.endsWith(".html") || s.url === "/"));
  const zeilen = seiten.map((s) => `  <url><loc>${site.url}${s.url}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${zeilen}\n</urlset>\n`;
}
