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


/* ==========================================================================
   3. BUSCADOR / FILTRO DE PROYECTOS EN TIEMPO REAL
   ========================================================================== */

/**
 * Congela un objeto y todo lo que contiene para que no se pueda modificar.
 * Así garantizamos que los datos originales nunca se alteran al filtrar.
 */
function deep_freeze(value) {
    Object.values(value).forEach((inner) => {
        if (typeof inner === "object" && inner !== null) {
            deep_freeze(inner);
        }
    });
    return Object.freeze(value);
}

// Datos originales (fuente única de verdad). NUNCA se modifican.
const PROJECTS = deep_freeze([
    {
        id: 1,
        title: "VaJeiNa Planner",
        category: "web",
        tag: "WEB",
        description: "Aplicación web de planificación de tareas con almacenamiento en JSON, contenerizada con Docker.",
        technologies: ["PHP", "JavaScript", "CSS", "Docker"]
    },
    {
        id: 2,
        title: "Sistema de reservas para barberías",
        category: "web",
        tag: "WEB",
        description: "Sistema de reservas y administración para una barbería en Bolivia, con base de datos en la nube.",
        technologies: ["HTML", "CSS", "JavaScript", "Supabase", "PostgreSQL"]
    },
    {
        id: 3,
        title: "Proyecto orientado a objetos",
        category: "java",
        tag: "JAVA",
        description: "Aplicación en Java utilizando clases, herencia, polimorfismo, colecciones y componentes de interfaz.",
        technologies: ["Java", "POO", "Swing"]
    },
    {
        id: 4,
        title: "Estructuras de datos: Arreglo y Set",
        category: "java",
        tag: "JAVA",
        description: "Implementación propia de las estructuras Arreglo y Set, probadas con enteros, cadenas y objetos.",
        technologies: ["Java", "Eclipse", "Estructuras de datos"]
    },
    {
        id: 5,
        title: "Ajedrez con bot",
        category: "cpp",
        tag: "C++",
        description: "Juego de ajedrez con interfaz gráfica y un bot que evalúa capturas para jugar con las piezas negras.",
        technologies: ["C++", "Raylib", "Algoritmos"]
    },
    {
        id: 6,
        title: "Gestión de productos",
        category: "cpp",
        tag: "C++",
        description: "Programa de gestión de productos con vectores y lectura/escritura en archivos binarios.",
        technologies: ["C++", "Vectores", "Archivos binarios"]
    },
    {
        id: 7,
        title: "Triggers en PostgreSQL",
        category: "datos",
        tag: "DATOS",
        description: "Ejercicios con triggers para auditoría de empleados, conteo de préstamos y conteo de votos.",
        technologies: ["PostgreSQL", "PL/pgSQL", "pgAdmin"]
    },
    {
        id: 8,
        title: "Proyecto de Probabilidad y Estadística",
        category: "datos",
        tag: "DATOS",
        description: "Análisis de clientes y ventas de un negocio real aplicando estadística descriptiva e inferencial.",
        technologies: ["Estadística", "Excel", "Análisis de datos"]
    },
    {
        id: 9,
        title: "Sumador completo en Logisim",
        category: "hardware",
        tag: "HARDWARE",
        description: "Sumador completo de 1 bit construido a partir de dos multiplexores 8:1.",
        technologies: ["Logisim", "Circuitos digitales"]
    }
]);

const project_search = document.querySelector("#project_search");
const project_list = document.querySelector("#project_list");
const project_count = document.querySelector("#project_count");
const project_empty = document.querySelector("#project_empty");
const category_buttons = document.querySelectorAll(".chip[data-category]");

// Estado actual del filtro (lo único que cambia; los datos no)
const filter_state = {
    query: "",
    category: "todos"
};

/**
 * Normaliza texto para comparar: minúsculas y sin tildes.
 * Así "estadistica" encuentra "Estadística".
 * Se procesa carácter por carácter para conservar la misma longitud
 * (lo necesitamos para resaltar la coincidencia en el lugar correcto).
 */
function normalize_text(text) {
    return Array.from(text)
        .map((character) => character.normalize("NFD").charAt(0).toLowerCase().charAt(0))
        .join("");
}

