/* ==========================================================================
   Módulo 5 · Consumo de la API REST de GitHub
   - Fetch API con async/await
   - try...catch...finally para el manejo de errores
   - Validación de response.ok y de los códigos de estado HTTP
   - Estados de la interfaz: loading → success | error
   Documentación de la API: https://docs.github.com/es/rest
   ========================================================================== */

const GITHUB_USER = "AdrianCald";
const GITHUB_API_URL = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_REPOS = 6;

/**
 * Mensajes para cada código de estado HTTP que manejamos explícitamente.
 */
const HTTP_STATUS_MESSAGES = {
    200: "200 OK: datos recibidos correctamente.",
    400: "400 Bad Request: la solicitud enviada a GitHub no es válida.",
    401: "401 Unauthorized: GitHub rechazó la autenticación.",
    403: "403 Forbidden: GitHub limitó las consultas temporalmente. Espera unos minutos.",
    404: "404 Not Found: no se encontró el usuario de GitHub.",
    429: "429 Too Many Requests: se superó el límite de consultas. Espera unos minutos.",
    500: "500 Internal Server Error: GitHub tuvo un error interno.",
    502: "502 Bad Gateway: GitHub no respondió correctamente.",
    503: "503 Service Unavailable: GitHub no está disponible en este momento."
};

/**
 * Error personalizado que guarda el código de estado HTTP.
 */
class HttpError extends Error {
    constructor(status, url) {
        super(`HTTP ${status} en ${url}`);
        this.name = "HttpError";
        this.status = status;
    }
}

// Referencias al DOM (se asignan en init_github)
let github_status;
let github_retry;
let github_profile_body;
let repo_list;


/* --------------------------------------------------------------------------
   Peticiones
   -------------------------------------------------------------------------- */

/**
 * Hace una petición GET y devuelve el JSON.
 * Si la respuesta no es exitosa (response.ok === false), lanza un HttpError.
 * @param {string} url
 * @param {AbortSignal} signal
 * @returns {Promise<any>}
 */
async function fetch_json(url, signal) {
    const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        signal
    });

    // response.ok es true solo para códigos 200–299
    if (!response.ok) {
        throw new HttpError(response.status, url);
    }

    return response.json();
}

/**
 * Traduce cualquier error a un mensaje claro para el usuario.
 * @param {Error} error
 * @returns {string}
 */
function get_api_error_message(error) {
    // La petición tardó demasiado y la cancelamos con AbortController
    if (error.name === "AbortError") {
        return "Tiempo de espera agotado: GitHub tardó demasiado en responder.";
    }

    if (error instanceof HttpError) {
        // Códigos que conocemos: mensaje específico
        if (HTTP_STATUS_MESSAGES[error.status]) {
            return HTTP_STATUS_MESSAGES[error.status];
        }

        // Cualquier otro código: lo clasificamos por rango
        return error.status >= 500
            ? `Error ${error.status} del servidor de GitHub.`
            : `Error ${error.status} en la solicitud.`;
    }

    // TypeError: suele significar que no hay conexión a internet
    return "Sin conexión: no se pudo contactar con GitHub. Revisa tu internet.";
}


/* --------------------------------------------------------------------------
   Estados de la interfaz
   -------------------------------------------------------------------------- */

/**
 * Cambia el estado visual: "loading", "success" o "error".
 * @param {"loading"|"success"|"error"} state
 * @param {string} message
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

    // Array.from + función creadora para generar varias líneas de carga
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
 * @param {object} user respuesta de /users/:usuario
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

    // .map() convierte cada par [etiqueta, valor] en un <li>
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

// Formatea una fecha ISO a texto en español (ej.: "18 oct 2026")
const date_formatter = new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

/**
 * Crea la tarjeta <li> de un repositorio.
 * @param {object} repo
 * @returns {HTMLLIElement}
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
 * @param {Array<object>} repos
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
 * @param {string} message
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


/* --------------------------------------------------------------------------
   Flujo principal
   -------------------------------------------------------------------------- */

/**
 * Consulta la API con async/await y actualiza los tres estados de la interfaz.
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
            `✓ ${HTTP_STATUS_MESSAGES[200]} ${recent_repos.length} repositorios recientes.`
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

/**
 * Inicializa la sección de GitHub.
 */
export function init_github() {
    github_status = document.querySelector("#github_status");
    github_retry = document.querySelector("#github_retry");
    github_profile_body = document.querySelector("#github_profile_body");
    repo_list = document.querySelector("#repo_list");

    github_retry.addEventListener("click", load_github_data);

    // Consulta inicial al cargar la página
    load_github_data();
}
