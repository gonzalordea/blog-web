// server.js
// Punto de entrada de la aplicación. Aquí se configura Express,
// las vistas (EJS), las sesiones y se conectan las rutas.

// Tiene que ser lo primero que se ejecuta: carga las variables definidas en
// el archivo ".env" (si existe) dentro de process.env, antes de que
// database/db.js o el resto del archivo las lean.
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

// Al importar db.js, se ejecuta automáticamente la creación de tablas.
require("./database/db");

const postsRoutes = require("./routes/posts");
const adminRoutes = require("./routes/admin");
const seoRoutes = require("./routes/seo");

const app = express();
const PUERTO = process.env.PORT || 3000;

// Carpeta donde se guardan las imágenes que suben los artículos. En Railway,
// el sistema de archivos normal se borra en cada redeploy — por eso UPLOADS_DIR
// debe apuntar dentro del mismo volumen persistente que usa DB_PATH (por
// ejemplo, /app/data/uploads). En local, por defecto se usan sin configurar
// nada.
const carpetaUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "public", "uploads");
fs.mkdirSync(carpetaUploads, { recursive: true });
app.set("carpetaUploads", carpetaUploads);

// Railway (y la mayoría de plataformas) ponen la app detrás de un proxy que
// termina el HTTPS y reenvía la petición por HTTP. Sin esto, req.protocol
// devolvería siempre "http", y las URLs canónicas/Open Graph saldrían mal.
app.set("trust proxy", 1);

// ---------------------------------------------------------------------
// Configuración del motor de plantillas (EJS)
// ---------------------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------------------------------------------------------------
// Middlewares
// ---------------------------------------------------------------------
app.use(express.urlencoded({ extended: true })); // Para leer datos de formularios
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Archivos CSS/JS
app.use("/uploads", express.static(carpetaUploads)); // Imágenes subidas por los artículos

app.use(
  session({
    // En producción, define SESSION_SECRET como variable de entorno con una
    // frase larga y aleatoria. Si no existe (como en desarrollo local), se
    // usa un valor por defecto — está bien para probar, pero nunca para producción real.
    secret: process.env.SESSION_SECRET || "cambia-esto-por-una-frase-secreta-larga",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 horas de sesión
  })
);

// Esta variable estará disponible en TODAS las plantillas EJS,
// para poder mostrar u ocultar el botón de "admin" según si hay sesión iniciada.
app.use((req, res, next) => {
  res.locals.sesionIniciada = !!req.session.usuarioId;
  next();
});

// Igual que arriba: la URL base (protocolo + dominio) para construir URLs
// absolutas (canonical, Open Graph, sitemap) sin tener que hardcodear el
// dominio en ningún sitio — así funciona igual en local, en el dominio que
// da Railway, o en un dominio propio si se añade más adelante.
app.use((req, res, next) => {
  res.locals.urlBase = `${req.protocol}://${req.get("host")}`;
  next();
});

// ---------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------
app.use("/", seoRoutes);
app.use("/", postsRoutes);
app.use("/admin", adminRoutes);

// ---------------------------------------------------------------------
// Arranque del servidor
// ---------------------------------------------------------------------
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
