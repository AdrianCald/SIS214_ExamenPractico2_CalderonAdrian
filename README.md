# CV Interactivo · Adrián Calderón

Segunda Evaluación Práctica — **Tecnologías Web I (SIS-214)**
Universidad Católica Boliviana «San Pablo» · Gestión 2026

CV y portafolio personal construido con **HTML5 semántico, CSS3 y JavaScript ES6+ modular**, sin frameworks. Usa dos librerías permitidas por la cátedra: **AOS** (animaciones al hacer scroll) y **Chart.js** (gráficos). Esta versión amplía el CV del primer parcial con cinco funcionalidades dinámicas.

## 🔗 Enlaces

| Recurso | URL |
| --- | --- |
| Sitio publicado (GitHub Pages) | https://adriancald.github.io/SIS214_ExamenPractico2_CalderonAdrian/ |
| Repositorio | https://github.com/AdrianCald/SIS214_ExamenPractico2_CalderonAdrian |

## ✨ Funcionalidades

| # | Funcionalidad | Implementación |
| --- | --- | --- |
| 1 | **Tema claro/oscuro persistente** | Las preferencias se guardan como objeto en `localStorage` con `JSON.stringify()` y se recuperan con `JSON.parse()` dentro de `try...catch`. Si no hay nada guardado, se respeta `prefers-color-scheme` del sistema. El botón actualiza `aria-pressed` y `aria-label`. |
| 2 | **Menú hamburguesa** | Visible en móvil y tablet (≤ 1024px). Actualiza `aria-expanded` y `aria-label`, se cierra al elegir un enlace, con la tecla `Escape` o al hacer clic fuera. Usa mejora progresiva: sin JavaScript el menú se ve completo. |
| 3 | **Buscador de proyectos en tiempo real** | Los datos están en un arreglo congelado (`Object.freeze`) que nunca se modifica. Cada evento `input` aplica `.filter()` (categoría + texto, sin distinguir tildes ni mayúsculas) y `.map()` para convertir cada objeto en una tarjeta. Resalta coincidencias con `<mark>` y anuncia el número de resultados con `aria-live`. |
| 4 | **Formulario con validación** | `event.preventDefault()` en `submit`, validación nativa con la Constraint Validation API (`checkValidity()`, `validity`, `setCustomValidity()`) y validación en tiempo real con el evento `input`. Mensajes específicos por tipo de error, `aria-invalid`, contador de caracteres y foco en el primer campo con error. |
| 5 | **Consumo de API REST** | Consulta la API pública de GitHub con `fetch` + `async/await`, comprueba `response.ok`, maneja errores con `try...catch...finally` y muestra los estados **loading** (spinner y tarjetas fantasma), **success** y **error**. Gestiona explícitamente los códigos HTTP (ver tabla abajo), además de falta de conexión y tiempo agotado con `AbortController`. Incluye botón para reintentar. |

### Códigos HTTP gestionados

| Código | Mensaje mostrado |
| --- | --- |
| 200 OK | Datos recibidos correctamente (estado *success*) |
| 400 Bad Request | La solicitud no es válida |
| 401 Unauthorized | GitHub rechazó la autenticación |
| 403 Forbidden / 429 Too Many Requests | Límite de consultas alcanzado |
| 404 Not Found | Usuario no encontrado |
| 500 / 502 / 503 | Error o indisponibilidad del servidor de GitHub |
| Otros 4xx / 5xx | Se clasifican por rango |

## 📚 Librerías

