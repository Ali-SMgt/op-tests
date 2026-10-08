# Sistema de Préstamos - Laboratorio Universitario

Aplicación web para la gestión, registro de préstamos y control de devoluciones de computadoras portátiles, proyectores y kits de electrónica en un laboratorio universitario.

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible.
- **CSS3**: Diseño visual responsive adaptado a pantallas de escritorio y dispositivos móviles.
- **JavaScript (ES6+)**: Lógica de catálogo, validaciones de negocio y persistencia de datos.
- **Sin dependencias externas**: No utiliza frameworks, librerías, CDN ni llamadas a servicios o modelos externos.

---

## Cómo abrir y ejecutar la aplicación

No se requiere ningún servidor de backend ni proceso de compilación para ejecutar la aplicación:

### Opción 1: Abrir directamente en el navegador
1. Localiza el archivo `index.html` en la carpeta del proyecto.
2. Haz doble clic sobre `index.html` o haz clic derecho y selecciona **Abrir con** -> Tu navegador preferido (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, etc.).

### Opción 2: Usar un servidor estático local (opcional)
Si tienes Node.js o Python instalado:
- **Con Python**:
  ```bash
  python -m http.server 8000
  ```
  Luego abre en tu navegador: `http://localhost:8000`
- **Con VS Code**:
  Usa la extensión **Live Server** haciendo clic derecho en `index.html` y seleccionando *Open with Live Server*.

---

## Guía de uso

### 1. Consultar el Catálogo
- Al iniciar la aplicación por primera vez, se cargan automáticamente los 6 equipos predeterminados:
  - `EQ01`: Portátil 01 (Disponible)
  - `EQ02`: Portátil 02 (Disponible)
  - `EQ03`: Proyector 01 (Disponible)
  - `EQ04`: Proyector 02 (Disponible)
  - `EQ05`: Kit de electrónica 01 (Disponible)
  - `EQ06`: Kit de electrónica 02 (Disponible)
- Utiliza los botones de filtro (**Todos**, **Disponibles**, **Prestados**) para consultar rápidamente el estado del inventario.

### 2. Registrar un Préstamo
1. En la sección **Registrar Nuevo Préstamo**, completa los tres campos obligatorios:
   - **Nombre del solicitante**: Nombre completo de la persona que solicita el equipo.
   - **Equipo a solicitar**: Selecciona el equipo de la lista desplegable (los equipos prestados aparecen deshabilitados).
   - **Fecha del préstamo**: Selecciona la fecha en la que se realiza la entrega.
2. Haz clic en el botón **Registrar Préstamo**.
3. La aplicación validará que todos los campos estén diligenciados y que el equipo no cuente ya con un préstamo activo.
4. El equipo pasará a estado **Prestado** y el registro se añadirá a la tabla de **Préstamos Activos**.

### 3. Registrar una Devolución
1. En la sección **Préstamos Activos**, ubica el préstamo correspondiente.
2. Haz clic en el botón verde **Registrar devolución**.
3. El equipo volverá automáticamente al estado **Disponible** en el catálogo y podrá ser prestado nuevamente.
4. El registro pasará a la sección **Historial de Préstamos Devueltos**, guardando la fecha de devolución y conservando el histórico.

---

## Persistencia y Almacenamiento Local

- Los datos de los equipos y préstamos se guardan automáticamente en el almacenamiento local del navegador (`localStorage`) bajo las claves `lab_equipos` y `lab_prestamos`.
- Al recargar o cerrar la página, los datos se conservan íntegramente.
- El catálogo inicial se carga únicamente si no existen registros previos en `localStorage`.
- **Nota sobre el alcance**: El almacenamiento local pertenece exclusivamente al navegador y al origen utilizado. Este prototipo no comparte datos en red entre diferentes computadoras ni entre diferentes navegadores.
