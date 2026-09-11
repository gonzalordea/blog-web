// utils/slugify.js
// Convierte un texto (por ejemplo, el nombre de una categoria) en un slug
// apto para usar en una URL: minusculas, sin acentos ni caracteres raros,
// y palabras separadas por guiones. Se usa tanto al crear categorias
// nuevas como para rellenar el slug de las que ya existian antes de esto.
// (Misma idea que el slugify del indice automatico en views/post.ejs.)

function slugify(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

module.exports = { slugify };
