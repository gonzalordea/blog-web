// routes/seo.js
// robots.txt, sitemap.xml y rss.xml, generados dinámicamente para que la
// URL del sitio siempre sea correcta (local, Railway, o un dominio propio).

const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Escapa texto para que se pueda meter dentro de XML sin romperlo (titulos
// o resumenes con "&", "<", comillas, etc.)
function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/robots.txt", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;

  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${urlBase}/sitemap.xml\n`
  );
});

router.get("/sitemap.xml", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;
  const posts = db
    .prepare("SELECT id, fecha_creacion FROM posts WHERE estado = 'publicado' ORDER BY fecha_creacion DESC")
    .all();
  // Solo se listan categorias que tengan al menos un articulo publicado:
  // una pagina de categoria vacia no aporta nada a un rastreador.
  const categorias = db
    .prepare(
      `SELECT DISTINCT categorias.slug AS slug
       FROM categorias
       JOIN posts ON posts.categoria_id = categorias.id
       WHERE posts.estado = 'publicado' AND categorias.slug IS NOT NULL`
    )
    .all();

  const urls = [
    `<url><loc>${urlBase}/</loc><changefreq>daily</changefreq></url>`,
    ...categorias.map(
      (categoria) => `<url><loc>${urlBase}/categoria/${categoria.slug}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...posts.map((post) => {
      const fecha = post.fecha_creacion.slice(0, 10); // "YYYY-MM-DD"
      return `<url><loc>${urlBase}/post/${post.id}</loc><lastmod>${fecha}</lastmod><changefreq>monthly</changefreq></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.type("application/xml").send(xml);
});

// Feed RSS: los ultimos articulos publicados, para quien quiera seguir el
// blog desde un lector de RSS en vez de (o ademas de) redes sociales.
router.get("/rss.xml", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;
  const posts = db
    .prepare(
      `SELECT id, titulo, resumen, fecha_creacion
       FROM posts
       WHERE estado = 'publicado'
       ORDER BY fecha_creacion DESC
       LIMIT 20`
    )
    .all();

  const items = posts
    .map((post) => {
      const link = `${urlBase}/post/${post.id}`;
      const fechaRfc822 = new Date(post.fecha_creacion.replace(" ", "T")).toUTCString();
      return [
        "<item>",
        `<title>${escaparXml(post.titulo)}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="true">${link}</guid>`,
        `<pubDate>${fechaRfc822}</pubDate>`,
        `<description>${escaparXml(post.resumen)}</description>`,
        "</item>",
      ].join("");
    })
    .join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0">\n' +
    "<channel>\n" +
    "<title>Blog Dev</title>\n" +
    `<link>${urlBase}</link>\n` +
    "<description>Notas y recursos sobre desarrollo web: cursos, herramientas y opiniones.</description>\n" +
    "<language>es</language>\n" +
    items +
    "\n</channel>\n</rss>";

  res.type("application/rss+xml").send(xml);
});

module.exports = router;
