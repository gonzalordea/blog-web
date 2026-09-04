// routes/admin.js
// Rutas del panel de administración: login, logout y gestión (CRUD) de artículos.
// Todas las rutas, salvo login, están protegidas por el middleware "requiereLogin".

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
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
// Subida de imágenes de artículos (multer)
// ---------------------------------------------------------------------
// Las imágenes se guardan con un nombre único, para que no se pisen entre sí
// dos artículos que suban un archivo con el mismo nombre (por ejemplo,
// "portada.jpg"). La carpeta de destino la resuelve server.js (variable
// UPLOADS_DIR en producción) y se lee de req.app en cada petición.
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, req.app.get("carpetaUploads")),
  filename: (req, file, cb) => {
    const sufijoUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sufijoUnico}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const tiposPermitidos = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const subirImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!tiposPermitidos.has(file.mimetype)) {
      return cb(new Error("TIPO_NO_PERMITIDO"));
    }
    cb(null, true);
  },
}).single("imagen");

// Envuelve el middleware de multer para poder mostrar los errores (archivo
// demasiado grande, tipo no permitido...) en el propio formulario en vez de
// que Express los trate como un error genérico del servidor.
function subirImagenConError(req, res, next) {
  subirImagen(req, res, (error) => {
    if (!error) return next();

    const mensaje =
      error.message === "TIPO_NO_PERMITIDO"
        ? "Solo se permiten imágenes JPG, PNG, WEBP o GIF"
        : "La imagen no puede superar los 5 MB";

    const categorias = db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
    const post = req.params.id
      ? db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id)
      : null;

    res.render("admin/form", { post, categorias, error: mensaje });
  });
}

// Borra un archivo subido anteriormente (por ejemplo, al reemplazar la
// imagen de un artículo). Es "best effort": si falla no interrumpe la
// operación principal, solo lo avisa por consola.
function borrarImagenAnterior(req, rutaImagen) {
  if (!rutaImagen || !rutaImagen.startsWith("/uploads/")) return;

  const rutaCompleta = path.join(req.app.get("carpetaUploads"), path.basename(rutaImagen));
  fs.unlink(rutaCompleta, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("No se pudo borrar la imagen anterior:", error.message);
    }
  });
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

router.post("/posts/nuevo", requiereLogin, subirImagenConError, (req, res) => {
  const { titulo, resumen, contenido, categoria_id } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;

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

router.post("/posts/:id/editar", requiereLogin, subirImagenConError, (req, res) => {
  const { titulo, resumen, contenido, categoria_id } = req.body;
  const postActual = db.prepare("SELECT imagen FROM posts WHERE id = ?").get(req.params.id);

  // Si se sube un archivo nuevo, reemplaza la imagen (y borra la anterior).
  // Si no, se conserva la que ya tenía el artículo.
  const imagen = req.file ? `/uploads/${req.file.filename}` : postActual?.imagen || null;

  if (req.file && postActual?.imagen) {
    borrarImagenAnterior(req, postActual.imagen);
  }

  db.prepare(
    "UPDATE posts SET titulo = ?, resumen = ?, contenido = ?, imagen = ?, categoria_id = ? WHERE id = ?"
  ).run(titulo, resumen, contenido, imagen, categoria_id || null, req.params.id);

  res.redirect("/admin/dashboard");
});

// ---------------------------------------------------------------------
// BORRAR POST
// ---------------------------------------------------------------------
router.post("/posts/:id/borrar", requiereLogin, (req, res) => {
  const post = db.prepare("SELECT imagen FROM posts WHERE id = ?").get(req.params.id);
  db.prepare("DELETE FROM comentarios WHERE post_id = ?").run(req.params.id);
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  if (post?.imagen) borrarImagenAnterior(req, post.imagen);
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

// ---------------------------------------------------------------------
// MODERACIÓN DE COMENTARIOS
// ---------------------------------------------------------------------
router.get("/comentarios", requiereLogin, (req, res) => {
  const comentarios = db
    .prepare(
      `SELECT comentarios.*, posts.titulo AS post_titulo
       FROM comentarios
       JOIN posts ON comentarios.post_id = posts.id
       ORDER BY comentarios.fecha_creacion DESC`
    )
    .all();

  res.render("admin/comentarios", { comentarios });
});

router.post("/comentarios/:id/borrar", requiereLogin, (req, res) => {
  db.prepare("DELETE FROM comentarios WHERE id = ?").run(req.params.id);
  res.redirect("/admin/comentarios");
});

module.exports = router;
