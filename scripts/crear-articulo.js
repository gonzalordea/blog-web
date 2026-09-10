// scripts/crear-articulo.js
// Inserta un artículo nuevo directamente en la base de datos, siempre como
// BORRADOR (no se ve en la web pública hasta que se publique desde el panel
// admin o se cambie a mano el estado). Pensado para que Claude proponga
// artículos que luego Gonzalo revisa y aprueba, sin publicar nada solo.
//
// Uso:
//   node scripts/crear-articulo.js ruta/al/articulo.json
//
// El JSON debe tener esta forma:
// {
//   "titulo": "Título del artículo",
//   "resumen": "Resumen corto que aparece en la portada",
//   "contenido": "<p>HTML del cuerpo del artículo...</p>",
//   "categoria": "Cursos"   // opcional, debe existir ya en /admin/categorias
// }

const fs = require("fs");
const path = require("path");
const db = require("../database/db");

const rutaJson = process.argv[2];

if (!rutaJson) {
  console.error("Uso: node scripts/crear-articulo.js ruta/al/articulo.json");
  process.exit(1);
}

const contenidoJson = JSON.parse(fs.readFileSync(path.resolve(rutaJson), "utf-8"));
const { titulo, resumen, contenido, categoria } = contenidoJson;

if (!titulo || !resumen || !contenido) {
  console.error("El JSON necesita al menos: titulo, resumen y contenido");
  process.exit(1);
}

let categoriaId = null;
if (categoria) {
  const fila = db
    .prepare("SELECT id FROM categorias WHERE nombre = ? COLLATE NOCASE")
    .get(categoria);
  if (fila) {
    categoriaId = fila.id;
  } else {
    console.warn(
      `Aviso: la categoría "${categoria}" no existe todavía en /admin/categorias. El artículo se crea sin categoría.`
    );
  }
}

const resultado = db
  .prepare(
    "INSERT INTO posts (titulo, resumen, contenido, categoria_id, estado) VALUES (?, ?, ?, ?, 'borrador')"
  )
  .run(titulo, resumen, contenido, categoriaId);

console.log(`Borrador creado con id ${resultado.lastInsertRowid}: "${titulo}"`);
console.log("Revísalo y publícalo desde /admin/dashboard cuando le des el visto bueno.");