| Librería | Versión | Uso en el proyecto |
| --- | --- | --- |
| [AOS](https://michalsnik.github.io/aos/) | 2.3.4 | Las secciones aparecen con animación al hacer scroll (`data-aos="fade-up"`). Se desactiva si el usuario prefiere movimiento reducido. |
| [Chart.js](https://www.chartjs.org/) | 4.5.1 | Gráfico de barras con la cantidad de proyectos por categoría. Se actualiza en tiempo real con el buscador y cambia de colores con el tema. |

Ambas se guardan en la carpeta `libs/` (no dependen de un CDN externo). Si alguna no carga, el sitio sigue funcionando sin ella.

## 🏗️ Arquitectura

```
SIS214_ExamenPractico2_CalderonAdrian/
├── index.html                  # Estructura semántica (header, nav, main, section, article, aside, footer)
├── css/
│   └── styles.css              # Reset universal, tokens de diseño, componentes y responsive mobile-first
├── js/
│   ├── main.js                 # Punto de entrada: importa e inicializa los módulos
│   ├── data/
│   │   └── projects-data.js    # Datos inmutables de los proyectos (Object.freeze)
│   └── modules/
│       ├── theme.js            # 1. Tema claro/oscuro persistente
│       ├── menu.js             # 2. Menú hamburguesa accesible
│       ├── projects.js         # 3. Buscador en tiempo real + gráfico Chart.js
│       ├── form.js             # 4. Formulario con validación en tiempo real
│       ├── github-api.js       # 5. Consumo de la API REST de GitHub
│       └── animations.js       # Animaciones con AOS
├── libs/
│   ├── aos/                    # aos.js + aos.css
│   └── chartjs/                # chart.umd.min.js
├── assets/
│   └── images/
│       └── foto.jpeg           # Fotografía de perfil
└── README.md
```

**Separación de responsabilidades:** el HTML define el contenido, el CSS la presentación y el JavaScript el comportamiento. El JavaScript está dividido en **módulos ES6** (`import`/`export`), uno por funcionalidad, cargados desde `main.js` con `<script type="module">`. El estado visual se controla con clases (`.dark_mode`, `.is_open`) y atributos ARIA (`aria-pressed`, `aria-expanded`), de modo que estilo y accesibilidad siempre coinciden.

**Flujo de la API REST:**

```
load_github_data()
  ├─ set_api_state("loading")  → spinner + tarjetas fantasma
  ├─ Promise.all([fetch usuario, fetch repositorios])
  │     └─ response.ok === false → throw HttpError(status)
  ├─ éxito → render_profile() + render_repos() → set_api_state("success")
  ├─ catch → mensaje según el error → set_api_state("error")
  └─ finally → se cancela el temporizador
```

## 📱 Diseño responsive

Enfoque **mobile-first** con estos puntos de quiebre:

| Dispositivo | Ancho | Comportamiento |
| --- | --- | --- |
| Móvil | < 768px | Una columna, menú hamburguesa en lista |
| Tablet | 768px – 1024px | Dos columnas, menú hamburguesa en cuadrícula |
| Escritorio | > 1024px | Tres o cuatro columnas, menú horizontal siempre visible |

El CSS incluye el **reset universal** exigido (`* { box-sizing: border-box; margin: 0; padding: 0; }`) y **tokens de diseño** en `:root`: `--primary-color`, `--secondary-color`, `--bg-color`, `--text-color`, `--font-family-base` y `--spacing-unit`, más tokens complementarios de bordes y sombras. Toda la escala de espaciado se calcula a partir de `--spacing-unit`. El modo oscuro solo redefine los tokens de color.

**Flexbox** se usa para alineaciones en una dimensión (navegación, botones, filtros, formulario) y **CSS Grid** para la maquetación en dos dimensiones (tarjetas de proyectos y habilidades, línea de tiempo, perfil con su `aside`, sección de GitHub).

## ♿ Accesibilidad

- Etiquetas semánticas y jerarquía de encabezados correcta.
- Enlace para saltar al contenido principal.
- Foco visible en todos los elementos interactivos.
- `aria-expanded`, `aria-controls`, `aria-pressed`, `aria-invalid`, `aria-live`, `aria-busy`.
- Respeta `prefers-reduced-motion` y `prefers-color-scheme`.
- Todo el contenido dinámico se crea con `createElement` y `textContent` (sin `innerHTML`), lo que además evita inyección de HTML.
- Delegación de eventos en el menú y en los filtros de categoría.

## 🛠️ Tecnologías

HTML5 · CSS3 (Grid, Flexbox, variables, media queries) · JavaScript ES6+ (módulos, async/await, fetch, desestructuración, spread, plantillas de texto, `.filter()`, `.map()`) · Web Storage API · GitHub REST API · AOS · Chart.js · Git · GitHub Pages

## ▶️ Ejecución local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/AdrianCald/SIS214_ExamenPractico2_CalderonAdrian.git
   cd SIS214_ExamenPractico2_CalderonAdrian
   ```

2. Levanta un servidor local. **Es necesario**: los módulos ES6 (`type="module"`) no se cargan abriendo `index.html` con doble clic (`file://`).

   ```bash
   # Opción A: Python
   python -m http.server 8000
   # Luego abre http://localhost:8000

   # Opción B: extensión "Live Server" de Visual Studio Code
   # Clic derecho en index.html → "Open with Live Server"
   ```

> La sección de GitHub necesita conexión a internet. La API pública permite 60 consultas por hora por IP; si se supera, el sitio muestra el estado de error con un mensaje claro.

## 🚀 Despliegue

Publicado con **GitHub Pages** desde la rama `main`, carpeta raíz (`Settings → Pages → Deploy from a branch`).

## 👤 Autor

**Adrián Calderón** — Estudiante de Ingeniería de Sistemas
Universidad Católica Boliviana «San Pablo», La Paz, Bolivia
