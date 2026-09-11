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

// Datos de la barra lateral (portada y detalle de articulo): las categorias
// y los ultimos artículos publicados, sin contar el que se esta leyendo.
function obtenerDatosBarraLateral(idActual) {
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
  const ultimosPosts = db
    .prepare(
      `SELECT id, titulo FROM posts
       WHERE estado = 'publicado' AND id != ?
       ORDER BY fecha_creacion DESC
       LIMIT 5`
    )
    .all(idActual || 0);

  return { categorias, ultimosPosts };
}

// Cuantos artículos se muestran por página en la portada. Con pocos
// artículos no se nota, pero evita que el listado se vuelva interminable
// segun el blog vaya creciendo.
const POSTS_POR_PAGINA = 6;

// GET / -> Página de inicio con los artículos, del más reciente al más
// antiguo, paginada. Admite busqueda (/?q=git) y pagina (/?pagina=2),
// combinables. El filtro por categoría vive ahora en su propia URL
// (/categoria/nombre-de-la-categoria): si llega un enlace antiguo con
// ?categoria=ID, se redirige de forma permanente a la nueva URL para no
// perder el enlace ni crear contenido duplicado de cara a los buscadores.
router.get("/", (req, res) => {
  if (req.query.categoria) {
    const categoria = db.prepare("SELECT slug FROM categorias WHERE id = ?").get(req.query.categoria);
    const params = new URLSearchParams();
    if (req.query.q) params.set("q", req.query.q);
    if (req.query.pagina) params.set("pagina", req.query.pagina);
    const qs = params.toString();
    const destino = categoria
      ? `/categoria/${categoria.slug}${qs ? "?" + qs : ""}`
      : "/";
    return res.redirect(301, destino);
  }

  const busqueda = (req.query.q || "").trim();
  const paginaActual = Math.max(1, parseInt(req.query.pagina, 10) || 1);

  // El articulo destacado (si hay uno) solo se muestra en su hueco especial
  // en la portada "limpia": primera pagina, sin busqueda activa. En el
  // resto de casos (buscando, o en paginas siguientes) se mezcla con el
  // resto de articulos como uno más.
  const mostrarDestacado = !busqueda && paginaActual === 1;
  const destacado = mostrarDestacado
    ? db
        .prepare(
          `SELECT posts.*, categorias.nombre AS categoria_nombre, categorias.slug AS categoria_slug, categorias.color AS categoria_color
           FROM posts
           LEFT JOIN categorias ON posts.categoria_id = categorias.id
           WHERE posts.destacado = 1 AND posts.estado = 'publicado'`
        )
        .get()
    : null;

  const condiciones = ["posts.estado = 'publicado'"];
  const parametros = [];

  if (destacado) {
    condiciones.push("posts.id != ?");
    parametros.push(destacado.id);
  }

  if (busqueda) {
    condiciones.push("(posts.titulo LIKE ? OR posts.resumen LIKE ? OR posts.contenido LIKE ?)");
    const comodin = `%${busqueda}%`;
    parametros.push(comodin, comodin, comodin);
  }

  const whereSql = " WHERE " + condiciones.join(" AND ");

  const totalPosts = db
    .prepare(`SELECT COUNT(*) AS total FROM posts${whereSql}`)
    .get(...parametros).total;
  const totalPaginas = Math.max(1, Math.ceil(totalPosts / POSTS_POR_PAGINA));
  const paginaValida = Math.min(paginaActual, totalPaginas);

  // "LEFT JOIN" trae el nombre de la categoría junto a cada post en la misma
  // consulta, en vez de tener que hacer una consulta aparte por cada post.
  const sql = `
    SELECT posts.*, categorias.nombre AS categoria_nombre, categorias.color AS categoria_color
    FROM posts
    LEFT JOIN categorias ON posts.categoria_id = categorias.id
    ${whereSql}
    ORDER BY posts.fecha_creacion DESC
    LIMIT ? OFFSET ?
  `;
  const posts = db
    .prepare(sql)
    .all(...parametros, POSTS_POR_PAGINA, (paginaValida - 1) * POSTS_POR_PAGINA);
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();

  // Construye la URL de otra pagina conservando la busqueda que ya
  // estuviera activa.
  function urlPagina(pagina) {
    const params = new URLSearchParams();
    if (busqueda) params.set("q", busqueda);
    if (pagina > 1) params.set("pagina", pagina);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  res.render("index", {
    posts,
    categorias,
    categoriaSeleccionada: null,
    categoriaActual: null,
    destacado,
    busqueda,
    paginaActual: paginaValida,
    totalPaginas,
    urlPaginaAnterior: paginaValida > 1 ? urlPagina(paginaValida - 1) : null,
    urlPaginaSiguiente: paginaValida < totalPaginas ? urlPagina(paginaValida + 1) : null,
  });
});

// GET /categoria/:slug -> Listado de articulos de una categoria, con su
// propia URL amigable (mejor para SEO que /?categoria=ID: cada categoria
// pasa a ser una pagina indexable por su cuenta, con su propio titulo).
router.get("/categoria/:slug", (req, res) => {
  const categoria = db.prepare("SELECT * FROM categorias WHERE slug = ?").get(req.params.slug);

  if (!categoria) {
    return res.status(404).render("404");
  }

  const busqueda = (req.query.q || "").trim();
  const paginaActual = Math.max(1, parseInt(req.query.pagina, 10) || 1);

  const condiciones = ["posts.estado = 'publicado'", "posts.categoria_id = ?"];
  const parametros = [categoria.id];

  if (busqueda) {
    condiciones.push("(posts.titulo LIKE ? OR posts.resumen LIKE ? OR posts.contenido LIKE ?)");
    const comodin = `%${busqueda}%`;
    parametros.push(comodin, comodin, comodin);
  }

  const whereSql = " WHERE " + condiciones.join(" AND ");

  const totalPosts = db
    .prepare(`SELECT COUNT(*) AS total FROM posts${whereSql}`)
    .get(...parametros).total;
  const totalPaginas = Math.max(1, Math.ceil(totalPosts / POSTS_POR_PAGINA));
  const paginaValida = Math.min(paginaActual, totalPaginas);

  const sql = `
    SELECT posts.*, categorias.nombre AS categoria_nombre, categorias.color AS categoria_color
    FROM posts
    LEFT JOIN categorias ON posts.categoria_id = categorias.id
    ${whereSql}
    ORDER BY posts.fecha_creacion DESC
    LIMIT ? OFFSET ?
  `;
  const posts = db
    .prepare(sql)
    .all(...parametros, POSTS_POR_PAGINA, (paginaValida - 1) * POSTS_POR_PAGINA);
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();

  function urlPagina(pagina) {
    const params = new URLSearchParams();
    if (busqueda) params.set("q", busqueda);
    if (pagina > 1) params.set("pagina", pagina);
    const qs = params.toString();
    return qs ? `/categoria/${categoria.slug}?${qs}` : `/categoria/${categoria.slug}`;
  }

  res.render("index", {
    posts,
    categorias,
    categoriaSeleccionada: categoria.id,
    categoriaActual: categoria,
    destacado: null,
    busqueda,
    paginaActual: paginaValida,
    totalPaginas,
    urlPaginaAnterior: paginaValida > 1 ? urlPagina(paginaValida - 1) : null,
    urlPaginaSiguiente: paginaValida < totalPaginas ? urlPagina(paginaValida + 1) : null,
  });
});

// GET /sobre -> Pagina "Sobre este blog"
router.get("/sobre", (req, res) => {
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
  const totalPublicados = db
    .prepare("SELECT COUNT(*) AS total FROM posts WHERE estado = 'publicado'")
    .get().total;

  res.render("sobre", { categorias, totalPublicados });
});

// GET /post/:id -> Página de detalle de un artículo concreto
router.get("/post/:id", (req, res) => {
  const post = db
    .prepare(
      `SELECT posts.*, categorias.nombre AS categoria_nombre, categorias.slug AS categoria_slug, categorias.color AS categoria_color
       FROM posts
       LEFT JOIN categorias ON posts.categoria_id = categorias.id
       WHERE posts.id = ? AND posts.estado = 'publicado'`
    )
    .get(req.params.id);

  if (!post) {
    return res.status(404).render("404");
  }

  // Contador de visitas: se suma 1 en cada carga de la pagina publica.
  // Es informativo, no una analitica exacta (no distingue visitantes
  // unicos ni filtra bots) - solo se ve en el panel de admin.
  db.prepare("UPDATE posts SET visitas = visitas + 1 WHERE id = ?").run(post.id);

  const comentarios = db
    .prepare("SELECT * FROM comentarios WHERE post_id = ? ORDER BY fecha_creacion ASC")
    .all(post.id);

  res.render("post", {
    post,
    comentarios,
    errorComentario: null,
    tiempoLectura: calcularTiempoLectura(post.contenido),
    relacionados: obtenerRelacionados(post.categoria_id, post.id),
    ...obtenerDatosBarraLateral(post.id),
  });
});

// POST /post/:id/comentarios -> Añadir un comentario a un artículo. Público,
// no requiere haber iniciado sesión (cualquier lector puede comentar).
router.post("/post/:id/comentarios", (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ? AND estado = 'publicado'").get(req.params.id);
  if (!post) {
    return res.status(404).render("404");
  }

  const nombre = (req.body.nombre || "").trim().slice(0, 80);
  const contenido = (req.body.contenido || "").trim().slice(0, 2000);

  if (!nombre || !contenido) {
    const postCompleto = db
      .prepare(
        `SELECT posts.*, categorias.nombre AS categoria_nombre, categorias.slug AS categoria_slug, categorias.color AS categoria_color
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
      ...obtenerDatosBarraLateral(postCompleto.id),
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
