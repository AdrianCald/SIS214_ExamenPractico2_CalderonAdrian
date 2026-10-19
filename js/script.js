const theme_button = document.querySelector("#theme_button");
const contact_form = document.querySelector("#contact_form");
const form_message = document.querySelector("#form_message");

function set_theme(dark_mode_active) {
    document.body.classList.toggle("dark_mode", dark_mode_active);

    theme_button.textContent = dark_mode_active
        ? "☀️ Modo claro"
        : "🌙 Modo oscuro";

    theme_button.setAttribute("aria-pressed", String(dark_mode_active));
    theme_button.setAttribute(
        "aria-label",
        dark_mode_active
            ? "Activar modo claro"
            : "Activar modo oscuro"
    );

    localStorage.setItem("dark_mode", String(dark_mode_active));
}

const saved_theme = localStorage.getItem("dark_mode") === "true";
set_theme(saved_theme);

theme_button.addEventListener("click", () => {
    const dark_mode_active = !document.body.classList.contains("dark_mode");
    set_theme(dark_mode_active);
});

const fields = {
    nombre: {
        input: document.querySelector("#nombre"),
        error: document.querySelector("#nombre_error"),
        message: "Escribe tu nombre completo (mínimo 3 caracteres)."
    },
    correo: {
        input: document.querySelector("#correo"),
        error: document.querySelector("#correo_error"),
        message: "Introduce un correo electrónico válido."
    },
    telefono: {
        input: document.querySelector("#telefono"),
        error: document.querySelector("#telefono_error"),
        message: "El teléfono contiene caracteres no válidos."
    },
    motivo: {
        input: document.querySelector("#motivo"),
        error: document.querySelector("#motivo_error"),
        message: "Selecciona un motivo de contacto."
    },
    mensaje: {
        input: document.querySelector("#mensaje"),
        error: document.querySelector("#mensaje_error"),
        message: "El mensaje debe tener al menos 10 caracteres."
    }
};

function validate_field(field) {
    const { input, error, message } = field;
    let valid = input.checkValidity();

    if (input.id === "telefono" && input.value.trim() === "") {
        valid = true;
    }

    input.classList.toggle("invalid", !valid);
    error.textContent = valid ? "" : message;

    return valid;
}

Object.values(fields).forEach((field) => {
    field.input.addEventListener("blur", () => validate_field(field));
    field.input.addEventListener("input", () => {
        if (field.input.classList.contains("invalid")) {
            validate_field(field);
        }
    });
});

contact_form.addEventListener("submit", (event) => {
    event.preventDefault();

    let form_valid = true;

    Object.values(fields).forEach((field) => {
        if (!validate_field(field)) {
            form_valid = false;
        }
    });

    const acceptance = document.querySelector("#aceptacion");

    if (!acceptance.checked) {
        form_valid = false;
    }

    if (!form_valid) {
        form_message.textContent =
            "Revisa los campos marcados antes de enviar el formulario.";
        form_message.className = "form_message error";
        return;
    }

    form_message.textContent =
        "Formulario validado correctamente. ¡Gracias por contactarme!";
    form_message.className = "form_message success";

    contact_form.reset();

    Object.values(fields).forEach(({ input, error }) => {
        input.classList.remove("invalid");
        error.textContent = "";
    });
});

contact_form.addEventListener("reset", () => {
    window.setTimeout(() => {
        form_message.textContent = "";
        form_message.className = "form_message";

        Object.values(fields).forEach(({ input, error }) => {
            input.classList.remove("invalid");
            error.textContent = "";
        });
    }, 0);
});
