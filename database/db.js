// database/db.js
// Este archivo es el responsable de conectar con la base de datos SQLite
// y de crear las tablas si todavía no existen (esto se llama "migraciones" simples).

// Usamos el módulo SQLite integrado en Node.js (disponible desde Node 22.13+
// sin necesidad de flags). No requiere compilar nada, a diferencia de
// better-sqlite3, así que nos evitamos problemas de instalación en Windows.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const bcrypt = require("bcryptjs");

// El archivo blog.db se guarda, por defecto, dentro de esta misma carpeta
// (así funciona igual que hasta ahora en tu ordenador). En producción
// (Railway), la variable de entorno DB_PATH apunta a una carpeta separada
// del código, montada como volumen persistente — así el volumen nunca
// "tapa" archivos de código como este mismo db.js.
const rutaBD = process.env.DB_PATH || path.join(__dirname, "blog.db");
const db = new DatabaseSync(rutaBD);

// ---------------------------------------------------------------------
// Creación de tablas (solo se ejecuta si no existen ya, gracias a "IF NOT EXISTS")
// ---------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagen TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  )
`);

// ---------------------------------------------------------------------
// Migración: añadir la columna categoria_id a "posts" si todavía no existe
// ---------------------------------------------------------------------
// Como la tabla "posts" ya existía antes de añadir categorías, no podemos
// meter esta columna dentro del CREATE TABLE de arriba (solo se ejecuta la
// primera vez). Así que comprobamos manualmente si falta y la añadimos.

const columnasPosts = db.prepare("PRAGMA table_info(posts)").all();
const tieneCategoriaId = columnasPosts.some((columna) => columna.name === "categoria_id");

if (!tieneCategoriaId) {
  db.exec("ALTER TABLE posts ADD COLUMN categoria_id INTEGER REFERENCES categorias(id)");
  console.log("Migración aplicada: columna categoria_id añadida a posts");
}

// ---------------------------------------------------------------------
// Categorías de ejemplo (solo se crean si la tabla está vacía)
// ---------------------------------------------------------------------

const totalCategorias = db.prepare("SELECT COUNT(*) AS total FROM categorias").get().total;

if (totalCategorias === 0) {
  const insertarCategoria = db.prepare("INSERT INTO categorias (nombre) VALUES (?)");
  ["Cursos", "Herramientas", "Recursos", "Opinión"].forEach((nombre) => {
    insertarCategoria.run(nombre);
  });
  console.log("Categorías de ejemplo creadas");
}

// ---------------------------------------------------------------------
// Usuario administrador por defecto
// ---------------------------------------------------------------------
// La primera vez que arranca el proyecto, si no hay ningún usuario admin,
// se crea uno automáticamente con estas credenciales de ejemplo.
// IMPORTANTE: cámbialas luego desde la base de datos o el código.

const admin = db.prepare("SELECT * FROM usuarios WHERE email = ?").get("admin@blog.com");

if (!admin) {
  const passwordHasheada = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO usuarios (email, password) VALUES (?, ?)").run(
    "admin@blog.com",
    passwordHasheada
  );
  console.log("Usuario admin creado -> email: admin@blog.com | contraseña: admin123");
}

module.exports = db;
