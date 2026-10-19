# CV Interactivo · Adrián Calderón

Segunda Evaluación Práctica — **Tecnologías Web I (SIS-214)**
Universidad Católica Boliviana «San Pablo» · Gestión 2026

CV y portafolio personal construido con **HTML5 semántico, CSS3 y JavaScript ES6+ nativo**, sin frameworks ni dependencias externas. Esta versión amplía el CV del primer parcial con cinco funcionalidades dinámicas.

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
| 5 | **Consumo de API REST** | Consulta la API pública de GitHub con `fetch` + `async/await`, comprueba `response.ok`, maneja errores con `try...catch...finally` y muestra los estados **loading** (spinner y tarjetas fantasma), **success** y **error** (mensajes según el código HTTP: 403/429, 404, 5xx, sin conexión o tiempo agotado con `AbortController`). Incluye botón para reintentar. |

## 🏗️ Arquitectura

```
SIS214_ExamenPractico2_CalderonAdrian/
├── index.html          # Estructura semántica (header, nav, main, section, article, aside, footer)
├── css/
│   └── styles.css      # Reset, tokens de diseño, componentes y responsive mobile-first
├── js/
│   └── script.js       # Las 5 funcionalidades, separadas por bloques comentados
├── assets/
│   └── images/
│       └── foto.jpeg   # Fotografía de perfil
└── README.md
```

**Separación de responsabilidades:** el HTML define el contenido, el CSS la presentación y el JavaScript el comportamiento. El estado visual se controla con clases (`.dark_mode`, `.is_open`) y atributos ARIA (`aria-pressed`, `aria-expanded`), de modo que estilo y accesibilidad siempre coinciden.

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

El CSS incluye un **reset universal** y **tokens de diseño** en `:root` para colores, tipografía, espaciado, bordes y sombras. El modo oscuro solo redefine los tokens de color.

## ♿ Accesibilidad

- Etiquetas semánticas y jerarquía de encabezados correcta.
- Enlace para saltar al contenido principal.
- Foco visible en todos los elementos interactivos.
- `aria-expanded`, `aria-controls`, `aria-pressed`, `aria-invalid`, `aria-live`, `aria-busy`.
- Respeta `prefers-reduced-motion` y `prefers-color-scheme`.
- Todo el contenido dinámico se crea con `createElement` y `textContent` (sin `innerHTML`), lo que además evita inyección de HTML.

## 🛠️ Tecnologías

HTML5 · CSS3 (Grid, Flexbox, variables, media queries) · JavaScript ES6+ (async/await, fetch, desestructuración, spread, plantillas de texto, `.filter()`, `.map()`) · Web Storage API · GitHub REST API · Git · GitHub Pages

## ▶️ Ejecución local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/AdrianCald/SIS214_ExamenPractico2_CalderonAdrian.git
   cd SIS214_ExamenPractico2_CalderonAdrian
   ```

2. Levanta un servidor local (recomendado, para que `fetch` funcione igual que en producción):

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
