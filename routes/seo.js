// routes/seo.js
// robots.txt y sitemap.xml, generados dinámicamente para que la URL del
// sitio siempre sea correcta (local, Railway, o un dominio propio).

const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/robots.txt", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;

  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${urlBase}/sitemap.xml\n`
  );
});

router.get("/sitemap.xml", (req, res) => {
  const urlBase = `${req.protocol}://${req.get("host")}`;
  const posts = db.prepare("SELECT id, fecha_creacion FROM posts ORDER BY fecha_creacion DESC").all();

  const urls = [
    `<url><loc>${urlBase}/</loc><changefreq>daily</changefreq></url>`,
    ...posts.map((post) => {
      const fecha = post.fecha_creacion.slice(0, 10); // "YYYY-MM-DD"
      return `<url><loc>${urlBase}/post/${post.id}</loc><lastmod>${fecha}</lastmod><changefreq>monthly</changefreq></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.type("application/xml").send(xml);
});

module.exports = router;
