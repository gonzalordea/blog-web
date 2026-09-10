// routes/posts.js
// Rutas públicas: la página de inicio con el listado de artículos
// y la página de detalle de cada artículo.

const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Calcula un tiempo de lectura aproximado a partir del HTML del articulo:
// quita las etiquetas, cuenta palabras y asume ~200 palabras por minuto
// (la referencia habitual para contenido tecnico en español).
function calcularTiempoLectura(html) {
  const texto = (html || "").replace(/<[^>]*>/g, " ");
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

// Hasta 3 articulos publicados de la misma categoria, sin contar el actual.
// Si el articulo no tiene categoria asignada, no hay relacionados que mostrar.
function obtenerRelacionados(categoriaId, idActual) {
  if (!categoriaId) return [];

  return db
    .prepare(
      `SELECT id, titulo, resumen, imagen
       FROM posts
       WHERE categoria_id = ? AND estado = 'publicado' AND id != ?
       ORDER BY fecha_creacion DESC
       LIMIT 3`
    )
    .all(categoriaId, idActual);
}

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
  const condiciones = ["posts.estado = 'publicado'"];
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

  sql += " WHERE " + condiciones.join(" AND ");

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
       WHERE posts.id = ? AND posts.estado = 'publicado'`
    )
    .get(req.params.id);

  if (!post) {
    return res.status(404).send("Artículo no encontrado");
  }

  const comentarios = db
    .prepare("SELECT * FROM comentarios WHERE post_id = ? ORDER BY fecha_creacion ASC")
    .all(post.id);

  res.render("post", {
    post,
    comentarios,
    errorComentario: null,
    tiempoLectura: calcularTiempoLectura(post.contenido),
    relacionados: obtenerRelacionados(post.categoria_id, post.id),
  });
});

// POST /post/:id/comentarios -> Añadir un comentario a un artículo. Público,
// no requiere haber iniciado sesión (cualquier lector puede comentar).
router.post("/post/:id/comentarios", (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ? AND estado = 'publicado'").get(req.params.id);
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
      tiempoLectura: calcularTiempoLectura(postCompleto.contenido),
      relacionados: obtenerRelacionados(postCompleto.categoria_id, postCompleto.id),
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
