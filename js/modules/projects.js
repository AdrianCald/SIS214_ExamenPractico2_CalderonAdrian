/* ==========================================================================
   Módulo 3 · Buscador / filtro de proyectos en tiempo real
   - Evento input: filtra mientras se escribe
   - Tubería funcional: .filter() → .filter() → .map()
   - Los datos originales (PROJECTS) nunca se modifican
   - Gráfico con Chart.js que se actualiza con cada filtro
   ========================================================================== */

import { PROJECTS, CATEGORIES } from "../data/projects-data.js";
import { THEME_CHANGE_EVENT } from "./theme.js";

// Estado actual del filtro (lo único que cambia; los datos no)
const filter_state = {
    query: "",
    category: "todos"
};

// Referencias al DOM (se asignan en init_projects)
let project_list;
let project_count;
let project_empty;

// Instancia del gráfico de Chart.js y las categorías que muestra
let projects_chart = null;
let chart_keys = [];


/* --------------------------------------------------------------------------
   Utilidades de texto
   -------------------------------------------------------------------------- */

/**
 * Normaliza texto para comparar: minúsculas y sin tildes.
 * Así "estadistica" encuentra "Estadística".
 * Se procesa carácter por carácter para conservar la misma longitud
 * (lo necesitamos para resaltar la coincidencia en el lugar correcto).
 * @param {string} text
 * @returns {string}
 */
function normalize_text(text) {
    return Array.from(text)
        .map((character) => character.normalize("NFD").charAt(0).toLowerCase().charAt(0))
        .join("");
}

/**
 * Crea un fragmento con el texto, resaltando con <mark> la parte buscada.
 * Usamos nodos de texto (no innerHTML) para evitar inyección de HTML.
 * @param {string} text
 * @param {string} query
 * @returns {DocumentFragment}
 */
function create_highlighted_text(text, query) {
    const fragment = document.createDocumentFragment();
    const normalized_query = normalize_text(query.trim());

    if (normalized_query === "") {
        fragment.append(text);
        return fragment;
    }

    const characters = Array.from(text);
    const normalized_text = normalize_text(text);
    let start = 0;
    let match_index = normalized_text.indexOf(normalized_query);

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


/* --------------------------------------------------------------------------
   Filtrado (tubería funcional)
   -------------------------------------------------------------------------- */

/**
 * Devuelve los proyectos que cumplen los filtros.
 * .filter() crea un NUEVO arreglo: PROJECTS queda intacto.
 * @param {{query: string, category: string}} state
 * @returns {Array<object>}
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


/* --------------------------------------------------------------------------
   Renderizado de tarjetas
   -------------------------------------------------------------------------- */

/**
 * Transforma un objeto proyecto en una tarjeta <article>.
 * Esta función se usa dentro de .map().
 * @param {object} project
 * @param {string} query
 * @returns {HTMLElement}
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


/* --------------------------------------------------------------------------
   Gráfico con Chart.js
   -------------------------------------------------------------------------- */

/**
 * Lee un token de color definido en CSS (así el gráfico respeta el tema).
 * @param {string} name nombre de la variable CSS, por ejemplo "--accent-color"
 * @returns {string}
 */
function css_token(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
}

/**
 * Cuenta cuántos proyectos visibles hay en cada categoría.
 * Tubería: Object.entries → .map() (y .filter() para contar).
 * @param {Array<object>} visible_projects
 * @returns {{labels: string[], totals: number[], keys: string[]}}
 */
function count_by_category(visible_projects) {
    const rows = Object.entries(CATEGORIES).map(([key, label]) => ({
        key,
        label,
        total: visible_projects.filter((project) => project.category === key).length
    }));

    return {
        keys: rows.map((row) => row.key),
        labels: rows.map((row) => row.label),
        totals: rows.map((row) => row.total)
    };
}

/**
 * Colores de las barras: la categoría seleccionada resalta.
 * @param {string[]} keys
 * @returns {string[]}
 */
function get_bar_colors(keys) {
    const accent = css_token("--accent-color");
    const secondary = css_token("--secondary-color");

    return keys.map((key) =>
        filter_state.category === "todos" || filter_state.category === key ? accent : secondary
    );
}

/**
 * Crea el gráfico. Si Chart.js no cargó, el sitio sigue funcionando sin él.
 */
function create_chart() {
    const canvas = document.querySelector("#projects_chart");

    if (typeof window.Chart === "undefined" || canvas === null) {
        console.warn("Chart.js no está disponible; se omite el gráfico.");
        canvas?.closest("figure")?.setAttribute("hidden", "");
        return;
    }

    const reduce_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    projects_chart = new window.Chart(canvas, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Proyectos",
                data: [],
                backgroundColor: [],
                borderRadius: 6,
                maxBarThickness: 42
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: reduce_motion ? false : { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.parsed.y} proyecto(s)`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: {}
                },
                x: {
                    ticks: {},
                    grid: { display: false }
                }
            }
        }
    });

    apply_chart_theme();
}

/**
 * Ajusta los colores del texto y la cuadrícula al tema actual.
 */
function apply_chart_theme() {
    if (projects_chart === null) {
        return;
    }

    const text_color = css_token("--muted-color");
    const grid_color = css_token("--border-color");

    projects_chart.options.scales.x.ticks.color = text_color;
    projects_chart.options.scales.y.ticks.color = text_color;
    projects_chart.options.scales.y.grid.color = grid_color;
    projects_chart.data.datasets[0].backgroundColor = get_bar_colors(chart_keys);
    projects_chart.update();
}

/**
 * Actualiza los datos del gráfico con los proyectos visibles.
 * @param {Array<object>} visible_projects
 */
function update_chart(visible_projects) {
    if (projects_chart === null) {
        return;
    }

    const { keys, labels, totals } = count_by_category(visible_projects);

    chart_keys = keys;
    projects_chart.data.labels = labels;
    projects_chart.data.datasets[0].data = totals;
    projects_chart.data.datasets[0].backgroundColor = get_bar_colors(keys);
    projects_chart.update();
}


/* --------------------------------------------------------------------------
   Render principal e inicialización
   -------------------------------------------------------------------------- */

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

    update_chart(visible_projects);
}

/**
 * Inicializa el buscador, los botones de categoría y el gráfico.
 */
export function init_projects() {
    const project_search = document.querySelector("#project_search");
    const category_filters = document.querySelector(".category_filters");

    project_list = document.querySelector("#project_list");
    project_count = document.querySelector("#project_count");
    project_empty = document.querySelector("#project_empty");

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

    // Delegación de eventos: un solo listener para todos los botones de categoría
    category_filters.addEventListener("click", (event) => {
        const button = event.target.closest(".chip[data-category]");

        if (button === null) {
            return;
        }

        filter_state.category = button.dataset.category;

        // Solo el botón pulsado queda con aria-pressed="true"
        category_filters.querySelectorAll(".chip").forEach((chip) => {
            chip.setAttribute("aria-pressed", String(chip === button));
        });

        render_projects();
    });

    // Cuando cambia el tema, el gráfico actualiza sus colores
    document.addEventListener(THEME_CHANGE_EVENT, apply_chart_theme);

    create_chart();
    render_projects();
}
