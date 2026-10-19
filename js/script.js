/* ==========================================================================
   CV Interactivo · Adrián Calderón
   Tecnologías Web I (SIS-214) · Segunda Evaluación Práctica

   Funcionalidades:
     1. Tema claro/oscuro persistente (localStorage + JSON.stringify/parse)
     2. Menú hamburguesa accesible (aria-expanded)
     3. Buscador de proyectos en tiempo real (.filter() + .map())
     4. Formulario con validación nativa en tiempo real (input + submit)
     5. Consumo de la API REST de GitHub (fetch + async/await + try...catch)
   ========================================================================== */

"use strict";

// Avisamos al CSS que JavaScript está activo (mejora progresiva:
// sin JS, el menú se ve completo y el sitio sigue siendo usable).
document.documentElement.classList.add("js_enabled");


/* ==========================================================================
   1. TEMA CLARO / OSCURO PERSISTENTE
   ========================================================================== */

// Clave con la que guardamos las preferencias en localStorage
const PREFERENCES_KEY = "cv_adrian_preferences";

const theme_button = document.querySelector("#theme_button");

/**
 * Lee las preferencias guardadas.
 * localStorage solo guarda texto, por eso usamos JSON.parse() para
 * convertir ese texto otra vez en un objeto de JavaScript.
 * @returns {{dark_mode: boolean} | null}
 */
function load_preferences() {
    try {
        const saved_text = localStorage.getItem(PREFERENCES_KEY);

        // Si nunca se guardó nada, devolvemos null
        if (saved_text === null) {
            return null;
        }

        const preferences = JSON.parse(saved_text);

        // Validamos que el objeto tenga la forma esperada
        if (typeof preferences?.dark_mode !== "boolean") {
            return null;
        }

        return preferences;
    } catch (error) {
        // JSON dañado o localStorage bloqueado (modo privado): lo ignoramos
        console.warn("No se pudieron leer las preferencias guardadas.", error);
        return null;
    }
}

/**
 * Guarda las preferencias.
 * JSON.stringify() convierte el objeto en texto para poder guardarlo.
 * @param {{dark_mode: boolean}} preferences
 */
function save_preferences(preferences) {
    try {
        const preferences_text = JSON.stringify({
            ...preferences,
            updated_at: new Date().toISOString()
        });

        localStorage.setItem(PREFERENCES_KEY, preferences_text);
    } catch (error) {
        console.warn("No se pudieron guardar las preferencias.", error);
    }
}

/**
 * Aplica el tema visualmente y actualiza la accesibilidad del botón.
 * @param {boolean} dark_mode_active
 */
function apply_theme(dark_mode_active) {
    // toggle(clase, condición): agrega la clase si es true, la quita si es false
    document.body.classList.toggle("dark_mode", dark_mode_active);

    theme_button.textContent = dark_mode_active ? "☀️ Modo claro" : "🌙 Modo oscuro";

    // aria-pressed indica a lectores de pantalla si el modo oscuro está activo
    theme_button.setAttribute("aria-pressed", String(dark_mode_active));
    theme_button.setAttribute(
        "aria-label",
        dark_mode_active ? "Activar modo claro" : "Activar modo oscuro"
    );
}

// Al cargar la página: usamos lo guardado o, si no hay nada,
// la preferencia del sistema operativo del usuario.
const saved_preferences = load_preferences();
const system_prefers_dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

apply_theme(saved_preferences ? saved_preferences.dark_mode : system_prefers_dark);

theme_button.addEventListener("click", () => {
    const dark_mode_active = !document.body.classList.contains("dark_mode");

    apply_theme(dark_mode_active);
    save_preferences({ dark_mode: dark_mode_active });
});


/* ==========================================================================
   2. MENÚ HAMBURGUESA
   ========================================================================== */

const menu_button = document.querySelector("#menu_button");
const main_menu = document.querySelector("#main_menu");

// Media query de escritorio (> 1024px): ahí el menú siempre está visible
const desktop_query = window.matchMedia("(min-width: 1025px)");

/**
 * Abre o cierra el menú y sincroniza los atributos ARIA.
 * @param {boolean} is_open
 */
function set_menu_open(is_open) {
    menu_button.setAttribute("aria-expanded", String(is_open));
    menu_button.setAttribute(
        "aria-label",
        is_open ? "Cerrar menú de navegación" : "Abrir menú de navegación"
    );
    main_menu.classList.toggle("is_open", is_open);
}

function is_menu_open() {
    return menu_button.getAttribute("aria-expanded") === "true";
}

// Clic en el botón: alterna entre abierto y cerrado
menu_button.addEventListener("click", () => {
    set_menu_open(!is_menu_open());
});

// Clic en un enlace del menú: navegamos y cerramos el menú
main_menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
        set_menu_open(false);
    }
});

// Tecla Escape: cierra el menú y devuelve el foco al botón
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && is_menu_open()) {
        set_menu_open(false);
        menu_button.focus();
    }
});

// Clic fuera del menú: lo cerramos
document.addEventListener("click", (event) => {
    const clicked_inside_nav = event.target.closest(".main_nav");

    if (!clicked_inside_nav && is_menu_open()) {
        set_menu_open(false);
    }
});

// Si la pantalla pasa a tamaño escritorio, reiniciamos el estado del menú
desktop_query.addEventListener("change", () => set_menu_open(false));


