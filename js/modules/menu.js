/* ==========================================================================
   Módulo 2 · Menú hamburguesa responsivo
   - Evento click en el botón: abre/cierra el menú (clase .is_open)
   - Muta el atributo aria-expanded (true / false)
   - Delegación de eventos: un solo listener para todos los enlaces
   ========================================================================== */

/**
 * Inicializa el menú hamburguesa.
 */
export function init_menu() {
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

    const is_menu_open = () => menu_button.getAttribute("aria-expanded") === "true";

    // Clic en el botón: alterna entre abierto y cerrado
    menu_button.addEventListener("click", () => {
        set_menu_open(!is_menu_open());
    });

    // Delegación de eventos: un clic en cualquier enlace del menú lo cierra
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
        if (!event.target.closest(".main_nav") && is_menu_open()) {
            set_menu_open(false);
        }
    });

    // Si la pantalla pasa a tamaño escritorio, reiniciamos el estado del menú
    desktop_query.addEventListener("change", () => set_menu_open(false));
}
