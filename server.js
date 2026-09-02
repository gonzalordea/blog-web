// server.js
// Punto de entrada de la aplicación. Aquí se configura Express,
// las vistas (EJS), las sesiones y se conectan las rutas.

const express = require("express");
const session = require("express-session");
const path = require("path");

// Al importar db.js, se ejecuta automáticamente la creación de tablas.
require("./database/db");

const postsRoutes = require("./routes/posts");
const adminRoutes = require("./routes/admin");

const app = express();
const PUERTO = process.env.PORT || 3000;

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
app.use(express.static(path.join(__dirname, "public"))); // Archivos CSS/JS/imágenes

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

// ---------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------
app.use("/", postsRoutes);
app.use("/admin", adminRoutes);

// ---------------------------------------------------------------------
// Arranque del servidor
// ---------------------------------------------------------------------
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
