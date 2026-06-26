# Diseño: Formato PDF de cronograma con selección de vacaciones

## Enfoque técnico

Dos cambios sobre una SPA monousuario sin estado persistente: (1) celdas de descanso en PDF sin fondo de color, (2) selección de rango de vacaciones con su bloque en el pie del PDF y su color distintivo en el calendario UI. No se requiere migración ni refactor estructural. La implementación modifica solo `src/App.tsx` y `src/exportPdf.ts`.

## Decisiones de arquitectura

### D-01: Inputs como strings, rango derivado

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `vacationRange` como estado único con `null` | Requiere lógica extra para inputs vacíos y reseteo por mes | |
| Strings `vacationFrom`/`vacationTo` + rango derivado | Validación separable, reseteo limpio seteando `''` | **SÍ** |

Los inputs se almacenan como `string` y el rango `[number, number] | null` se computa por validación conjunta. Esto permite inputs vacíos al iniciar o al navegar entre meses, y mostrar errores de validación sin contaminar el rango.

### D-02: Sin nuevos colores en el tema PDF

El bloque VACACIONES reutiliza `summaryAccent`/`summaryText` existentes. Las celdas de descanso usan `cellBg`/`cellBorder`. Los colores de vacaciones (índigo) son exclusivos de la UI con clases Tailwind. Las propiedades `restBg` y `restBorder` en `THEMES` quedan como código muerto — se conservan para minimizar diff y facilitar rollback.

### D-03: Prioridad visual: vacaciones > descanso > normal

Cadena de condición en la clase CSS del botón de día: (1) si está en `vacationRange` → índigo, (2) si está en `selectedDays` → esmeralda, (3) default. En el PDF no aplica porque las vacaciones no tienen representación en celdas.

## Flujo de datos

```
Inputs "Desde"/"Hasta"  ──→  validateAndSet()  ──→  vacationFrom/vacationTo (string)
                                                            │
                              ┌──────────────────────────────┤
                              ▼                              ▼
                      Calendar cells                  exportCalendarPdf
                      (bg índigo si en rango,          (bloque VACACIONES
                       sobreescribe descanso)           en footer, si rango)

Navegación mes ──→ resetVacation()
                    ├── vacationFrom = ''
                    ├── vacationTo = ''
                    └── vacationRange = null
```

## Cambios en archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/App.tsx` | Modificar | +estado vacaciones, +inputs numéricos, +validación, +color índigo en celdas, +limpiar vacaciones, modificar handleExport y navegación |
| `src/exportPdf.ts` | Modificar | +parámetro `vacationRange`, celdas de descanso con `cellBg`/`cellBorder`, +bloque VACACIONES en footer |

## Interfaces y contratos

### Estado nuevo en App.tsx

```typescript
const [vacationFrom, setVacationFrom] = useState('')
const [vacationTo, setVacationTo] = useState('')
const [vacationRange, setVacationRange] = useState<[number, number] | null>(null)
const [vacationError, setVacationError] = useState<string | null>(null)
```

### Firma modificada de exportCalendarPdf

```typescript
export async function exportCalendarPdf(
  year: number,
  month: number,
  selectedDays: Set<string>,
  monthName: string,
  theme: PdfTheme,
  orientation: PdfOrientation,
  vacationRange: [number, number] | null,   // ← NUEVO
): Promise<string>
```

### Validación

```
validateVacation(from: string, to: string, daysInMonth: number)
  → { range: [number, number] | null; error: string | null }
```

- Si `from === ''` o `to === ''` → rango `null`, sin error.
- Si `parseInt > daysInMonth` → error `"El día está fuera del rango del mes (1-{daysInMonth})"`.
- Si `parseInt(from) > parseInt(to)` → error `"El día de inicio debe ser menor o igual al día de fin"`.
- Válido → `range: [from, to]`, `error: null`.

## Renderizado PDF — Detalle

### Celda de descanso

| Aspecto | Antes | Después |
|---------|-------|---------|
| Fondo | `setFillColor(restBg)` | `setFillColor(cellBg)` |
| Borde | `setDrawColor(restBorder)` | `setDrawColor(cellBorder)` |
| Número día | `setTextColor(restText)` en `(x+3, y+7)` | Sin cambios |
| Texto "DESCANSO" | `setTextColor(restLabel)`, bold 9px, centrado en celda | Sin cambios |

### Bloque VACACIONES en footer

```
sy = bodyY + totalRows * cellH + 14

if sortedDays.length > 0:
  summary label  → draw "X día(s) de descanso:"  en summaryAccent bold 10px  en sy
  summary dates  → draw "1, 2, 3"                en summaryText normal 9px   en sy+5
  vacationY = sy + 9        // 5mm fechas + 4mm gap
else:
  vacationY = sy

if vacationRange:
  → setFont('helvetica', 'bold'), fontSize 10, setTextColor(summaryAccent)
  → text('VACACIONES:', tableX, vacationY)
  → setFont('helvetica', 'normal'), fontSize 9, setTextColor(summaryText)
  → text('{from} al {to} de {monthName} de {year}', tableX, vacationY + 5)
```

## Reglas de comportamiento UI

1. Inputs "Desde"/"Hasta" debajo del calendario, después del resumen de descansos, antes de los selectores de tema/orientación. `maxLength=2`, patrón solo dígitos.
2. Botón "Limpiar vacaciones" visible solo cuando `vacationRange !== null`. Resetea solo estado de vacaciones.
3. Botón "Limpiar selección" (global) resetea `selectedDays` Y `vacationRange`.
4. Navegación de mes resetea `vacationFrom`, `vacationTo`, `vacationRange`.
5. Botón "Descargar PDF" habilitado si `selectedDays.size > 0 || vacationRange !== null`.
6. Vacaciones en calendario: `border border-indigo-500/40 bg-indigo-500/20 text-indigo-400` (índigo, distinto del verde `emerald-500` de descansos).

## Estrategia de testing

No hay infraestructura de tests (`no_test_infrastructure: true` en config.yaml). La validación será manual:
- Verificar que el PDF generado no tenga fondos verdes en descansos
- Verificar que el bloque VACACIONES aparezca con el rango correcto
- Verificar que la UI muestre colores distintos para descanso vs vacaciones
- Verificar que "Limpiar vacaciones" no afecte descansos
- Verificar que navegar entre meses resetee las vacaciones
- Verificar que el botón de exportar se habilite solo con vacaciones

## Migración

No requiere migración. No hay persistencia, API, ni datos almacenados. Reversión inmediata con `git revert`.
