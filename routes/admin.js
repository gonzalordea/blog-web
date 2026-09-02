// routes/admin.js
// Rutas del panel de administración: login, logout y gestión (CRUD) de artículos.
// Todas las rutas, salvo login, están protegidas por el middleware "requiereLogin".

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../database/db");

// ---------------------------------------------------------------------
// Middleware de protección: si no hay sesión iniciada, redirige al login
// ---------------------------------------------------------------------
function requiereLogin(req, res, next) {
  if (!req.session.usuarioId) {
    return res.redirect("/admin/login");
  }
  next();
}

// ---------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------
router.get("/login", (req, res) => {
  res.render("admin/login", { error: null });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email);

  if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
    return res.render("admin/login", { error: "Email o contraseña incorrectos" });
  }

  req.session.usuarioId = usuario.id;
  res.redirect("/admin/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ---------------------------------------------------------------------
// DASHBOARD -> listado de posts con opciones de editar/borrar
// ---------------------------------------------------------------------
router.get("/dashboard", requiereLogin, (req, res) => {
  const posts = db
    .prepare(
      `SELECT posts.*, categorias.nombre AS categoria_nombre
       FROM posts
       LEFT JOIN categorias ON posts.categoria_id = categorias.id
       ORDER BY posts.fecha_creacion DESC`
    )
    .all();

  res.render("admin/dashboard", { posts });
});

// ---------------------------------------------------------------------
// CREAR POST
// ---------------------------------------------------------------------
router.get("/posts/nuevo", requiereLogin, (req, res) => {
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
  res.render("admin/form", { post: null, categorias });
});

router.post("/posts/nuevo", requiereLogin, (req, res) => {
  const { titulo, resumen, contenido, imagen, categoria_id } = req.body;

  db.prepare(
    "INSERT INTO posts (titulo, resumen, contenido, imagen, categoria_id) VALUES (?, ?, ?, ?, ?)"
  ).run(titulo, resumen, contenido, imagen, categoria_id || null);

  res.redirect("/admin/dashboard");
});

// ---------------------------------------------------------------------
// EDITAR POST
// ---------------------------------------------------------------------
router.get("/posts/:id/editar", requiereLogin, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);

  if (!post) {
    return res.status(404).send("Artículo no encontrado");
  }

  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
  res.render("admin/form", { post, categorias });
});

router.post("/posts/:id/editar", requiereLogin, (req, res) => {
  const { titulo, resumen, contenido, imagen, categoria_id } = req.body;

  db.prepare(
    "UPDATE posts SET titulo = ?, resumen = ?, contenido = ?, imagen = ?, categoria_id = ? WHERE id = ?"
  ).run(titulo, resumen, contenido, imagen, categoria_id || null, req.params.id);

  res.redirect("/admin/dashboard");
});

// ---------------------------------------------------------------------
// BORRAR POST
// ---------------------------------------------------------------------
router.post("/posts/:id/borrar", requiereLogin, (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.redirect("/admin/dashboard");
});

// ---------------------------------------------------------------------
// GESTIÓN DE CATEGORÍAS
// ---------------------------------------------------------------------
router.get("/categorias", requiereLogin, (req, res) => {
  const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
  res.render("admin/categorias", { categorias, error: null });
});

router.post("/categorias", requiereLogin, (req, res) => {
  const { nombre } = req.body;

  try {
    db.prepare("INSERT INTO categorias (nombre) VALUES (?)").run(nombre.trim());
    res.redirect("/admin/categorias");
  } catch (error) {
    // Salta aquí, por ejemplo, si ya existe una categoría con ese nombre
    // (la columna "nombre" tiene la restricción UNIQUE en la base de datos).
    const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
    res.render("admin/categorias", { categorias, error: "Esa categoría ya existe o el nombre no es válido" });
  }
});

router.post("/categorias/:id/borrar", requiereLogin, (req, res) => {
  // Al borrar una categoría, los posts que la tenían asignada se quedan sin
  // categoría (categoria_id a NULL) en vez de borrarse ellos también.
  db.prepare("UPDATE posts SET categoria_id = NULL WHERE categoria_id = ?").run(req.params.id);
  db.prepare("DELETE FROM categorias WHERE id = ?").run(req.params.id);
  res.redirect("/admin/categorias");
});

module.exports = router;
