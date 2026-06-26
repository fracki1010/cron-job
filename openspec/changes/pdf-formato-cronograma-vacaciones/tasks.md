# Tasks: Formato PDF con selección de vacaciones

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | ~70–80 |
| Riesgo de presupuesto 400 líneas | Bajo |
| Chained PRs recomendados | No |
| Estrategia sugerida | PR único |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Fase 1: Fondo de descanso en PDF (`src/exportPdf.ts`)

- [x] 1.1 Cambiar celdas de descanso: `bg = C.cellBg`, `border = C.cellBorder` (líneas 176–178). Mantener "DESCANSO" centrado y número de día en posición actual.
- [x] 1.2 Verificar manual: PDF generado sin fondo verde en celdas de descanso, "DESCANSO" centrado con color `restLabel`, día en top-left con `restText`.

## Fase 2: Estado y validación de vacaciones (`src/App.tsx`)

- [x] 2.1 Agregar estados: `vacationFrom`, `vacationTo` (string, `useState('')`), `vacationRange` (`[number,number] | null`), `vacationError` (string | null).
- [x] 2.2 Implementar `validateVacation(from, to, daysInMonth)` → `{range, error}` validando: vacío sin error, parse, bounds del mes, from ≤ to.
- [x] 2.3 Agregar inputs "Desde" / "Hasta" numéricos (`maxLength=2`, solo dígitos) debajo del resumen de descansos, antes de selectores de tema/orientación. Mostrar `vacationError` si existe.

## Fase 3: Color de vacaciones en calendario (`src/App.tsx`)

- [x] 3.1 En clase CSS del botón de día: si `cell.day` está en `vacationRange` → `border border-indigo-500/40 bg-indigo-500/20 text-indigo-400`. Prioridad: vacaciones > descanso > normal.

## Fase 4: Comportamientos UI de vacaciones (`src/App.tsx`)

- [x] 4.1 Agregar botón "Limpiar vacaciones" visible solo si `vacationRange !== null`. Resetea `vacationFrom`, `vacationTo`, `vacationRange`, `vacationError`.
- [x] 4.2 Modificar `clearDays` (global) para resetear también estado de vacaciones.
- [x] 4.3 Resetear estado de vacaciones en `prevMonth` / `nextMonth`.
- [x] 4.4 Modificar `disabled` del botón exportar: `exporting || (selectedDays.size === 0 && vacationRange === null)`.

## Fase 5: Bloque VACACIONES en PDF (`src/exportPdf.ts` + `src/App.tsx`)

- [x] 5.1 Agregar parámetro `vacationRange: [number, number] | null` a `exportCalendarPdf`.
- [x] 5.2 Agregar bloque "VACACIONES: {from} al {to} de {monthName} de {year}" en footer condicional (4 mm debajo del resumen de descansos). Label con `summaryAccent` bold 10px, fechas con `summaryText` normal 9px. Sin bloque si `vacationRange` es null.
- [x] 5.3 Pasar `vacationRange` desde `handleExport` en App.tsx. Verificar manual: PDF con/sin bloque VACACIONES según rango activo.
