// database/db.js
// Este archivo es el responsable de conectar con la base de datos SQLite
// y de crear las tablas si todavía no existen (esto se llama "migraciones" simples).

// Usamos el módulo SQLite integrado en Node.js (disponible desde Node 22.13+
// sin necesidad de flags). No requiere compilar nada, a diferencia de
// better-sqlite3, así que nos evitamos problemas de instalación en Windows.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const bcrypt = require("bcryptjs");
const { slugify } = require("../utils/slugify");

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

db.exec(`
  CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
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
// Migración: añadir la columna estado a "posts" si todavía no existe
// ---------------------------------------------------------------------
// "estado" distingue entre artículos ya publicados (visibles en la web
// pública) y borradores (solo visibles desde el panel admin). Por defecto
// se marcan como "publicado" para no cambiar el comportamiento de los
// artículos que ya existían ni del formulario manual del panel admin.

const tieneEstado = columnasPosts.some((columna) => columna.name === "estado");

if (!tieneEstado) {
  db.exec("ALTER TABLE posts ADD COLUMN estado TEXT NOT NULL DEFAULT 'publicado'");
  console.log("Migración aplicada: columna estado añadida a posts");
}

// ---------------------------------------------------------------------
// Migración: añadir la columna visitas a "posts" si todavía no existe
// ---------------------------------------------------------------------
// Contador simple de visitas (se suma 1 cada vez que alguien abre el
// articulo en la web publica). Solo se muestra en el panel de admin, nunca
// en la web publica. Es un contador basico: cuenta cargas de la pagina, no
// visitantes unicos ni descarta bots, asi que sirve como señal orientativa
// de que articulos se leen mas, no como una analitica exacta.

const tieneVisitas = columnasPosts.some((columna) => columna.name === "visitas");

if (!tieneVisitas) {
  db.exec("ALTER TABLE posts ADD COLUMN visitas INTEGER NOT NULL DEFAULT 0");
  console.log("Migración aplicada: columna visitas añadida a posts");
}

// ---------------------------------------------------------------------
// Migración: añadir la columna fecha_actualizacion a "posts" si no existe
// ---------------------------------------------------------------------
// Guarda cuándo se editó un artículo por última vez (distinto de
// fecha_creacion, que no cambia nunca). Empieza en NULL: solo se rellena
// la primera vez que alguien edita el artículo desde el panel admin, así
// que en la web pública solo se muestra "Actualizado el..." en artículos
// que de verdad se han revisado, no en todos por defecto.

const tieneFechaActualizacion = columnasPosts.some(
  (columna) => columna.name === "fecha_actualizacion"
);

if (!tieneFechaActualizacion) {
  db.exec("ALTER TABLE posts ADD COLUMN fecha_actualizacion TEXT");
  console.log("Migración aplicada: columna fecha_actualizacion añadida a posts");
}

// ---------------------------------------------------------------------
// Migración: añadir la columna destacado a "posts" si todavía no existe
// ---------------------------------------------------------------------
// Solo un articulo puede estar destacado a la vez (se muestra en un hueco
// especial en la portada). Por defecto ninguno lo esta.

const tieneDestacado = columnasPosts.some((columna) => columna.name === "destacado");

if (!tieneDestacado) {
  db.exec("ALTER TABLE posts ADD COLUMN destacado INTEGER NOT NULL DEFAULT 0");
  console.log("Migración aplicada: columna destacado añadida a posts");
}

// ---------------------------------------------------------------------
// Migración: añadir la columna slug a "categorias" si todavía no existe
// ---------------------------------------------------------------------
// El slug es la version "amigable" del nombre de la categoria para usar en
// la URL (ej. "Cursos" -> "cursos"). No se puede exigir UNIQUE al añadir la
// columna con datos ya existentes, asi que la unicidad se comprueba a mano,
// tanto aqui (para las categorias que ya existian) como al crear una
// categoria nueva desde el panel admin.

const columnasCategorias = db.prepare("PRAGMA table_info(categorias)").all();
const tieneSlug = columnasCategorias.some((columna) => columna.name === "slug");

if (!tieneSlug) {
  db.exec("ALTER TABLE categorias ADD COLUMN slug TEXT");
  console.log("Migración aplicada: columna slug añadida a categorias");
}

const categoriasSinSlug = db
  .prepare("SELECT id, nombre FROM categorias WHERE slug IS NULL OR slug = ''")
  .all();

if (categoriasSinSlug.length > 0) {
  const actualizarSlug = db.prepare("UPDATE categorias SET slug = ? WHERE id = ?");
  const slugsExistentes = new Set(
    db
      .prepare("SELECT slug FROM categorias WHERE slug IS NOT NULL AND slug != ''")
      .all()
      .map((categoria) => categoria.slug)
  );

  categoriasSinSlug.forEach((categoria) => {
    const base = slugify(categoria.nombre) || "categoria";
    let slugFinal = base;
    let contador = 2;
    while (slugsExistentes.has(slugFinal)) {
      slugFinal = `${base}-${contador}`;
      contador += 1;
    }
    slugsExistentes.add(slugFinal);
    actualizarSlug.run(slugFinal, categoria.id);
  });

  console.log(`Slugs generados para ${categoriasSinSlug.length} categoría(s) existente(s)`);
}

// ---------------------------------------------------------------------
// Categorías de ejemplo (solo se crean si la tabla está vacía)
// ---------------------------------------------------------------------

const totalCategorias = db.prepare("SELECT COUNT(*) AS total FROM categorias").get().total;

if (totalCategorias === 0) {
  const insertarCategoria = db.prepare("INSERT INTO categorias (nombre, slug) VALUES (?, ?)");
  ["Cursos", "Herramientas", "Recursos", "Opinión"].forEach((nombre) => {
    insertarCategoria.run(nombre, slugify(nombre));
  });
  console.log("Categorías de ejemplo creadas");
}

// ---------------------------------------------------------------------
// Usuario administrador
// ---------------------------------------------------------------------
// El email y la contraseña se leen de variables de entorno (ADMIN_EMAIL /
// ADMIN_PASSWORD). Si no las defines, se usan unas de prueba por defecto
// (solo pensadas para desarrollo local, nunca para producción).
//
// En cada arranque del servidor, si el usuario admin no existe se crea,
// y si ya existe se actualiza su contraseña para que coincida con la
// variable de entorno actual. Así, cambiar ADMIN_PASSWORD en Railway y
// volver a desplegar es suficiente para cambiar la contraseña, incluso
// si el usuario ya se había creado antes con la de prueba.

const adminEmail = process.env.ADMIN_EMAIL || "admin@blog.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const passwordHasheada = bcrypt.hashSync(adminPassword, 10);

const admin = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(adminEmail);

if (!admin) {
  db.prepare("INSERT INTO usuarios (email, password) VALUES (?, ?)").run(
    adminEmail,
    passwordHasheada
  );
  console.log(`Usuario admin creado -> email: ${adminEmail}`);
} else {
  db.prepare("UPDATE usuarios SET password = ? WHERE email = ?").run(
    passwordHasheada,
    adminEmail
  );
}

module.exports = db;
