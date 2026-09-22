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
    .prepare("SELECT id, slug, fecha_creacion FROM posts WHERE estado = 'publicado' ORDER BY fecha_creacion DESC")
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
    `<url><loc>${urlBase}/sobre</loc><changefreq>monthly</changefreq></url>`,
    `<url><loc>${urlBase}/contacto</loc><changefreq>yearly</changefreq></url>`,
    `<url><loc>${urlBase}/privacidad</loc><changefreq>yearly</changefreq></url>`,
    `<url><loc>${urlBase}/cookies</loc><changefreq>yearly</changefreq></url>`,
    `<url><loc>${urlBase}/json</loc><changefreq>monthly</changefreq></url>`,
    ...categorias.map(
      (categoria) => `<url><loc>${urlBase}/categoria/${categoria.slug}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...posts.map((post) => {
      const fecha = post.fecha_creacion.slice(0, 10); // "YYYY-MM-DD"
      return `<url><loc>${urlBase}/post/${post.slug}</loc><lastmod>${fecha}</lastmod><changefreq>monthly</changefreq></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.type("application/xml").send(xml);
});

// Hoja de estilo del feed RSS: sin esto, si alguien abre /rss.xml directamente
// en el navegador (en vez de pegarlo en un lector de RSS como Feedly), solo ve
// las etiquetas XML en crudo, lo cual da mala impresion aunque el feed en si
// sea correcto. Con esta hoja XSLT, el propio navegador la aplica y muestra
// una pagina normal explicando que es un feed y listando los articulos.
// Los lectores de RSS de verdad ignoran esta linea y leen el XML tal cual.
const xslFeed = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/rss/channel">
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title><xsl:value-of select="title"/> — Feed RSS</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.5; }
  .aviso { background: #f4f4f8; border: 1px solid #dcdce6; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; font-size: 0.95em; }
  .aviso code { background: #e8e8f0; padding: 2px 6px; border-radius: 4px; word-break: break-all; }
  h1 { margin-bottom: 4px; }
  .descripcion { color: #555; margin-top: 0; }
  ul { list-style: none; padding: 0; }
  li { padding: 16px 0; border-bottom: 1px solid #e5e5ea; }
  li a { font-size: 1.1em; font-weight: 600; text-decoration: none; color: #2f5de3; }
  li a:hover { text-decoration: underline; }
  .fecha { color: #888; font-size: 0.85em; }
  .resumen { color: #444; margin: 6px 0 0; }
  a.volver { display: inline-block; margin-top: 24px; color: #2f5de3; text-decoration: none; }
  a.volver:hover { text-decoration: underline; }
</style>
</head>
<body>
  <div class="aviso">
    Esto es un <strong>feed RSS</strong>, no una pagina normal del blog. Sirve para que un lector de RSS (como Feedly o Inoreader) avise automaticamente de los articulos nuevos. Para suscribirte, copia esta direccion en tu lector: <code><xsl:value-of select="concat(link, '/rss.xml')"/></code>
  </div>
  <h1><xsl:value-of select="title"/></h1>
  <p class="descripcion"><xsl:value-of select="description"/></p>
  <ul>
    <xsl:for-each select="item">
      <li>
        <a href="{link}"><xsl:value-of select="title"/></a><br/>
        <span class="fecha"><xsl:value-of select="pubDate"/></span>
        <p class="resumen"><xsl:value-of select="description"/></p>
      </li>
    </xsl:for-each>
  </ul>
  <a class="volver" href="{link}">&#8592; Volver al blog</a>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
`;

router.get("/rss-style.xsl", (req, res) => {
  res.type("text/xml").send(xslFeed);
});

// Feed RSS: los ultimos articulos publicados, para quien quiera seguir el
// blog desde un lector de RSS en vez de (o ademas de) redes sociales.
router.get("/rss.xml", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;
  const posts = db
    .prepare(
      `SELECT id, slug, titulo, resumen, fecha_creacion
       FROM posts
       WHERE estado = 'publicado'
       ORDER BY fecha_creacion DESC
       LIMIT 20`
    )
    .all();

  const items = posts
    .map((post) => {
      const link = `${urlBase}/post/${post.slug}`;
      const fechaRfc822 = new Date(post.fecha_creacion.replace(" ", "T")).toUTCString();
      // El guid no es la URL (isPermaLink="false"): asi, si la URL de un
      // articulo cambia mas adelante (como al pasar de /post/<id> a
      // /post/<slug>), los lectores de RSS no lo marcan como articulo nuevo
      // solo porque cambio el enlace.
      return [
        "<item>",
        `<title>${escaparXml(post.titulo)}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="false">codigoaldia-post-${post.id}</guid>`,
        `<pubDate>${fechaRfc822}</pubDate>`,
        `<description>${escaparXml(post.resumen)}</description>`,
        "</item>",
      ].join("");
    })
    .join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>\n' +
    '<rss version="2.0">\n' +
    "<channel>\n" +
    "<title>Código al Día</title>\n" +
    `<link>${urlBase}</link>\n` +
    "<description>Notas y recursos sobre desarrollo web: cursos, herramientas y opiniones.</description>\n" +
    "<language>es</language>\n" +
    items +
    "\n</channel>\n</rss>";

  res.type("application/rss+xml").send(xml);
});

module.exports = router;
