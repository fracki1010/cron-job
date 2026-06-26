# Especificación: Formato PDF de cronograma con selección de vacaciones

> Delta sobre `calendar-ui`, `pdf-export`. Nueva capacidad `vacation-selection`.
> No existen especificaciones base previas — este documento es la especificación completa del cambio.

---

## Requisitos funcionales

### RE-01: Días de descanso sin fondo de color en PDF

El sistema NO DEBE aplicar relleno de color de fondo a las celdas de descanso en el PDF.
El fondo DEBE ser el mismo que el de una celda normal (`cellBg` del tema activo).
El borde DEBE ser `cellBorder`, no `restBorder`.

#### Escenario: Celda de descanso usa fondo normal

- DADO un día seleccionado como descanso
- CUANDO se genera el PDF
- ENTONCES la celda DEBE tener `setFillColor` con `cellBg`
- Y `setDrawColor` DEBE usar `cellBorder`
- Y NO DEBE llamarse `setFillColor` con `restBg`

### RE-02: Texto "DESCANSO" centrado en celda PDF

El sistema DEBE mostrar "DESCANSO" centrado horizontal y verticalmente dentro de cada celda de descanso.
El número de día DEBE mantener su posición actual (esquina superior izquierda, coordenada `x+3, y+7`).

#### Escenario: Texto centrado sin fondo

- DADO un día seleccionado como descanso
- CUANDO se genera el PDF
- ENTONCES `pdf.text('DESCANSO', x + cellW/2, y + cellH/2 + 5, { align: 'center' })` DEBE ejecutarse
- Y el color DEBE ser `restLabel` del tema activo
- Y el número de día DEBE conservar su posición y color (`restText`)

### RE-03: Selector de rango de vacaciones en UI

El sistema DEBE incluir dos inputs numéricos "Vacaciones desde" y "Vacaciones hasta" que permitan definir un rango contiguo `[inicio, fin]` (ambos inclusive).

#### Escenario: Seleccionar rango válido

- DADO el calendario del mes actual
- CUANDO el usuario ingresa día 5 en "Desde" y día 15 en "Hasta"
- ENTONCES el estado `vacationRange` DEBE ser `[5, 15]`

#### Escenario: Inicio mayor que fin

- DADO el calendario del mes actual
- CUANDO el usuario ingresa día 20 en "Desde" y día 10 en "Hasta"
- ENTONCES el sistema DEBE mostrar el error "El día de inicio debe ser menor o igual al día de fin"
- Y `vacationRange` NO DEBE actualizarse

#### Escenario: Día fuera del mes

- DADO un mes con 30 días
- CUANDO el usuario ingresa día 31 en "Hasta"
- ENTONCES el sistema DEBE mostrar el error "El día está fuera del rango del mes (1-30)"
- Y `vacationRange` NO DEBE actualizarse

### RE-04: Distinción visual de vacaciones en calendario

Las celdas dentro del rango de vacaciones DEBEN tener un color de fondo DISTINTO al verde de descanso (`emerald-500`) y al fondo normal. El color DEBE ser coherente con el tema oscuro de la UI (ej. azul/cyan).

#### Escenario: Vacaciones con prioridad visual

- DADO un rango de vacaciones activo
- CUANDO se renderiza el calendario
- ENTONCES las celdas del rango DEBEN mostrar el color de vacaciones
- Y una celda que sea TANTO descanso como vacaciones DEBE mostrar el color de vacaciones (prioridad visual de vacaciones)

### RE-05: Limpiar selección de vacaciones

El sistema DEBE permitir limpiar solo el rango de vacaciones sin afectar los días de descanso seleccionados.

#### Escenario: Limpiar vacaciones mantiene descansos

- DADO `vacationRange = [5, 15]` y 3 días de descanso seleccionados
- CUANDO el usuario pulsa "Limpiar vacaciones"
- ENTONCES `vacationRange` DEBE ser `null`
- Y `selectedDays` DEBE conservar los 3 días

### RE-06: Bloque "VACACIONES" en el pie del PDF

El sistema DEBE incluir un bloque "VACACIONES:" con el rango formateado debajo del resumen de descansos cuando exista `vacationRange`.
Formato: `"VACACIONES: {inicio} al {fin} de {mes} de {año}"` (ej. "VACACIONES: 10 al 20 de julio de 2025").

#### Escenario: Bloque presente con rango

