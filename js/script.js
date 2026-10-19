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


/* ==========================================================================
   4. FORMULARIO DE CONTACTO CON VALIDACIÓN EN TIEMPO REAL
   ========================================================================== */

const contact_form = document.querySelector("#contact_form");
const form_message = document.querySelector("#form_message");
const message_counter = document.querySelector("#mensaje_counter");

// Bandera para distinguir el botón "Limpiar" del reset que hacemos tras un envío exitoso
let is_programmatic_reset = false;

/*
 * Cada campo tiene mensajes según el TIPO de error.
 * input.validity es la API de validación nativa del navegador:
 *   valueMissing    → falta un campo obligatorio (required)
 *   typeMismatch    → el formato no corresponde (type="email")
 *   tooShort        → menos caracteres que minlength
 *   patternMismatch → no cumple el pattern
 *   customError     → error definido por nosotros con setCustomValidity()
 */
const fields = {
    nombre: {
        input: document.querySelector("#nombre"),
        error: document.querySelector("#nombre_error"),
        messages: {
            valueMissing: "Escribe tu nombre completo.",
            tooShort: "El nombre debe tener al menos 3 caracteres.",
            customError: "El nombre no puede contener solo espacios."
        }
    },
    correo: {
        input: document.querySelector("#correo"),
        error: document.querySelector("#correo_error"),
        messages: {
            valueMissing: "Escribe tu correo electrónico.",
            typeMismatch: "Introduce un correo válido, por ejemplo: nombre@correo.com."
        }
    },
    telefono: {
        input: document.querySelector("#telefono"),
        error: document.querySelector("#telefono_error"),
        messages: {
            patternMismatch: "Usa entre 7 y 20 caracteres: números, espacios, +, - o paréntesis."
        }
    },
    motivo: {
        input: document.querySelector("#motivo"),
        error: document.querySelector("#motivo_error"),
        messages: {
            valueMissing: "Selecciona un motivo de contacto."
        }
    },
    mensaje: {
        input: document.querySelector("#mensaje"),
        error: document.querySelector("#mensaje_error"),
        messages: {
            valueMissing: "Escribe tu mensaje.",
            tooShort: "El mensaje debe tener al menos 10 caracteres.",
            customError: "El mensaje no puede contener solo espacios."
        }
    },
    aceptacion: {
        input: document.querySelector("#aceptacion"),
        error: document.querySelector("#aceptacion_error"),
        messages: {
            valueMissing: "Debes aceptar el uso de tus datos para poder enviar el mensaje."
        }
    }
};

/**
 * Busca el primer error que tenga el campo y devuelve su mensaje.
 */
function get_error_message(field) {
    const { validity } = field.input;

    const error_type = Object.keys(field.messages).find((type) => validity[type]);

    return error_type ? field.messages[error_type] : "Revisa este campo.";
}

/**
 * Valida un campo usando la validación nativa del navegador
 * y muestra (o borra) su mensaje de error.
 * @returns {boolean} true si el campo es válido
 */
function validate_field(field) {
    const { input, error } = field;

    // Regla extra: los textos obligatorios no pueden ser solo espacios.
    // setCustomValidity("...") marca el campo como inválido; "" lo limpia.
    if (input.id === "nombre" || input.id === "mensaje") {
        const only_spaces = input.value.length > 0 && input.value.trim() === "";
        input.setCustomValidity(only_spaces ? "solo espacios" : "");
    }

    // checkValidity() revisa required, type, minlength, pattern, etc.
    const is_valid = input.checkValidity();

    error.textContent = is_valid ? "" : get_error_message(field);

    // Clases para el color del borde y aria-invalid para lectores de pantalla
    input.classList.toggle("invalid", !is_valid);
    input.classList.toggle("valid", is_valid && input.value.trim() !== "" && input.type !== "checkbox");
    input.setAttribute("aria-invalid", String(!is_valid));

    return is_valid;
}

/**
 * Actualiza el contador de caracteres del mensaje.
 */
function update_message_counter() {
    const { input } = fields.mensaje;
    const length = input.value.length;

    message_counter.textContent = `${length} / ${input.maxLength}`;
    message_counter.classList.toggle("near_limit", length >= input.maxLength * 0.9);
}

/**
 * Quita todos los estados visuales del formulario.
 */
function clear_form_feedback() {
    Object.values(fields).forEach(({ input, error }) => {
        input.classList.remove("invalid", "valid");
        input.removeAttribute("aria-invalid");
        error.textContent = "";
    });

    update_message_counter();
}

