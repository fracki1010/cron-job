# Propuesta: Formato PDF de cronograma con selección de vacaciones

## Intento

El PDF actual pinta descansos con fondo verde. El usuario tiene un cronograma impreso (JULIO 2025) de referencia donde los descansos no llevan fondo de color, solo texto centrado. Además necesita seleccionar un rango continuo de vacaciones por mes y que aparezca un bloque "VACACIONES" en el PDF.

## Alcance

### Incluye
- PDF: descansos sin fondo de color, texto "Descanso" centrado
- UI: selector de rango continuo de vacaciones (día desde / día hasta)
- UI: distinción visual de vacaciones en calendario
- UI: limpiar selección de vacaciones
- PDF: bloque "VACACIONES" con rango de fechas en el pie

### Excluye
- Múltiples rangos por mes, persistencia, tests, cambios en padding
- Modificaciones al selector de descansos existente ni al layout general del PDF

## Capacidades

### Nuevas
- `vacation-selection`: selector visual de rango continuo de vacaciones

### Modificadas
- `calendar-ui`: agrega controles de vacaciones al calendario
- `pdf-export`: renderizado de descansos y bloque VACACIONES

## Enfoque

1. Estado `vacationRange: [number, number] | null` en App.tsx
2. UI para seleccionar día inicial y final del rango
3. Modificar exportPdf.ts: (a) descansos sin fondo, texto centrado; (b) bloque VACACIONES en pie
4. Highlight verde en UI para descansos, color distinto para vacaciones

## Archivos afectados

| Archivo | Impacto | Descripción |
|---------|---------|-------------|
| `src/App.tsx` | Modificado | +estado vacationRange, +controles UI |
| `src/exportPdf.ts` | Modificado | Renderizado descansos, bloque VACACIONES |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Layout PDF alterado al cambiar celdas | Baja | Mantener dimensiones de celda |
| Confusión UX descanso vs vacaciones | Media | Colores y etiquetas distintos |
| Estado inconsistente al cambiar de mes | Baja | Limpiar vacationRange al navegar |

## Plan de reversión

`git revert` del commit. Sin migración de datos ni impacto persistente.

## Dependencias

Ninguna.

## Criterios de éxito

- [ ] PDF generado coincide con referencia (sin fondo verde en descansos)
- [ ] Se puede seleccionar y limpiar un rango de vacaciones en la UI
- [ ] Bloque "VACACIONES" en PDF con el rango correcto
- [ ] Descansos regulares siguen igual en UI (highlight verde)
- [ ] Layout del PDF (grilla, encabezados, colores, orientación) intacto
