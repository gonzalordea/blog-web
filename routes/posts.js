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
  const busqueda = (req.query.q || "").trim();

  // "LEFT JOIN" trae el nombre de la categoría junto a cada post en la misma
  // consulta, en vez de tener que hacer una consulta aparte por cada post.
  let sql = `
    SELECT posts.*, categorias.nombre AS categoria_nombre
    FROM posts
    LEFT JOIN categorias ON posts.categoria_id = categorias.id
  `;
  const condiciones = [];
  const parametros = [];

  if (categoriaId) {
    condiciones.push("posts.categoria_id = ?");
    parametros.push(categoriaId);
  }

  if (busqueda) {
    condiciones.push("(posts.titulo LIKE ? OR posts.resumen LIKE ? OR posts.contenido LIKE ?)");
    const comodin = `%${busqueda}%`;
    parametros.push(comodin, comodin, comodin);
  }

  if (condiciones.length > 0) {
    sql += " WHERE " + condiciones.join(" AND ");
  }

  sql += " ORDER BY posts.fecha_creacion DESC";

  const posts = db.prepare(sql).all(...parametros);
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();

  res.render("index", {
    posts,
    categorias,
    categoriaSeleccionada: categoriaId ? Number(categoriaId) : null,
    busqueda,
  });
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

  const comentarios = db
    .prepare("SELECT * FROM comentarios WHERE post_id = ? ORDER BY fecha_creacion ASC")
    .all(post.id);

  res.render("post", { post, comentarios, errorComentario: null });
});

// POST /post/:id/comentarios -> Añadir un comentario a un artículo. Público,
// no requiere haber iniciado sesión (cualquier lector puede comentar).
router.post("/post/:id/comentarios", (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
  if (!post) {
    return res.status(404).send("Artículo no encontrado");
  }

  const nombre = (req.body.nombre || "").trim().slice(0, 80);
  const contenido = (req.body.contenido || "").trim().slice(0, 2000);

  if (!nombre || !contenido) {
    const postCompleto = db
      .prepare(
        `SELECT posts.*, categorias.nombre AS categoria_nombre
         FROM posts
         LEFT JOIN categorias ON posts.categoria_id = categorias.id
         WHERE posts.id = ?`
      )
      .get(post.id);
    const comentarios = db
      .prepare("SELECT * FROM comentarios WHERE post_id = ? ORDER BY fecha_creacion ASC")
      .all(post.id);

    return res.status(400).render("post", {
      post: postCompleto,
      comentarios,
      errorComentario: "Escribe tu nombre y un comentario antes de enviar",
    });
  }

  db.prepare("INSERT INTO comentarios (post_id, nombre, contenido) VALUES (?, ?, ?)").run(
    post.id,
    nombre,
    contenido
  );

  res.redirect(`/post/${post.id}#comentarios`);
});

module.exports = router;
