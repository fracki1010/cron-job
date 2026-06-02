import { useState } from 'react'
import { exportCalendarPdf, type PdfTheme, type PdfOrientation } from './exportPdf'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

interface Cell {
  day: number
  isPadding: boolean
  dateStr: string
}

export default function App() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('dark')
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('portrait')

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const toggleDay = (dateStr: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }

  const clearDays = () => {
    setSelectedDays(new Set())
    setPdfUrl(null)
  }

  // --- build calendar grid ---
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7

  const pad = (n: number) => String(n).padStart(2, '0')

  const cells: Cell[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPadding + 1
    if (dayNum >= 1 && dayNum <= daysInMonth) {
      return {
        day: dayNum,
        isPadding: false,
        dateStr: `${year}-${pad(month + 1)}-${pad(dayNum)}`,
      }
    }
    return { day: dayNum, isPadding: true, dateStr: '' }
  })

  // --- selected days sorted for summary ---
  const sortedDays = [...selectedDays]
    .sort()
    .map((d) => parseInt(d.split('-')[2], 10))

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    setPdfUrl(null)
    try {
      const url = await exportCalendarPdf(
        year,
        month,
        selectedDays,
        MONTHS[month],
        pdfTheme,
        pdfOrientation,
      )
      setPdfUrl(url)

      const filename = `cronograma-${MONTHS[month].toLowerCase()}-${year}.pdf`
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF'
      setError(msg)
      console.error('PDF export error:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white font-[system-ui,sans-serif]">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-amber-400">
            CronoJob
          </h1>
          <p className="text-sm text-slate-400">
            Tocá los días que vas a descansar
          </p>
        </header>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex size-10 items-center justify-center rounded-xl text-lg text-slate-300 transition-colors hover:bg-slate-800 active:bg-slate-700"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h2 className="text-base font-semibold text-white">
            {MONTHS[month]} <span className="text-slate-400">{year}</span>
          </h2>
          <button
            onClick={nextMonth}
            className="flex size-10 items-center justify-center rounded-xl text-lg text-slate-300 transition-colors hover:bg-slate-800 active:bg-slate-700"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        {/* Calendar */}
        <div className="overflow-hidden rounded-2xl bg-slate-900 p-4 pb-5">
          {/* Month title inside capture */}
          <h3 className="mb-3 text-center text-xs font-semibold tracking-widest text-slate-400">
            {MONTHS[month].toUpperCase()} {year}
          </h3>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[11px] font-medium text-slate-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const selected = selectedDays.has(cell.dateStr)
              return (
                <button
                  key={cell.dateStr || `pad-${cell.day}`}
                  disabled={cell.isPadding}
                  onClick={() => toggleDay(cell.dateStr)}
                  className={`
                    aspect-square rounded-xl text-sm font-medium
                    transition-all duration-100
                    ${
                      cell.isPadding
                        ? 'invisible'
                        : ''
                    }
                    ${
                      selected
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                        : 'border border-transparent text-slate-300 hover:bg-slate-800 active:scale-95'
                    }
                  `}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Summary */}
          {sortedDays.length > 0 && (
            <div className="mt-4 border-t border-slate-800 pt-3 text-sm leading-relaxed text-slate-400">
              <span className="font-medium text-emerald-400">
                {sortedDays.length} día{sortedDays.length !== 1 ? 's' : ''} de
                descanso:
              </span>{' '}
              {sortedDays.join(' · ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {pdfUrl ? (
            <div className="flex flex-col gap-2">
              <a
                href={pdfUrl}
                download={`cronograma-${MONTHS[month].toLowerCase()}-${year}.pdf`}
                className="block w-full rounded-xl bg-amber-500 py-3.5 text-center font-semibold text-slate-950 transition-colors hover:bg-amber-400 active:bg-amber-300"
              >
                Descargar PDF
              </a>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-center text-sm text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                Abrir en nueva pestaña
              </a>
              <button
                onClick={() => setPdfUrl(null)}
                className="self-center text-sm text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                Volver y editar
              </button>
            </div>
          ) : (
            <>
              {/* Theme selector */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-slate-400">Fondo:</span>
                <button
                  onClick={() => setPdfTheme('dark')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pdfTheme === 'dark'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ⬛ Negro
                </button>
                <button
                  onClick={() => setPdfTheme('light')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pdfTheme === 'light'
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ⬜ Blanco
                </button>
              </div>

              {/* Orientation selector */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-slate-400">Hoja:</span>
                <button
                  onClick={() => setPdfOrientation('portrait')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pdfOrientation === 'portrait'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ⟲ Vertical
                </button>
                <button
                  onClick={() => setPdfOrientation('landscape')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pdfOrientation === 'landscape'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ⟳ Horizontal
                </button>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting || selectedDays.size === 0}
                className="w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400 active:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
              >
                {exporting ? 'Generando PDF…' : 'Descargar PDF'}
              </button>
            </>
          )}

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          {!pdfUrl && selectedDays.size > 0 && (
            <button
              onClick={clearDays}
              className="self-center text-sm text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-300"
            >
              Limpiar selección
            </button>
          )}
        </div>

        {/* Footer hint */}
        <p className="mt-2 text-center text-xs text-slate-600">
          Podés instalar esta app en tu celular desde el menú del navegador
        </p>
      </div>
    </div>
  )
}