- DADO `vacationRange = [10, 20]` en julio 2025
- CUANDO se genera el PDF
- ENTONCES DEBE aparecer "VACACIONES:" con color `summaryAccent` y "10 al 20 de julio de 2025" con color `summaryText`
- Y DEBE ubicarse 4 mm debajo del resumen de descansos

#### Escenario: Sin vacaciones, sin bloque

- DADO `vacationRange = null`
- CUANDO se genera el PDF
- ENTONCES NO DEBE aparecer el bloque "VACACIONES"

### RE-07: Limpieza al navegar entre meses

El sistema DEBE resetear `vacationRange` a `null` al cambiar de mes (anterior/siguiente).

#### Escenario: Navegar resetea vacaciones

- DADO `vacationRange = [10, 20]` activo
- CUANDO el usuario navega al mes siguiente
- ENTONCES `vacationRange` DEBE ser `null`
- Y los inputs DEBEN mostrarse vacíos

### RE-08: Limpieza global

El botón "Limpiar selección" DEBE limpiar TANTO `selectedDays` COMO `vacationRange`.

#### Escenario: Limpiar todo

- DADO días de descanso seleccionados y `vacationRange = [5, 15]`
- CUANDO el usuario pulsa "Limpiar selección"
- ENTONCES `selectedDays` DEBE estar vacío Y `vacationRange` DEBE ser `null`

### RE-09: Habilitar exportación con solo vacaciones

El botón "Descargar PDF" DEBE habilitarse si hay días de descanso seleccionados O si hay un rango de vacaciones activo.

#### Escenario: Exportar solo con vacaciones

- DADO `selectedDays` vacío y `vacationRange = [1, 10]`
- CUANDO el usuario ve el botón "Descargar PDF"
- ENTONCES el botón NO DEBE estar deshabilitado

### RE-10: Conservar funcionalidad existente

La navegación de meses, selección de descansos (highlight verde), temas (oscuro/claro), orientación (vertical/horizontal), y descarga del PDF DEBEN seguir funcionando sin cambios en su comportamiento.

#### Escenario: Tema oscuro con vacaciones en PDF

- DADO tema oscuro activo y `vacationRange = [5, 15]`
- CUANDO se genera el PDF
- ENTONCES los colores del bloque VACACIONES DEBEN usar `summaryAccent` y `summaryText` del tema oscuro
- Y el resto del PDF DEBE mantener todos los colores del tema oscuro

#### Escenario: Orientación horizontal con vacaciones

- DADA orientación horizontal activa y `vacationRange = [5, 15]`
- CUANDO se genera el PDF
- ENTONCES el bloque VACACIONES DEBE posicionarse usando las coordenadas del layout horizontal
- Y el layout de celdas DEBE mantener su tamaño (`cellH = 22` en horizontal)

---

## Reglas de comportamiento UI

1. Los inputs "Vacaciones desde" y "Vacaciones hasta" DEBEN ubicarse debajo del calendario (después del resumen de descansos) y antes de los selectores de tema/orientación.
2. Cada input DEBE tener un ancho máximo de 3 caracteres (días 1-31), con label visible.
3. El botón "Limpiar vacaciones" DEBE mostrarse solo cuando `vacationRange` no es `null`.
4. Al cambiar de mes, los inputs DEBEN resetearse a valor vacío visualmente.
5. La prioridad visual en el calendario es: vacaciones > descanso > normal.

## Reglas de renderizado PDF

1. Celdas de descanso: fondo y borde usan `cellBg`/`cellBorder` del tema activo (ni `restBg` ni `restBorder`).
2. Texto "DESCANSO": `setFont('helvetica', 'bold')`, tamaño 9, color `restLabel`, centrado en celda.
3. Bloque VACACIONES: se renderiza 4 mm debajo del resumen de descansos existente.
4. Label "VACACIONES:" con `setFont('helvetica', 'bold')`, tamaño 10, color `summaryAccent`.
5. Fechas del rango con `setFont('helvetica', 'normal')`, tamaño 9, color `summaryText`.
6. El resumen de descansos existente ("N día(s) de descanso: ...") NO DEBE modificarse.

## No objetivos / Fuera de alcance

- Múltiples rangos de vacaciones por mes
- Persistencia de estado entre recargas de página
- Tests automatizados (no hay infraestructura de test)
- Modificaciones al layout general del PDF (márgenes, tamaño de celdas, encabezados)
- Días de padding (días de otros meses)
- Soporte para rangos que crucen dos meses
- Modificaciones al comportamiento de toggle de descansos individuales
