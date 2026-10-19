/* ==========================================================================
   CV Interactivo · Adrián Calderón
   Tecnologías Web I (SIS-214) · Segunda Evaluación Práctica

   Punto de entrada de la aplicación (módulo ES6).
   Cada funcionalidad vive en su propio módulo dentro de js/modules/:

     1. theme.js       → Tema claro/oscuro persistente (localStorage + JSON)
     2. menu.js        → Menú hamburguesa accesible (aria-expanded)
     3. projects.js    → Buscador en tiempo real (.filter() + .map()) + Chart.js
     4. form.js        → Formulario con validación nativa en tiempo real
     5. github-api.js  → API REST de GitHub (fetch + async/await + try/catch)
        animations.js  → Animaciones al hacer scroll (AOS)

   Los datos de los proyectos están en js/data/projects-data.js.
   ========================================================================== */

import { init_theme } from "./modules/theme.js";
import { init_menu } from "./modules/menu.js";
import { init_projects } from "./modules/projects.js";
import { init_contact_form } from "./modules/form.js";
import { init_github } from "./modules/github-api.js";
import { init_animations } from "./modules/animations.js";

// Avisamos al CSS que JavaScript está activo (mejora progresiva:
// sin JS, el menú se ve completo y el sitio sigue siendo usable)
document.documentElement.classList.add("js_enabled");

init_theme();
init_menu();
init_projects();
init_contact_form();
init_github();
init_animations();
