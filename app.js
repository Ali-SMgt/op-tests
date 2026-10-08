/**
 * Sistema de Préstamos - Laboratorio Universitario
 * Lógica de negocio, persistencia en localStorage y manipulación de interfaz.
 */

// Catálogo predeterminado inicial
const CATALOGO_INICIAL = [
  { id: "EQ01", nombre: "Portátil 01", estado: "Disponible" },
  { id: "EQ02", nombre: "Portátil 02", estado: "Disponible" },
  { id: "EQ03", nombre: "Proyector 01", estado: "Disponible" },
  { id: "EQ04", nombre: "Proyector 02", estado: "Disponible" },
  { id: "EQ05", nombre: "Kit de electrónica 01", estado: "Disponible" },
  { id: "EQ06", nombre: "Kit de electrónica 02", estado: "Disponible" }
];

const CLAVE_LOCALSTORAGE_EQUIPOS = "lab_equipos";
const CLAVE_LOCALSTORAGE_PRESTAMOS = "lab_prestamos";

// Estado en memoria
let equipos = [];
let prestamos = [];
let filtroActual = "todos"; // "todos" | "disponibles" | "prestados"

// Elementos del DOM
const formPrestamo = document.getElementById("formulario-prestamo");
const inputSolicitante = document.getElementById("solicitante");
const selectEquipo = document.getElementById("equipo-select");
const inputFecha = document.getElementById("fecha-prestamo");
const cuerpoCatalogo = document.getElementById("cuerpo-catalogo");
const cuerpoActivos = document.getElementById("cuerpo-activos");
const cuerpoHistorial = document.getElementById("cuerpo-historial");
const mensajeVacioCatalogo = document.getElementById("catalogo-vacio");
const mensajeVacioActivos = document.getElementById("activos-vacio");
const mensajeVacioHistorial = document.getElementById("historial-vacio");
const contenedorMensaje = document.getElementById("contenedor-mensaje");
const textoMensaje = document.getElementById("texto-mensaje");
const botonesFiltro = document.querySelectorAll(".boton-filtro");

/**
 * Inicializa los datos cargando desde localStorage o creando los datos iniciales.
 */
function inicializarDatos() {
  try {
    const equiposGuardados = localStorage.getItem(CLAVE_LOCALSTORAGE_EQUIPOS);
    const prestamosGuardados = localStorage.getItem(CLAVE_LOCALSTORAGE_PRESTAMOS);

    if (equiposGuardados !== null) {
      equipos = JSON.parse(equiposGuardados);
    } else {
      // Si no existen datos guardados, se carga el catálogo inicial
      equipos = JSON.parse(JSON.stringify(CATALOGO_INICIAL));
      localStorage.setItem(CLAVE_LOCALSTORAGE_EQUIPOS, JSON.stringify(equipos));
    }

    if (prestamosGuardados !== null) {
      prestamos = JSON.parse(prestamosGuardados);
    } else {
      prestamos = [];
      localStorage.setItem(CLAVE_LOCALSTORAGE_PRESTAMOS, JSON.stringify(prestamos));
    }
  } catch (error) {
    console.error("Error al acceder a localStorage:", error);
    equipos = JSON.parse(JSON.stringify(CATALOGO_INICIAL));
    prestamos = [];
  }
}

/**
 * Persiste los datos actuales en localStorage.
 */
function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_LOCALSTORAGE_EQUIPOS, JSON.stringify(equipos));
    localStorage.setItem(CLAVE_LOCALSTORAGE_PRESTAMOS, JSON.stringify(prestamos));
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
    mostrarMensaje("Error al guardar la información en el almacenamiento local.", "error");
  }
}

/**
 * Muestra un mensaje temporal de retroalimentación al usuario.
 * @param {string} texto Mensaje a mostrar
 * @param {'exito'|'error'} tipo Tipo de alerta
 */
