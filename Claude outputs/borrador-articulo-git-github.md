# Borrador para revisión — no está publicado ni importado todavía

**Título:** Git y GitHub para principiantes: los comandos que vas a usar el 90% del tiempo
**Resumen (para la portada):** Si acabas de instalar Git porque un curso te lo pedía y no tienes muy claro qué hacer con él, esta guía te lleva paso a paso desde tu primer commit hasta subir tu código a GitHub, con los comandos que de verdad vas a usar en el día a día.
**Categoría sugerida:** Herramientas
**Longitud:** ~1.750 palabras

---

## Por qué este artículo y por qué así de largo

Investigué varios blogs técnicos de referencia (freeCodeCamp, dev.to, guías de escritura técnica) antes de escribir esto. Algunas conclusiones que apliqué:

- No hay una "longitud mágica" para SEO — Google lo ha dicho explícitamente ("el número de palabras no es un factor de calidad ni de posicionamiento"). Lo que importa es resolver el problema completo del lector, ni más ni menos relleno.
- Para un tutorial práctico como este, la referencia de la industria ronda 1.000-2.000 palabras cuando el tema tiene esa profundidad real (no es una regla, es lo que suele necesitarse para cubrirlo bien).
- Estructura recomendada: título con verbo de acción, introducción que plantea el problema, cuerpo con subtítulos H2 claros, bloques de código probados, párrafos cortos, y conclusión con próximos pasos.
- Tono: cercano, tuteando al lector, explicando el "por qué" y no solo el "cómo".

Elegí Git/GitHub como primer tema porque es el paso lógico después de tu artículo de "cómo elegir tu primer curso": una vez alguien ya está aprendiendo a programar, lo primero que le pide cualquier curso o proyecto es "sube esto a GitHub", y muy pocos tutoriales explican el flujo de verdad del día a día en vez de un listado de comandos sueltos.

