# Cómo funciona el SEO y cómo hacer que Blog Dev aparezca en más sitios

Guía de referencia para Blog Dev. Pensada para volver a ella cuando haga falta, no para leerla de una sentada.

## 1. Lo básico: qué hace Google (y Bing) con tu blog

Un buscador hace tres cosas, en este orden, y cada una puede fallar por separado:

1. **Rastreo (crawling):** un robot (Googlebot) visita tus páginas siguiendo enlaces, tu sitemap o notificaciones directas. Si no te rastrea, no existes para el buscador.
2. **Indexación:** de lo rastreado, decide qué guarda en su base de datos para poder mostrarlo en resultados. Puede rastrear una página y decidir no indexarla (contenido duplicado, poco valor, etc.).
3. **Ranking:** de lo indexado, decide en qué orden lo muestra para cada búsqueda. Aquí entran cientos de señales.

Tu blog puede fallar en cualquiera de los tres pasos por motivos distintos, así que cuando algo "no aparece en Google" primero hay que averiguar en cuál de los tres se ha quedado atascado (Search Console, que ves en el punto 3, te lo dice).

## 2. Lo que Blog Dev ya tiene hecho

Esto ya está implementado en el código, no es trabajo pendiente — lo dejo aquí para que sepas con qué cuentas:

- **Sitemap dinámico** (`/sitemap.xml`) que solo incluye artículos publicados (el bug de que salieran borradores ya está arreglado).
- **`robots.txt`** con la línea `Sitemap:` apuntando al sitemap, para que cualquier rastreador lo encuentre sin que tengas que avisarlo manualmente.
- **RSS feed** (`/rss.xml`) con los últimos 20 artículos publicados.
- **Datos estructurados JSON-LD** (`Article` y `BreadcrumbList`) en cada artículo, que ayudan a que Google entienda de qué trata la página y pueda mostrar resultados enriquecidos (fecha, autor, migas de pan) en el buscador.
- **URLs canónicas** en cada página, para evitar problemas de contenido duplicado.
- **Open Graph y Twitter Cards** con imagen de reserva garantizada, para que los enlaces se vean bien al compartirlos en redes o chats.
- **Analítica opcional vía Cloudflare** (gratuita, sin cookies), lista para activar cuando quieras medir tráfico real.

En otras palabras: la parte técnica de "que un rastreador pueda entender y encontrar tu contenido" está cubierta. Lo que falta es la parte que no se resuelve con código: decirles a los buscadores que existes, y conseguir que otros sitios te mencionen.

## 3. Lo que te toca hacer a ti: darte de alta en los buscadores

Tener sitemap y robots.txt no basta — son "pistas", como dice la propia documentación de Google, no una garantía de rastreo. Hay que dar un par de pasos activos.

### Google Search Console (imprescindible, gratis)