function mostrarMensaje(texto, tipo) {
  textoMensaje.textContent = texto;
  contenedorMensaje.className = `mensaje-alerta ${tipo}`;
  contenedorMensaje.classList.remove("oculto");

  // Desplazar suavemente a la notificación
  contenedorMensaje.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Oculta el mensaje de retroalimentación.
 */
function ocultarMensaje() {
  contenedorMensaje.classList.add("oculto");
  textoMensaje.textContent = "";
}

/**
 * Actualiza las opciones del elemento select de equipos.
 */
function actualizarSelectorEquipos() {
  // Limpiar opciones previas manteniendo la opción predeterminada
  selectEquipo.innerHTML = '<option value="">-- Selecciona un equipo --</option>';

  equipos.forEach(equipo => {
    const opcion = document.createElement("option");
    opcion.value = equipo.id;
    const esPrestado = equipo.estado === "Prestado";
    opcion.textContent = `${equipo.id} - ${equipo.nombre} (${equipo.estado})`;

    if (esPrestado) {
      opcion.disabled = true;
    }

    selectEquipo.appendChild(opcion);
  });
}

/**
 * Renderiza la tabla del catálogo de equipos según el filtro activo.
 */
function renderizarCatalogo() {
  cuerpoCatalogo.innerHTML = "";

  const equiposFiltrados = equipos.filter(equipo => {
    if (filtroActual === "disponibles") return equipo.estado === "Disponible";
    if (filtroActual === "prestados") return equipo.estado === "Prestado";
    return true; // "todos"
  });

  if (equiposFiltrados.length === 0) {
    mensajeVacioCatalogo.classList.remove("oculto");
  } else {
    mensajeVacioCatalogo.classList.add("oculto");
  }

  equiposFiltrados.forEach(equipo => {
    const fila = document.createElement("tr");

    const celdaId = document.createElement("td");
    celdaId.textContent = equipo.id;

    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = equipo.nombre;

    const celdaEstado = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge-estado ${equipo.estado === "Disponible" ? "badge-disponible" : "badge-prestado"}`;
    badge.textContent = equipo.estado;
    celdaEstado.appendChild(badge);

    fila.appendChild(celdaId);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaEstado);

    cuerpoCatalogo.appendChild(fila);
  });
}

/**
 * Renderiza la sección de préstamos activos.
 */
function renderizarPrestamosActivos() {
  cuerpoActivos.innerHTML = "";

  const prestamosActivos = prestamos.filter(p => p.estado === "Activo");

  if (prestamosActivos.length === 0) {
    mensajeVacioActivos.classList.remove("oculto");
  } else {
    mensajeVacioActivos.classList.add("oculto");
  }

  prestamosActivos.forEach(prestamo => {
    const fila = document.createElement("tr");

    const celdaId = document.createElement("td");
    celdaId.textContent = prestamo.equipoId;

    const celdaEquipo = document.createElement("td");
    celdaEquipo.textContent = prestamo.equipoNombre;

    const celdaSolicitante = document.createElement("td");
    celdaSolicitante.textContent = prestamo.solicitante;

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = prestamo.fechaPrestamo;

    const celdaAccion = document.createElement("td");
    const botonDevolver = document.createElement("button");
    botonDevolver.type = "button";
    botonDevolver.className = "boton-devolver";
    botonDevolver.textContent = "Registrar devolución";
    botonDevolver.setAttribute("aria-label", `Registrar devolución de ${prestamo.equipoNombre} para ${prestamo.solicitante}`);
    botonDevolver.addEventListener("click", () => {
      devolverPrestamo(prestamo.id);
    });
    celdaAccion.appendChild(botonDevolver);

    fila.appendChild(celdaId);
    fila.appendChild(celdaEquipo);
    fila.appendChild(celdaSolicitante);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaAccion);

    cuerpoActivos.appendChild(fila);
  });
}

/**
 * Renderiza la sección de historial de préstamos devueltos.
 */
function renderizarHistorialDevueltos() {
  cuerpoHistorial.innerHTML = "";

  const prestamosDevueltos = prestamos.filter(p => p.estado === "Devuelto");

  if (prestamosDevueltos.length === 0) {
    mensajeVacioHistorial.classList.remove("oculto");
  } else {
    mensajeVacioHistorial.classList.add("oculto");
  }

  prestamosDevueltos.forEach(prestamo => {
    const fila = document.createElement("tr");

    const celdaId = document.createElement("td");
    celdaId.textContent = prestamo.equipoId;

    const celdaEquipo = document.createElement("td");
    celdaEquipo.textContent = prestamo.equipoNombre;

    const celdaSolicitante = document.createElement("td");
    celdaSolicitante.textContent = prestamo.solicitante;

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = prestamo.fechaPrestamo;

    const celdaFechaDev = document.createElement("td");
    celdaFechaDev.textContent = prestamo.fechaDevolucion || "-";

    const celdaEstado = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge-estado badge-devuelto";
    badge.textContent = "Devuelto";
    celdaEstado.appendChild(badge);

    fila.appendChild(celdaId);
    fila.appendChild(celdaEquipo);
    fila.appendChild(celdaSolicitante);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaFechaDev);
    fila.appendChild(celdaEstado);

    cuerpoHistorial.appendChild(fila);
  });
}

/**
 * Actualiza toda la vista.
 */
function renderizarTodo() {
  renderizarCatalogo();
  actualizarSelectorEquipos();
  renderizarPrestamosActivos();
  renderizarHistorialDevueltos();
}

/**
 * Registra un nuevo préstamo verificando validaciones y unicidad de préstamo activo.
 */
function registrarPrestamo(evento) {
  evento.preventDefault();
  ocultarMensaje();

  const solicitante = inputSolicitante.value.trim();
  const equipoId = selectEquipo.value.trim();
  const fechaPrestamo = inputFecha.value.trim();

  // Validación de campos obligatorios
  if (!solicitante) {
    mostrarMensaje("El nombre del solicitante es obligatorio.", "error");
    inputSolicitante.focus();
    return;
  }

  if (!equipoId) {
    mostrarMensaje("Debe seleccionar un equipo.", "error");
    selectEquipo.focus();
    return;
  }

  if (!fechaPrestamo) {
    mostrarMensaje("La fecha del préstamo es obligatoria.", "error");
    inputFecha.focus();
    return;
  }

  // Buscar equipo en catálogo
  const equipo = equipos.find(e => e.id === equipoId);
  if (!equipo) {
    mostrarMensaje("El equipo seleccionado no es válido.", "error");
    return;
  }

  // Validación estricta: impedir segundo préstamo activo para el equipo
  const prestamoActivoExistente = prestamos.find(
    p => p.equipoId === equipoId && p.estado === "Activo"
  );

  if (prestamoActivoExistente || equipo.estado === "Prestado") {
    mostrarMensaje(`El equipo "${equipo.nombre}" (${equipo.id}) ya cuenta con un préstamo activo. No es posible prestarlo nuevamente.`, "error");
    return;
  }

  // Crear nuevo préstamo
  const nuevoPrestamo = {
    id: "PREST-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    equipoId: equipo.id,
    equipoNombre: equipo.nombre,
    solicitante: solicitante,
    fechaPrestamo: fechaPrestamo,
    fechaDevolucion: null,
    estado: "Activo"
  };

  // Actualizar estado del equipo
  equipo.estado = "Prestado";
  prestamos.push(nuevoPrestamo);

  // Persistir cambios
  guardarDatos();

  // Limpiar campos del formulario
  formPrestamo.reset();

  // Actualizar interfaz
  renderizarTodo();

  mostrarMensaje(`Préstamo registrado exitosamente para el equipo "${equipo.nombre}".`, "exito");
}

/**
 * Registra la devolución de un préstamo activo y devuelve el equipo a disponible.
 * @param {string} prestamoId Identificador único del préstamo
 */
function devolverPrestamo(prestamoId) {
  ocultarMensaje();

  const prestamo = prestamos.find(p => p.id === prestamoId && p.estado === "Activo");
  if (!prestamo) {
    mostrarMensaje("No se encontró el préstamo activo a devolver.", "error");
    return;
  }

  // Actualizar préstamo a devuelto y registrar fecha actual de devolución
  prestamo.estado = "Devuelto";
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  prestamo.fechaDevolucion = `${anio}-${mes}-${dia}`;

  // Actualizar estado del equipo a Disponible
  const equipo = equipos.find(e => e.id === prestamo.equipoId);
  if (equipo) {
    equipo.estado = "Disponible";
  }

  // Persistir cambios
  guardarDatos();

  // Actualizar interfaz
  renderizarTodo();

  mostrarMensaje(`Devolución registrada exitosamente para el equipo "${prestamo.equipoNombre}". El equipo ahora está Disponible.`, "exito");
}

/**
 * Configura los eventos de interacción.
 */
function configurarEventos() {
  formPrestamo.addEventListener("submit", registrarPrestamo);

  botonesFiltro.forEach(boton => {
    boton.addEventListener("click", () => {
      botonesFiltro.forEach(b => b.classList.remove("activo"));
      boton.classList.add("activo");
      filtroActual = boton.dataset.filtro;
      renderizarCatalogo();
    });
  });
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  inicializarDatos();
  configurarEventos();
  renderizarTodo();
});