/**
 * Devuelve los proyectos que cumplen los filtros.
 * .filter() crea un NUEVO arreglo: PROJECTS queda intacto.
 */
function get_filtered_projects({ query, category }) {
    const normalized_query = normalize_text(query.trim());

    return PROJECTS
        // 1) Filtra por categoría
        .filter((project) => category === "todos" || project.category === category)
        // 2) Filtra por texto (título, descripción o tecnologías)
        .filter((project) => {
            if (normalized_query === "") {
                return true;
            }

            const searchable_text = normalize_text(
                [project.title, project.description, ...project.technologies].join(" ")
            );

            return searchable_text.includes(normalized_query);
        });
}

/**
 * Crea un fragmento con el texto, resaltando con <mark> la parte buscada.
 * Usamos nodos de texto (no innerHTML) para evitar inyección de HTML.
 */
function create_highlighted_text(text, query) {
    const fragment = document.createDocumentFragment();
    const normalized_query = normalize_text(query.trim());

    if (normalized_query === "") {
        fragment.append(text);
        return fragment;
    }

    const normalized_text = normalize_text(text);
    let start = 0;
    let match_index = normalized_text.indexOf(normalized_query);
    const characters = Array.from(text);

    while (match_index !== -1) {
        // Texto antes de la coincidencia
        fragment.append(characters.slice(start, match_index).join(""));

        // La coincidencia, envuelta en <mark>
        const mark = document.createElement("mark");
        mark.textContent = characters.slice(match_index, match_index + normalized_query.length).join("");
        fragment.append(mark);

        start = match_index + normalized_query.length;
        match_index = normalized_text.indexOf(normalized_query, start);
    }

    // Texto restante después de la última coincidencia
    fragment.append(characters.slice(start).join(""));
    return fragment;
}

/**
 * Transforma un objeto proyecto en una tarjeta <article>.
 * Esta función se usa dentro de .map().
 */
function create_project_card(project, query) {
    const card = document.createElement("article");
    card.className = "project_card";

    const tag = document.createElement("span");
    tag.className = "project_tag";
    tag.textContent = project.tag;

    const title = document.createElement("h3");
    title.append(create_highlighted_text(project.title, query));

    const description = document.createElement("p");
    description.append(create_highlighted_text(project.description, query));

    const tech_list = document.createElement("ul");
    tech_list.className = "tech_list";
    tech_list.setAttribute("aria-label", "Tecnologías utilizadas");

    // .map() convierte cada tecnología (texto) en un <li>
    const tech_items = project.technologies.map((technology) => {
        const item = document.createElement("li");
        item.append(create_highlighted_text(technology, query));
        return item;
    });

    tech_list.append(...tech_items);
    card.append(tag, title, description, tech_list);

    return card;
}

/**
 * Dibuja en pantalla los proyectos que cumplen el filtro actual.
 */
function render_projects() {
    const visible_projects = get_filtered_projects(filter_state);

    // .map() transforma cada objeto en un elemento HTML
    const cards = visible_projects.map((project) => create_project_card(project, filter_state.query));

    // replaceChildren borra lo anterior y pone las nuevas tarjetas
    project_list.replaceChildren(...cards);

    const total = visible_projects.length;
    project_empty.hidden = total > 0;
    project_count.textContent =
        total === PROJECTS.length
            ? `Mostrando los ${total} proyectos.`
            : `${total} de ${PROJECTS.length} proyectos coinciden con la búsqueda.`;
}

// Evento "input": se dispara con cada tecla → búsqueda en tiempo real
project_search.addEventListener("input", (event) => {
    filter_state.query = event.target.value;
    render_projects();
});

// Escape dentro del buscador: limpia la búsqueda
project_search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && project_search.value !== "") {
        event.stopPropagation();
        project_search.value = "";
        filter_state.query = "";
        render_projects();
    }
});

// Botones de categoría
category_buttons.forEach((button) => {
    button.addEventListener("click", () => {
        filter_state.category = button.dataset.category;

        // Solo el botón pulsado queda con aria-pressed="true"
        category_buttons.forEach((other_button) => {
            other_button.setAttribute("aria-pressed", String(other_button === button));
        });

        render_projects();
    });
});

// Primer dibujado al cargar la página
render_projects();


