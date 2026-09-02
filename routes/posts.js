// routes/posts.js
// Rutas públicas: la página de inicio con el listado de artículos
// y la página de detalle de cada artículo.

const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET / -> Página de inicio con todos los artículos, del más reciente al más antiguo
// Admite un filtro opcional por categoría: /?categoria=2
router.get("/", (req, res) => {
  const categoriaId = req.query.categoria;

  // "LEFT JOIN" trae el nombre de la categoría junto a cada post en la misma
  // consulta, en vez de tener que hacer una consulta aparte por cada post.
  let sql = `
    SELECT posts.*, categorias.nombre AS categoria_nombre
    FROM posts
    LEFT JOIN categorias ON posts.categoria_id = categorias.id
  `;
  const parametros = [];

  if (categoriaId) {
    sql += " WHERE posts.categoria_id = ?";
    parametros.push(categoriaId);
  }

  sql += " ORDER BY posts.fecha_creacion DESC";

  const posts = db.prepare(sql).all(...parametros);
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();

  res.render("index", { posts, categorias, categoriaSeleccionada: categoriaId ? Number(categoriaId) : null });
});

// GET /post/:id -> Página de detalle de un artículo concreto
router.get("/post/:id", (req, res) => {
  const post = db
    .prepare(
      `SELECT posts.*, categorias.nombre AS categoria_nombre
       FROM posts
       LEFT JOIN categorias ON posts.categoria_id = categorias.id
       WHERE posts.id = ?`
    )
    .get(req.params.id);

  if (!post) {
    return res.status(404).send("Artículo no encontrado");
  }

  res.render("post", { post });
});

module.exports = router;