// Validación en tiempo real
Object.values(fields).forEach((field) => {
    // Los checkbox y select avisan con "change"; los textos con "input"
    const live_event = field.input.type === "checkbox" || field.input.tagName === "SELECT"
        ? "change"
        : "input";

    // "input": se valida mientras el usuario escribe
    field.input.addEventListener(live_event, () => {
        validate_field(field);

        if (field.input.id === "mensaje") {
            update_message_counter();
        }

        // Si había un mensaje general de error, lo limpiamos al corregir
        if (form_message.classList.contains("error")) {
            form_message.textContent = "";
            form_message.className = "form_message";
        }
    });

    // "blur": se valida al salir del campo (por ejemplo, si lo dejó vacío)
    field.input.addEventListener("blur", () => validate_field(field));
});

// Envío del formulario
contact_form.addEventListener("submit", (event) => {
    // Evita que la página se recargue al enviar
    event.preventDefault();

    // Validamos TODOS los campos (map + every nos da true solo si todos son válidos)
    const results = Object.values(fields).map((field) => validate_field(field));
    const form_valid = results.every(Boolean);

    if (!form_valid) {
        form_message.textContent = "Revisa los campos marcados antes de enviar el formulario.";
        form_message.className = "form_message error";

        // Llevamos el foco al primer campo con error
        const first_invalid = Object.values(fields).find(({ input }) => !input.checkValidity());
        first_invalid?.input.focus();
        return;
    }

    // FormData recoge todos los valores del formulario
    const form_data = Object.fromEntries(new FormData(contact_form));
    const first_name = form_data.nombre.trim().split(/\s+/)[0];

    // Limpiamos el formulario sin borrar el mensaje de éxito
    is_programmatic_reset = true;
    contact_form.reset();
    clear_form_feedback();
    is_programmatic_reset = false;

    form_message.textContent = `¡Gracias, ${first_name}! Tu mensaje fue validado correctamente.`;
    form_message.className = "form_message success";
});

contact_form.addEventListener("reset", () => {
    if (is_programmatic_reset) {
        return;
    }

    // setTimeout(…, 0) espera a que el navegador termine de vaciar los campos
    window.setTimeout(() => {
        form_message.textContent = "";
        form_message.className = "form_message";
        clear_form_feedback();
    }, 0);
});

update_message_counter();


/* ==========================================================================
   5. CONSUMO DE API REST: GITHUB
   Documentación: https://docs.github.com/es/rest
   ========================================================================== */

const GITHUB_USER = "AdrianCald";
const GITHUB_API_URL = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_REPOS = 6;

const github_status = document.querySelector("#github_status");
const github_retry = document.querySelector("#github_retry");
const github_profile_body = document.querySelector("#github_profile_body");
const repo_list = document.querySelector("#repo_list");

/**
 * Error personalizado que guarda el código de estado HTTP.
 */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

/**
 * Hace una petición GET y devuelve el JSON.
 * Si la respuesta no es exitosa (response.ok === false), lanza un HttpError.
 */