1. Entra en [search.google.com/search-console](https://search.google.com/search-console) con una cuenta de Google.
2. Verifica que el blog es tuyo. El método más simple para un sitio como el tuyo suele ser añadir una etiqueta HTML en el `<head>` (Search Console te da el código) o verificar el dominio a través de tu proveedor DNS si lo prefieres.
3. Una vez verificado, ve a "Sitemaps" en el menú y envía la URL de tu sitemap (`https://blog-web-production-42cf.up.railway.app/sitemap.xml`).
4. A partir de ahí, revisa estos informes de vez en cuando (una vez al mes es más que suficiente):
   - **Rendimiento en la búsqueda:** qué artículos generan clics e impresiones, y con qué búsquedas.
   - **Cobertura / Páginas:** qué páginas están indexadas y cuáles Google ha excluido (y por qué).
   - **Resultados enriquecidos:** si tus datos estructurados (Article, Breadcrumb) se están leyendo bien.
   - **Acciones manuales:** te avisaría aquí si Google penalizara el sitio por algo (muy raro que pase, pero es gratis comprobarlo).

Este paso es el más importante de toda la guía. Sin verificar el sitio no tienes visibilidad de nada de lo anterior, y sin enviar el sitemap dependes solo de que Google te encuentre por su cuenta (que también pasa, pero más lento).

### Bing Webmaster Tools + IndexNow

Bing tiene su propia consola (bing.com/webmasters), también gratuita, con el mismo concepto de verificación + sitemap. Vale la pena porque:

- Bing alimenta buscadores como DuckDuckGo y Yahoo, así que un solo alta te da presencia en varios sitios a la vez.
- Soporta **IndexNow**, un protocolo abierto y gratuito (también usado por Yandex) que permite avisar al instante cuando publicas o actualizas un artículo, en lugar de esperar a que el rastreador pase por su cuenta. Bing Webmaster Tools tiene una sección para activarlo con un par de clics; no hace falta tocar código para la versión básica. Google, de momento, no participa en IndexNow.

No es tan crítico como Search Console (Google sigue siendo, con diferencia, el buscador que más tráfico te va a traer), pero es diez minutos de trabajo por un canal extra gratis.

## 4. Qué es lo que realmente mueve el ranking

Aquí conviene desmontar un par de mitos antes de que te los vendan como "trucos":

- **No existe una longitud mágica.** Google lo dice explícitamente: el número de palabras no es un factor de calidad ni de posicionamiento. Lo que puntúa es resolver el problema del lector, ni más ni menos relleno. (Por eso el artículo de Git tiene la extensión que tiene, ni más ni menos.)
- **Lo que sí importa, según la propia guía de Google, es contenido "people-first":** escrito para ayudar a alguien real, no para "capturar" una búsqueda. Las señales que mencionan son cosas como aportar algo propio (tu experiencia, tu punto de vista), cubrir el tema de forma completa, dejar claro quién lo escribe, y ser factualmente correcto.
- **El marco que usan para evaluar esto se llama E-E-A-T** (Experiencia, Especialización, Autoridad, Confianza — por sus siglas en inglés). Para un blog de programación, "experiencia" y "especialización" se demuestran con ejemplos reales, código que funciona de verdad y explicaciones que van más allá de copiar la documentación oficial.
- Los enlaces externos que apuntan a tu web (backlinks) siguen ayudando en la práctica a que un sitio nuevo gane visibilidad más rápido, aunque la documentación de contenido de Google no los menciona como factor directo — los tratan más como una consecuencia natural de tener contenido que otros quieren enlazar, que como un objetivo en sí mismo. Dicho de otra forma: no persigas enlaces, persigue que la gente quiera compartir tus artículos, y los enlaces vendrán solos con el tiempo.

## 5. Cómo aparecer en más lugares (no solo en Google)

Esto es lo que más control tienes para mover a corto plazo, porque no depende del algoritmo de nadie:

- **Cross-posting en comunidades de desarrolladores:** dev.to y Hashnode permiten republicar tus artículos (con un enlace "canónico" a tu blog, así no te penaliza por duplicado) y tienen su propio público buscando justo este tipo de contenido. Es la forma más rápida de conseguir lectores nuevos y, si el artículo gusta, backlinks reales.
- **Comunidades en español:** subreddits como r/devparaprincipiantes o r/webdev en español, foros como los de MundoDev, o grupos de Telegram/Discord de programación en español. La clave es no ir solo a dejar el enlace — participa, responde preguntas, y comparte el artículo cuando de verdad responde a lo que alguien preguntó.
- **Directorios y agregadores de blogs técnicos:** existen "planets" y agregadores de RSS de blogs de programación (algunos en español) que aceptan altas manuales; como ya tienes RSS funcionando, darte de alta es trabajo de un formulario, no de código.
- **Redes sociales:** LinkedIn y X/Twitter para compartir cada artículo nuevo con un resumen propio (no solo el título pegado) suele funcionar mejor que solo el enlace suelto.
- **Enlazar tus propios artículos entre sí:** cada vez que menciones un tema que ya cubriste, enlázalo (como hice con el ejemplo del artículo de Git al final del de "elegir tu primer curso"). Ayuda al lector, ayuda a que Google entienda la relación entre tus páginas, y reparte "autoridad" interna entre artículos.
- **Boletín/newsletter:** aunque no es SEO estrictamente, tener una lista de correo propia es el único canal de distribución que no depende de ningún algoritmo — lo tengo apuntado como mejora pendiente más abajo en la lista de mejoras del blog.

## 6. Qué NO hacer

- No compres backlinks ni uses "granjas de enlaces" — Google los detecta y penaliza, y el efecto es el contrario al buscado.
- No dupliques contenido de otros blogs ni generes artículos solo para "meter palabras clave" — la guía de contenido útil de Google es explícita en que penaliza justo esto.
- No te obsesiones con la posición en el buscador en las primeras semanas: un blog nuevo tarda típicamente varios meses en acumular señales de confianza. Es normal no ver movimiento inmediato aunque todo esté bien configurado.

## 7. Checklist de mantenimiento (una vez al mes)

- Revisar el informe de Rendimiento en Search Console: ¿qué búsquedas traen gente? ¿hay algo que la gente busca y no tienes cubierto?
- Revisar Cobertura/Páginas: ¿algo dejó de indexarse?
- Comprobar que el sitemap sigue actualizado automáticamente (ya es dinámico, no requiere acción, pero conviene confirmarlo de vez en cuando desde el propio informe).
- Publicar y compartir en al menos una comunidad o red cada artículo nuevo.

---

Fuentes consultadas: documentación oficial de Google Search Central (guía de sitemaps, guía de contenido útil y E-E-A-T) y la página oficial de IndexNow en Bing.
