/* ==========================================================================
   Datos de los proyectos del portafolio
   Fuente única de verdad: este arreglo NUNCA se modifica.
   ========================================================================== */

/**
 * Congela un objeto y todo lo que contiene para que no se pueda modificar.
 * Así garantizamos la inmutabilidad de los datos originales al filtrar.
 * @param {object} value
 * @returns {object} el mismo objeto, congelado
 */
function deep_freeze(value) {
    Object.values(value).forEach((inner) => {
        if (typeof inner === "object" && inner !== null) {
            deep_freeze(inner);
        }
    });
    return Object.freeze(value);
}

/** Categorías disponibles: clave interna → nombre visible */
export const CATEGORIES = deep_freeze({
    web: "Web",
    java: "Java",
    cpp: "C++",
    datos: "Datos",
    hardware: "Hardware"
});

/** Lista de proyectos (inmutable) */
export const PROJECTS = deep_freeze([
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
