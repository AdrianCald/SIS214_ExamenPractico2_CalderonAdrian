/* ==========================================================================
   Módulo de animaciones · Librería AOS (Animate On Scroll)
   Las secciones con el atributo data-aos aparecen al hacer scroll.
   Documentación: https://michalsnik.github.io/aos/
   ========================================================================== */

/**
 * Inicializa AOS respetando la preferencia de "movimiento reducido".
 * Si la librería no cargó, se muestran las secciones sin animación.
 */
export function init_animations() {
    const reduce_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof window.AOS === "undefined") {
        console.warn("AOS no está disponible; se omiten las animaciones.");

        // Quitamos data-aos para que el CSS de AOS no deje secciones ocultas
        document.querySelectorAll("[data-aos]").forEach((element) => {
            element.removeAttribute("data-aos");
        });
        return;
    }

    window.AOS.init({
        duration: 650,      // duración de la animación en milisegundos
        easing: "ease-out-cubic",
        once: true,         // anima solo la primera vez que aparece
        offset: 60,         // distancia (px) antes de empezar a animar
        disable: reduce_motion
    });
}
