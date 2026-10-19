/* ==========================================================================
   Módulo 4 · Formulario de contacto con validación en tiempo real
   - event.preventDefault() intercepta el submit (no recarga la página)
   - Validación nativa de HTML5 (Constraint Validation API)
   - Validación en tiempo real con el evento input
   ========================================================================== */

/*
 * Mensajes de error por campo y por TIPO de error.
 * input.validity es la API de validación nativa del navegador:
 *   valueMissing    → falta un campo obligatorio (required)
 *   typeMismatch    → el formato no corresponde (type="email")
 *   tooShort        → menos caracteres que minlength
 *   patternMismatch → no cumple el pattern
 *   customError     → error definido por nosotros con setCustomValidity()
 */
const ERROR_MESSAGES = {
    nombre: {
        valueMissing: "Escribe tu nombre completo.",
        tooShort: "El nombre debe tener al menos 3 caracteres.",
        customError: "El nombre no puede contener solo espacios."
    },
    correo: {
        valueMissing: "Escribe tu correo electrónico.",
        typeMismatch: "Introduce un correo válido, por ejemplo: nombre@correo.com."
    },
    telefono: {
        patternMismatch: "Usa entre 7 y 20 caracteres: números, espacios, +, - o paréntesis."
    },
    motivo: {
        valueMissing: "Selecciona un motivo de contacto."
    },
    mensaje: {
        valueMissing: "Escribe tu mensaje.",
        tooShort: "El mensaje debe tener al menos 10 caracteres.",
        customError: "El mensaje no puede contener solo espacios."
    },
    aceptacion: {
        valueMissing: "Debes aceptar el uso de tus datos para poder enviar el mensaje."
    }
};

// Campos de texto que no pueden contener solo espacios
const TRIMMED_FIELDS = ["nombre", "mensaje"];

/**
 * Busca el primer error que tenga el campo y devuelve su mensaje.
 * @param {{input: HTMLInputElement, messages: object}} field
 * @returns {string}
 */
function get_error_message(field) {
    const { validity } = field.input;
    const error_type = Object.keys(field.messages).find((type) => validity[type]);

    return error_type ? field.messages[error_type] : "Revisa este campo.";
}

/**
 * Valida un campo con la validación nativa y muestra (o borra) su error.
 * @returns {boolean} true si el campo es válido
 */
function validate_field(field) {
    const { input, error } = field;

    // Regla extra: setCustomValidity("...") marca el campo como inválido; "" lo limpia
    if (TRIMMED_FIELDS.includes(input.id)) {
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
 * Inicializa el formulario de contacto.
 */
export function init_contact_form() {
    const contact_form = document.querySelector("#contact_form");
    const form_message = document.querySelector("#form_message");
    const message_counter = document.querySelector("#mensaje_counter");

    // Bandera para distinguir el botón "Limpiar" del reset tras un envío exitoso
    let is_programmatic_reset = false;

    // Construimos la configuración de cada campo con .map() a partir de los mensajes
    const fields = Object.fromEntries(
        Object.entries(ERROR_MESSAGES).map(([id, messages]) => [
            id,
            {
                input: document.querySelector(`#${id}`),
                error: document.querySelector(`#${id}_error`),
                messages
            }
        ])
    );

    /** Actualiza el contador de caracteres del mensaje */
    function update_message_counter() {
        const { input } = fields.mensaje;
        const length = input.value.length;

        message_counter.textContent = `${length} / ${input.maxLength}`;
        message_counter.classList.toggle("near_limit", length >= input.maxLength * 0.9);
    }

    /** Quita todos los estados visuales del formulario */
    function clear_form_feedback() {
        Object.values(fields).forEach(({ input, error }) => {
            input.classList.remove("invalid", "valid");
            input.removeAttribute("aria-invalid");
            error.textContent = "";
        });

        update_message_counter();
    }

    /** Muestra el mensaje general (éxito o error) */
    function show_form_message(text, type) {
        form_message.textContent = text;
        form_message.className = `form_message ${type}`;
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
                show_form_message("", "");
            }
        });

        // "blur": se valida al salir del campo (por ejemplo, si lo dejó vacío)
        field.input.addEventListener("blur", () => validate_field(field));
    });

    // Envío del formulario
    contact_form.addEventListener("submit", (event) => {
        // Evita que la página se recargue al enviar
        event.preventDefault();

        // Validamos TODOS los campos (.map() + .every() → true solo si todos son válidos)
        const form_valid = Object.values(fields)
            .map((field) => validate_field(field))
            .every(Boolean);

        if (!form_valid) {
            show_form_message("Revisa los campos marcados antes de enviar el formulario.", "error");

            // Llevamos el foco al primer campo con error
            Object.values(fields)
                .find(({ input }) => !input.checkValidity())
                ?.input.focus();
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

        show_form_message(`¡Gracias, ${first_name}! Tu mensaje fue validado correctamente.`, "success");
    });

    // Botón "Limpiar"
    contact_form.addEventListener("reset", () => {
        if (is_programmatic_reset) {
            return;
        }

        // setTimeout(…, 0) espera a que el navegador termine de vaciar los campos
        window.setTimeout(() => {
            show_form_message("", "");
            clear_form_feedback();
        }, 0);
    });

    update_message_counter();
}
