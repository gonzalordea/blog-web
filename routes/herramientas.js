// routes/herramientas.js
// Rutas de las herramientas/utilidades del blog: paginas estaticas (sin
// datos en base de datos) pensadas para captar busquedas de tipo
// "formateador json online", ademas de dar algo interactivo al lector.
// El procesamiento de cada herramienta ocurre siempre en el navegador
// (JavaScript del lado del cliente): estas rutas solo sirven la pagina.

const express = require("express");
const router = express.Router();

// GET /json -> Formateador y validador de JSON.
router.get("/json", (req, res) => {
  res.render("herramientas/formateador-json");
});

module.exports = router;