Fuentes consultadas (formato y buenas prácticas, no contenido técnico):
- [freeCodeCamp Publication Style Guide](https://www.freecodecamp.org/news/developer-news-style-guide/)
- [How to Write for freeCodeCamp News](https://www.freecodecamp.org/news/how-to-write-for-freecodecamp/)
- [How to Write a Good Technical Article — DEV Community](https://dev.to/the_greatbonnie/how-to-write-a-good-technical-article-22fo)
- [Google Says Word Count Not a Quality Factor — Search Engine Journal](https://www.searchenginejournal.com/word-count-not-a-quality-factor/397288/)
- [How Long Should a Blog Post Be for SEO in 2026? — ryrob.com](https://www.ryrob.com/how-long-should-a-blog-post-be/)

---

## CONTENIDO DEL ARTÍCULO (esto es lo que iría en el blog)

### Git y GitHub para principiantes: los comandos que vas a usar el 90% del tiempo

Si estás empezando a programar, seguro que ya te ha pasado: un curso o un tutorial te dice "instala Git y sube tu proyecto a GitHub", tú lo haces, y ahí se queda la cosa. Copias y pegas unos comandos, funciona (o no), y sigues sin tener ni idea de qué acabas de hacer.

Este artículo no es una lista de comandos de Git. Es el flujo de trabajo real que vas a repetir casi todos los días una vez empieces a programar en serio, explicado paso a paso.

#### Git no es GitHub (y esto es importante)

Antes de nada, una confusión muy típica al empezar:

- **Git** es un programa que se instala en tu ordenador. Lleva un historial de los cambios de tu proyecto, en tu propio disco duro, sin necesidad de internet.
- **GitHub** es una web (propiedad de Microsoft) que guarda una copia de ese historial en la nube, para que puedas compartir tu código, hacer copias de seguridad o trabajar en equipo.

Podrías usar Git toda tu vida sin tocar GitHub. Pero como casi todo el mundo combina los dos, es donde suele empezar la confusión.

#### Antes de empezar: instalar y configurar Git

Si no lo tienes instalado, descárgalo desde [git-scm.com](https://git-scm.com/downloads). Una vez instalado, abre una terminal (en Windows, la que uses normalmente) y dile a Git quién eres — esto solo se hace una vez por ordenador:

```
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

Estos datos son los que aparecerán como autor en cada cambio que subas. Usa el mismo email que tengas en tu cuenta de GitHub para que los commits se asocien bien a tu perfil.

#### El ciclo básico: init, status, add, commit

Vamos a la carpeta de un proyecto (puede estar vacía o tener ya archivos) y convertimos esa carpeta en un repositorio de Git:

```
cd mi-proyecto
git init
```

Esto crea una carpeta oculta `.git` donde Git va a guardar todo el historial. A partir de aquí, el ciclo que vas a repetir constantemente es este:

**1. Ver qué ha cambiado**

```
git status
```

Te dice qué archivos son nuevos, cuáles has modificado y cuáles todavía no está "vigilando" Git.

**2. Preparar los cambios que quieres guardar**

```
git add nombre-del-archivo.js
```

O, para añadir todo lo que ha cambiado de golpe:

```
git add .
```

Este paso confunde a mucha gente al principio: `git add` no sube nada a ningún sitio, solo dice "esto es lo que quiero incluir en la próxima foto del proyecto".

**3. Guardar esa "foto" con un mensaje**

```
git commit -m "Añado el formulario de contacto"
```

Cada commit es un punto del historial al que puedes volver si algo se rompe más adelante. Un buen hábito desde ya: mensajes cortos pero que digan *qué* cambia, no "cambios" o "arreglos" a secas — te lo vas a agradecer tú mismo dentro de tres meses.

Este ciclo —cambiar código, `git add`, `git commit`— es el que vas a repetir muchísimas veces al día. Todo lo demás son variaciones sobre esto.

#### Subir tu proyecto a GitHub

Con el proyecto ya funcionando en local con Git, el siguiente paso es tener una copia en GitHub:

1. Entra en GitHub y crea un repositorio nuevo (botón "New repository"). No marques la opción de crear un README si tu proyecto ya tiene archivos, para evitar conflictos.
2. GitHub te va a dar una URL parecida a `https://github.com/tu-usuario/mi-proyecto.git`. Conecta tu carpeta local con ese repositorio remoto:

```
git remote add origin https://github.com/tu-usuario/mi-proyecto.git
```

3. Sube tu historial por primera vez:

```
git push -u origin main
```

El `-u` (de "upstream") solo hace falta la primera vez: le dice a Git que, a partir de ahora, cuando escribas simplemente `git push`, ya sabe a qué repositorio y rama enviar los cambios.

A partir de aquí, tu día a día con un proyecto ya conectado a GitHub es:

```
git add .
git commit -m "Descripción del cambio"
git push
```

#### Traer cambios: git pull

Si trabajas desde dos ordenadores, o en equipo con más gente, necesitas el comando inverso a `push`: traer a tu ordenador los cambios que ya están en GitHub pero no en tu copia local.

```
git pull
```

Buena costumbre: haz `git pull` nada más sentarte a programar, antes de tocar nada, para partir siempre de la versión más reciente.

#### Ramas (branches): la parte que da más respeto al principio

Una rama es una línea de trabajo independiente. La rama principal se suele llamar `main`. Cuando quieres probar algo sin tocar el código que ya funciona, creas una rama nueva:

```
git checkout -b nueva-funcionalidad
```

Esto crea la rama y te cambia a ella en un solo paso. Trabajas, haces tus commits normales (`add`, `commit`) dentro de esa rama, y cuando ya funciona, la juntas con la rama principal:

```
git checkout main
git merge nueva-funcionalidad
```

No hace falta dominar las ramas desde el primer día, pero sí entender la idea: te dejan experimentar sin miedo a romper lo que ya tenías funcionando.

#### El archivo que te va a salvar de un disgusto: .gitignore

Hay carpetas y archivos que nunca deberías subir a GitHub: la carpeta `node_modules` (se regenera con `npm install`), archivos `.env` con contraseñas o claves, o archivos temporales de tu editor.

Crea un archivo llamado `.gitignore` en la raíz del proyecto y escribe ahí, uno por línea, lo que Git debe ignorar:

```
node_modules/
.env
.DS_Store
```

Es mucho más fácil añadir esto desde el primer commit que intentar "sacar" un archivo con contraseñas después de haberlo subido — una vez está en el historial de Git, quitarlo del todo es bastante más lioso.

#### Los errores más típicos al empezar

- **Hacer `commit` sin haber hecho `add` antes**: Git te avisa de que no hay nada que guardar. Recuerda: primero `add`, luego `commit`.
- **Subir `node_modules` sin querer**: repositorios de varios cientos de MB por una carpeta que se regenera sola. Usa `.gitignore` desde el principio.
- **Mensajes de commit sin sentido** ("asdf", "cambios2"): funciona igual, pero dentro de unas semanas no vas a tener ni idea de qué hacía cada uno.
- **Miedo a las ramas**: usar solo `main` para todo también funciona al principio, pero en cuanto trabajes con más gente (o quieras probar algo arriesgado), las ramas dejan de ser opcionales.

#### En resumen

El 90% de tu trabajo con Git se reduce a este ciclo:

```
git status
git add .
git commit -m "mensaje claro"
git push
```

Todo lo demás —ramas, merges, resolver conflictos— lo vas a ir aprendiendo sobre la marcha, cuando lo necesites de verdad. No hace falta memorizar treinta comandos antes de empezar: con esto ya puedes trabajar en cualquier proyecto real y llevar un historial decente de tus cambios.

Si todavía no tienes claro con qué editor o herramientas montar tu entorno de programación, échale un vistazo a [nuestro artículo sobre herramientas gratuitas para estudiantes de programación](#) antes de seguir.

---

## Notas para ti (Gonzalo), no para el blog

- Si me das el visto bueno, preparo el JSON en el formato que espera `scripts/crear-articulo.js` y lo dejo en tu proyecto listo para que lo importes como borrador con un solo comando.
- El enlace al artículo de "herramientas gratuitas" al final está como marcador `#` — dime la URL real de ese post (o el slug) y lo dejo enlazado de verdad; enlazar artículos entre sí ayuda tanto a SEO como a que la gente se quede más tiempo en el blog.
- Si quieres, la próxima tanda alterna con un artículo de noticias/opinión más corto (800-1.200 palabras) para no repetir formato dos veces seguidas.
