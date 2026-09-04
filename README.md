# Blog Dev — Proyecto de aprendizaje

Blog de contenido con backend en **Node.js + Express**, plantillas **EJS** y base de datos **SQLite** (a través del módulo nativo `node:sqlite`). Incluye un panel de administración protegido por login para crear, editar y borrar artículos (CRUD completo), categorías, buscador y SEO básico.

## Estructura del proyecto

```
blog-web/
├── server.js              # Punto de entrada de la aplicación
├── package.json
├── database/
│   ├── db.js                # Conexión y creación de tablas SQLite
│   └── blog.db               # Archivo de base de datos (se crea solo)
├── routes/
│   ├── posts.js             # Rutas públicas (inicio, detalle de post, búsqueda)
│   ├── admin.js             # Rutas del panel admin (login, CRUD, categorías)
│   └── seo.js               # Sitemap, robots.txt y datos estructurados
├── views/
│   ├── partials/            # Cabecera y pie reutilizables
│   ├── admin/                # Vistas del panel de administración
│   ├── index.ejs             # Portada con listado de artículos
│   └── post.ejs               # Detalle de un artículo
└── public/
    ├── css/style.css        # Estilos
    └── uploads/              # Imágenes de los artículos subidas desde el panel
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

- **Portada (`/`)**: muestra todos los artículos publicados, con filtro por categoría y buscador por título/contenido.
- **Panel admin (`/admin/login`)**: entra con las credenciales de arriba (el acceso no aparece enlazado en la web pública).
- Desde el panel puedes **crear, editar y borrar** artículos, y gestionar **categorías** (`/admin/categorias`).
- El campo "Contenido" admite HTML básico (`<p>`, `<h2>`, `<strong>`, `<a>`, etc.) para poder dar formato al artículo.
- La imagen del artículo se sube como archivo desde el propio formulario (JPG, PNG, WEBP o GIF, máx. 5 MB) y se guarda en `public/uploads/`.
- Cualquier lector puede dejar un **comentario** (nombre + texto) al final de cada artículo, sin necesidad de crear una cuenta. Desde `/admin/comentarios` puedes revisarlos todos y borrar los que no quieras (spam, etc.).

## 4. Variables de entorno

El proyecto funciona sin configurar nada (usa valores por defecto). Pero tanto en local como en producción es buena idea definir tus propios valores, en vez de dejar los de prueba:

| Variable | Para qué sirve | Valor por defecto si no la defines |
|---|---|---|
| `DB_PATH` | Ruta del archivo de base de datos SQLite (en Railway, apúntala dentro de tu volumen persistente) | `database/blog.db` |
| `UPLOADS_DIR` | Carpeta donde se guardan las imágenes subidas desde el admin (en Railway, apúntala también dentro del volumen persistente, o se perderán en cada redeploy) | `public/uploads` |
| `ADMIN_EMAIL` | Email del usuario administrador | `admin@blog.com` |
| `ADMIN_PASSWORD` | Contraseña del usuario administrador | `admin123` |
| `SESSION_SECRET` | Frase secreta para firmar las cookies de sesión (pon algo largo y aleatorio) | una frase de ejemplo, no segura |
| `PORT` | Puerto en el que arranca el servidor | `3000` |

**En local:** copia `.env.example` a `.env` (en la raíz del proyecto) y cambia los valores que quieras. El archivo `.env` nunca se sube a git (está en `.gitignore`) — es solo tuyo. Al arrancar (`npm start` o `npm run dev`), `server.js` carga automáticamente ese archivo con el paquete `dotenv`. Ya existe uno creado en tu proyecto con una `SESSION_SECRET` aleatoria generada para ti; si quieres, cambia también `ADMIN_PASSWORD` ahí mismo.

**En producción** (Railway, Render...): no subas nunca un `.env` — define esas mismas variables directamente en el panel de la plataforma.

> Cambiar `ADMIN_EMAIL` / `ADMIN_PASSWORD` y volver a desplegar actualiza las credenciales del admin automáticamente, aunque ese usuario ya existiera de antes.

## 5. Ideas para seguir aprendiendo y ampliar el proyecto

Ya implementado: categorías, buscador, subida de imágenes con `multer`, comentarios de lectores con moderación desde el admin, credenciales y secretos en `.env` (con `dotenv`) y SEO básico (sitemap, robots.txt, metadatos, datos estructurados).

Siguientes pasos, de menor a mayor dificultad:

1. Comentarios pendientes de aprobación (que no se publiquen hasta que el admin los revise, en vez de aparecer al instante).
2. Preparar el proyecto para publicarlo online (por ejemplo con Render o Railway, que tienen planes gratuitos) y empezar a meter Google AdSense o enlaces de afiliado en los artículos.

## 6. Sobre la monetización

Con este blog ya funcionando, los pasos típicos para empezar a generar ingresos son:
- Publicar contenido de forma constante (esto es lo que más pesa a la hora de conseguir tráfico).
- Cuando tengas tráfico mínimo y contenido de calidad, solicitar Google AdSense.
- Ir metiendo enlaces de afiliado (cursos, libros, herramientas) de forma natural dentro de los artículos, no forzada.

Si quieres, en otra sesión podemos ver cómo desplegarlo online paso a paso.