async function fetch_json(url, signal) {
    const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        signal
    });

    // response.ok es true solo para códigos 200–299
    if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status} en ${url}`);
    }

    return response.json();
}

/**
 * Traduce cualquier error a un mensaje claro para el usuario.
 */
function get_api_error_message(error) {
    if (error.name === "AbortError") {
        return "La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.";
    }

    if (error instanceof HttpError) {
        if (error.status === 404) {
            return "No se encontró el usuario de GitHub (error 404).";
        }
        if (error.status === 403 || error.status === 429) {
            return `GitHub limitó las consultas temporalmente (error ${error.status}). Espera unos minutos y vuelve a intentarlo.`;
        }
        if (error.status >= 500) {
            return `GitHub no está disponible en este momento (error ${error.status}).`;
        }
        return `No se pudo obtener la información (error ${error.status}).`;
    }

    // TypeError: suele significar que no hay conexión a internet
    return "No se pudo conectar con GitHub. Comprueba tu conexión a internet.";
}

/**
 * Cambia el estado visual: "loading", "success" o "error".
 */
function set_api_state(state, message) {
    github_status.className = `api_status ${state}`;
    github_status.textContent = message;

    const is_loading = state === "loading";
    repo_list.setAttribute("aria-busy", String(is_loading));
    github_retry.disabled = is_loading;
}

/**
 * Muestra tarjetas "fantasma" mientras se cargan los datos.
 */
function render_loading_skeletons() {
    const avatar = document.createElement("div");
    avatar.className = "skeleton skeleton_avatar";

    // Array.from + .map para crear varias líneas de carga
    const lines = Array.from({ length: 3 }, () => {
        const line = document.createElement("div");
        line.className = "skeleton skeleton_line";
        return line;
    });

    github_profile_body.replaceChildren(avatar, ...lines);

    const skeleton_cards = Array.from({ length: 4 }, () => {
        const item = document.createElement("li");
        item.className = "skeleton";
        item.setAttribute("aria-hidden", "true");
        return item;
    });

    repo_list.replaceChildren(...skeleton_cards);
}

/**
 * Dibuja el resumen del perfil dentro del <aside>.
 */
function render_profile(user) {
    const avatar = document.createElement("img");
    avatar.className = "github_avatar";
    avatar.src = user.avatar_url;
    avatar.alt = `Avatar de GitHub de ${user.login}`;
    avatar.width = 72;
    avatar.height = 72;

    const login = document.createElement("a");
    login.className = "github_login";
    login.href = user.html_url;
    login.target = "_blank";
    login.rel = "noopener noreferrer";
    login.textContent = `@${user.login}`;

    const stats = document.createElement("ul");
    stats.className = "github_stats";

    const stats_data = [
        ["Repositorios", user.public_repos],
        ["Seguidores", user.followers],
        ["Siguiendo", user.following]
    ];

    stats.append(...stats_data.map(([label, value]) => {
        const item = document.createElement("li");
        const number = document.createElement("strong");
        number.textContent = value;
        item.append(number, ` ${label}`);
        return item;
    }));

    const elements = [avatar, login];

    if (user.bio) {
        const bio = document.createElement("p");
        bio.textContent = user.bio;
        elements.push(bio);
    }

    elements.push(stats);
    github_profile_body.replaceChildren(...elements);
}

/**
 * Formatea una fecha ISO a texto en español (ej.: "18 oct 2026").
 */
const date_formatter = new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

/**
 * Crea la tarjeta <li> de un repositorio.
 */
function create_repo_card(repo) {
    const item = document.createElement("li");

    const card = document.createElement("article");
    card.className = "repo_card";

    const title = document.createElement("h4");
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;
    title.append(link);

    const description = document.createElement("p");
    description.className = "repo_description";
    description.textContent = repo.description || "Sin descripción.";

    const meta = document.createElement("p");
    meta.className = "repo_meta";

    const language = document.createElement("span");
    language.textContent = `💻 ${repo.language || "Sin lenguaje"}`;

    const stars = document.createElement("span");
    stars.textContent = `⭐ ${repo.stargazers_count}`;

    const updated = document.createElement("time");
    updated.dateTime = repo.pushed_at || repo.updated_at;
    updated.textContent = `🕒 ${date_formatter.format(new Date(updated.dateTime))}`;

    meta.append(language, stars, updated);
    card.append(title, description, meta);
    item.append(card);

    return item;
}

/**
 * Dibuja la lista de repositorios.
 */
function render_repos(repos) {
    if (repos.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty_state";
        empty.textContent = "Este usuario todavía no tiene repositorios públicos.";
        repo_list.replaceChildren(empty);
        return;
    }

    repo_list.replaceChildren(...repos.map(create_repo_card));
}

/**
 * Muestra un recuadro de error dentro de la sección.
 */
function render_api_error(message) {
    const profile_error = document.createElement("p");
    profile_error.textContent = "Sin datos disponibles.";
    github_profile_body.replaceChildren(profile_error);

    const item = document.createElement("li");
    item.className = "api_error_box";
    item.textContent = `${message} Pulsa «Actualizar» para reintentar.`;
    repo_list.replaceChildren(item);
}

/**
 * Función principal: consulta la API con async/await.
 */
async function load_github_data() {
    // ----- Estado: CARGANDO -----
    set_api_state("loading", "Cargando información desde GitHub…");
    render_loading_skeletons();

    // AbortController permite cancelar la petición si tarda demasiado
    const controller = new AbortController();
    const timeout_id = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        // Promise.all lanza las dos peticiones al mismo tiempo
        const [user, repos] = await Promise.all([
            fetch_json(`${GITHUB_API_URL}/users/${GITHUB_USER}`, controller.signal),
            fetch_json(`${GITHUB_API_URL}/users/${GITHUB_USER}/repos?sort=pushed&per_page=30`, controller.signal)
        ]);

        // Quitamos forks y nos quedamos con los más recientes (sin mutar "repos")
        const recent_repos = repos
            .filter((repo) => !repo.fork)
            .slice(0, MAX_REPOS);

        render_profile(user);
        render_repos(recent_repos);

        // ----- Estado: ÉXITO -----
        set_api_state(
            "success",
            `✓ Datos actualizados: ${recent_repos.length} repositorios recientes.`
        );
    } catch (error) {
        // ----- Estado: ERROR -----
        console.warn("Error al consultar la API de GitHub:", error);

        const message = get_api_error_message(error);
        set_api_state("error", `⚠ ${message}`);
        render_api_error(message);
    } finally {
        // finally se ejecuta siempre, haya éxito o error
        window.clearTimeout(timeout_id);
    }
}

github_retry.addEventListener("click", load_github_data);

// Consulta inicial al cargar la página
load_github_data();
