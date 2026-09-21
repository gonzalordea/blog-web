// server.js
// Punto de entrada de la aplicación. Aquí se configura Express,
// las vistas (EJS), las sesiones y se conectan las rutas.

// Tiene que ser lo primero que se ejecuta: carga las variables definidas en
// el archivo ".env" (si existe) dentro de process.env, antes de que
// database/db.js o el resto del archivo las lean.
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
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

// Redirige el dominio antiguo de Railway al dominio propio (codigoaldia.com),
// para que cualquier visita o enlace antiguo a la URL de Railway acabe
// siempre en el dominio definitivo, y para evitar contenido duplicado de
// cara a Google (misma pagina accesible por dos URLs distintas).
const DOMINIO_ANTIGUO = "blog-web-production-42cf.up.railway.app";
const DOMINIO_PROPIO = "codigoaldia.com";
app.use((req, res, next) => {
  if (req.hostname === DOMINIO_ANTIGUO) {
    return res.redirect(301, `https://${DOMINIO_PROPIO}${req.originalUrl}`);
  }
  next();
});

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

// Las sesiones se guardan en archivos en vez de en memoria (que era el
// comportamiento por defecto). Con sesiones en memoria, cada vez que el
// proceso de Node se reinicia se pierden todas las sesiones activas — y
// nodemon (usado en "npm run dev") reinicia el servidor cada vez que
// guardas un archivo, así que tocaba volver a iniciar sesión constantemente
// mientras se está programando. Guardándolas en disco, la sesión sobrevive
// a esos reinicios (y también a los despliegues en Railway, si se guardan
// en el mismo volumen persistente que la base de datos).
const carpetaSesiones = process.env.DB_PATH
  ? path.join(path.dirname(process.env.DB_PATH), "sessions")
  : path.join(__dirname, "sessions");

app.use(
  session({
    store: new FileStore({
      path: carpetaSesiones,
      ttl: 60 * 60 * 2, // igual que cookie.maxAge, en segundos (2 horas)
      logFn: function () {}, // sin esto, escribe un log por cada lectura/escritura de sesión
    }),
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
  // Token de Cloudflare Web Analytics (gratis, sin cookies). Si no esta
  // configurada la variable de entorno, sencillamente no se muestra nada -
  // el sitio funciona igual sin ella.
  res.locals.cfAnalyticsToken = process.env.CF_ANALYTICS_TOKEN || null;
  next();
});

// ---------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------
app.use("/", seoRoutes);
app.use("/", postsRoutes);
app.use("/admin", adminRoutes);

// Cualquier ruta que no haya coincidido con nada de arriba: pagina 404 con
// la identidad del blog, en vez del mensaje generico de Express.
app.use((req, res) => {
  res.status(404).render("404");
});

// ---------------------------------------------------------------------
// Arranque del servidor
// ---------------------------------------------------------------------
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
