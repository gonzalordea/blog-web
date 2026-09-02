# Blog Dev — Proyecto de aprendizaje

Blog de contenido con backend en **Node.js + Express**, plantillas **EJS** y base de datos **SQLite** (a través de `better-sqlite3`). Incluye un panel de administración protegido por login para crear, editar y borrar artículos (CRUD completo).

## Estructura del proyecto

```
blog-web/
├── server.js              # Punto de entrada de la aplicación
├── package.json
├── database/
│   └── db.js               # Conexión y creación de tablas SQLite
├── routes/
│   ├── posts.js             # Rutas públicas (inicio, detalle de post)
│   └── admin.js             # Rutas del panel admin (login, CRUD)
├── views/
│   ├── partials/            # Cabecera y pie reutilizables
│   ├── admin/                # Vistas del panel de administración
│   ├── index.ejs             # Portada con listado de artículos
│   └── post.ejs               # Detalle de un artículo
└── public/
    └── css/style.css        # Estilos
```

## 1. Instalación

Abre una terminal **dentro de la carpeta `blog-web`** (la misma donde ya ejecutaste `npm init`) y ejecuta:

```
npm install
```

Esto instalará Express, EJS, bcryptjs y express-session (están listados en `package.json`).

La base de datos usa el módulo **`node:sqlite`**, que viene integrado en Node.js (desde la versión 22.13) y no necesita instalarse aparte ni compilar nada. Requiere Node.js 22.13 o superior — puedes comprobar tu versión con `node -v`.

## 2. Ejecutar el proyecto

```
npm start
```

Y abre en el navegador: **http://localhost:3000**

La primera vez que arranca, se crea automáticamente:
- La base de datos `database/blog.db`
- Un usuario administrador de prueba:
  - **Email:** admin@blog.com
  - **Contraseña:** admin123

## 3. Cómo usarlo

- **Portada (`/`)**: muestra todos los artículos publicados.
- **Panel admin (`/admin/login`)**: entra con las credenciales de arriba.
- Desde el panel puedes **crear, editar y borrar** artículos.
- El campo "Contenido" admite HTML básico (`<p>`, `<h2>`, `<strong>`, `<a>`, etc.) para poder dar formato al artículo.

## 4. Ideas para seguir aprendiendo y ampliar el proyecto

Estas son buenas siguientes prácticas, de menor a mayor dificultad:

1. Cambiar la contraseña del admin y moverla (junto al `secret` de la sesión) a un archivo `.env` usando el paquete `dotenv`.
2. Añadir categorías o etiquetas a los artículos.
3. Añadir un buscador de artículos por título.
4. Subir imágenes reales desde el propio formulario (con `multer`) en vez de pegar una URL.
5. Añadir comentarios de los lectores (esto ya seria una tabla nueva relacionada con `posts`).
6. Preparar el proyecto para publicarlo online (por ejemplo con Render o Railway, que tienen planes gratuitos) y empezar a meter Google AdSense o enlaces de afiliado en los artículos.

## 5. Sobre la monetización

Con este blog ya funcionando, los pasos típicos para empezar a generar ingresos son:
- Publicar contenido de forma constante (esto es lo que más pesa a la hora de conseguir tráfico).
- Cuando tengas tráfico mínimo y contenido de calidad, solicitar Google AdSense.
- Ir metiendo enlaces de afiliado (cursos, libros, herramientas) de forma natural dentro de los artículos, no forzada.

Si quieres, en otra sesión podemos ver cómo desplegarlo online paso a paso.
