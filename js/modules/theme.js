/* ==========================================================================
   Módulo 1 · Tema claro / oscuro persistente
   - Alterna la clase .dark_mode en <body>
   - Guarda la preferencia en localStorage con JSON.stringify()
   - La recupera al cargar con JSON.parse()
   ========================================================================== */

// Clave con la que guardamos las preferencias en localStorage
const PREFERENCES_KEY = "cv_adrian_preferences";

// Nombre del evento que avisa a otros módulos (por ejemplo, el gráfico)
export const THEME_CHANGE_EVENT = "themechange";

/**
 * Lee las preferencias guardadas.
 * localStorage solo guarda texto: JSON.parse() lo convierte en objeto.
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
 * Aplica el tema en el DOM y actualiza la accesibilidad del botón.
 * @param {HTMLButtonElement} theme_button
 * @param {boolean} dark_mode_active
 */
function apply_theme(theme_button, dark_mode_active) {
    // toggle(clase, condición): agrega la clase si es true, la quita si es false
    document.body.classList.toggle("dark_mode", dark_mode_active);

    theme_button.textContent = dark_mode_active ? "☀️ Modo claro" : "🌙 Modo oscuro";

    // aria-pressed indica a lectores de pantalla si el modo oscuro está activo
    theme_button.setAttribute("aria-pressed", String(dark_mode_active));
    theme_button.setAttribute(
        "aria-label",
        dark_mode_active ? "Activar modo claro" : "Activar modo oscuro"
    );

    // Avisamos al resto de la aplicación que el tema cambió
    document.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark_mode: dark_mode_active } })
    );
}

/**
 * Inicializa el conmutador de tema.
 */
export function init_theme() {
    const theme_button = document.querySelector("#theme_button");

    // Al cargar: lo guardado o, si no hay nada, la preferencia del sistema
    const saved_preferences = load_preferences();
    const system_prefers_dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    apply_theme(theme_button, saved_preferences ? saved_preferences.dark_mode : system_prefers_dark);

    theme_button.addEventListener("click", () => {
        const dark_mode_active = !document.body.classList.contains("dark_mode");

        apply_theme(theme_button, dark_mode_active);
        save_preferences({ dark_mode: dark_mode_active });
    });
}
