import jsPDF from 'jspdf'

export type PdfTheme = 'dark' | 'light'
export type PdfOrientation = 'portrait' | 'landscape'

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

// ─── colour themes ─────────────────────────────────────────
const THEMES: Record<PdfTheme, Record<string, string>> = {
  dark: {
    pageBg: '#020617',
    title: '#f59e0b',
    monthTitle: '#e2e8f0',
    headerBg: '#334155',
    headerText: '#cbd5e1',
    cellBg: '#1e293b',
    cellText: '#e2e8f0',
    cellBorder: '#334155',
    paddingBg: '#0f172a',
    paddingText: '#475569',
    paddingBorder: '#1e293b',
    restBg: '#064e3b',
    restText: '#6ee7b7',
    restBorder: '#34d399',
    restLabel: '#a7f3d0',
    summaryText: '#94a3b8',
    summaryAccent: '#34d399',
  },
  light: {
    pageBg: '#ffffff',
    title: '#0f172a',
    monthTitle: '#475569',
    headerBg: '#1e293b',
    headerText: '#ffffff',
    cellBg: '#ffffff',
    cellText: '#0f172a',
    cellBorder: '#cbd5e1',
    paddingBg: '#f8fafc',
    paddingText: '#94a3b8',
    paddingBorder: '#e2e8f0',
    restBg: '#059669',
    restText: '#ffffff',
    restBorder: '#047857',
    restLabel: '#d1fae5',
    summaryText: '#475569',
    summaryAccent: '#059669',
  },
}

// ─── helpers ───────────────────────────────────────────────
function hex(str: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(str)
  if (!m) return [0, 0, 0]
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

interface Cell {
  day: number
  dateStr: string
  isPadding: boolean
}

function buildGrid(year: number, month: number): Cell[] {
  const fd = new Date(year, month, 1).getDay()
  const dim = new Date(year, month + 1, 0).getDate()
  const dimPrev = new Date(year, month, 0).getDate()
  const total = Math.ceil((fd + dim) / 7) * 7
  const cells: Cell[] = []

  for (let i = 0; i < total; i++) {
    const dn = i - fd + 1
    let day: number, m: number, y: number, isPad: boolean

    if (dn < 1) {
      day = dimPrev + dn
      m = month - 1
      y = year
      if (m < 0) { m = 11; y-- }
      isPad = true
    } else if (dn > dim) {
      day = dn - dim
      m = month + 1
      y = year
      if (m > 11) { m = 0; y++ }
      isPad = true
    } else {
      day = dn
      m = month
      y = year
      isPad = false
    }

    cells.push({
      day,
      dateStr: `${y}-${pad(m + 1)}-${pad(day)}`,
      isPadding: isPad,
    })
  }
  return cells
}

// ─── layout per orientation ────────────────────────────────
function layout(orientation: PdfOrientation) {
  const isPortrait = orientation === 'portrait'
  const pageW = isPortrait ? 210 : 297
  const pageH = isPortrait ? 297 : 210
  const ml = 15
  const cellW = (pageW - 2 * ml) / 7 // full width, 7 columns
  const cellH = isPortrait ? 26 : 22
  const headerH = 11
  const tableX = ml
  const tableY = 44
  return { pageW, pageH, cellW, cellH, headerH, tableX, tableY }
}

// ─── main ──────────────────────────────────────────────────
export async function exportCalendarPdf(
  year: number,
  month: number,
  selectedDays: Set<string>,
  monthName: string,
  theme: PdfTheme,
  orientation: PdfOrientation,
  vacationRange: [number, number] | null,
): Promise<string> {
  const jsPdfOrientation = orientation === 'portrait' ? 'p' : 'l'
  const pdf = new jsPDF(jsPdfOrientation, 'mm', 'a4')
  const cells = buildGrid(year, month)
  const C = THEMES[theme]
  const L = layout(orientation)

  // ── page bg ──
  pdf.setFillColor(...hex(C.pageBg))
  pdf.rect(0, 0, L.pageW, L.pageH, 'F')

  // ── title ──
  pdf.setTextColor(...hex(C.title))
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CronoJob', L.pageW / 2, 18, { align: 'center' })

  pdf.setTextColor(...hex(C.monthTitle))
  pdf.setFontSize(15)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${monthName} ${year}`, L.pageW / 2, 31, { align: 'center' })

  // ── day headers ──
  for (let c = 0; c < 7; c++) {
    const x = L.tableX + c * L.cellW
    pdf.setFillColor(...hex(C.headerBg))
    pdf.rect(x, L.tableY, L.cellW, L.headerH, 'F')
    pdf.setDrawColor(...hex(C.cellBorder))
    pdf.rect(x, L.tableY, L.cellW, L.headerH, 'S')
    pdf.setTextColor(...hex(C.headerText))
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(DAYS[c], x + L.cellW / 2, L.tableY + L.headerH / 2 + 1.5, { align: 'center' })
  }

  // ── day cells ──
  const bodyY = L.tableY + L.headerH

  for (const cell of cells) {
    const i = cells.indexOf(cell)
    const row = Math.floor(i / 7)
    const col = i % 7
    const x = L.tableX + col * L.cellW
    const y = bodyY + row * L.cellH
    const isRest = selectedDays.has(cell.dateStr)

    // background & border
    let bg: string, border: string
    if (isRest) {
      bg = C.cellBg
      border = C.cellBorder
    } else if (cell.isPadding) {
      bg = C.paddingBg
      border = C.paddingBorder
    } else {
      bg = C.cellBg
      border = C.cellBorder
    }

    pdf.setFillColor(...hex(bg))
    pdf.rect(x, y, L.cellW, L.cellH, 'F')
    pdf.setDrawColor(...hex(border))
    pdf.rect(x, y, L.cellW, L.cellH, 'S')

    // day number
    let txtCol: string
    if (isRest) {
      txtCol = C.restText
    } else if (cell.isPadding) {
      txtCol = C.paddingText
    } else {
      txtCol = C.cellText
    }
    pdf.setTextColor(...hex(txtCol))
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(String(cell.day), x + 3, y + 7)

    // "DESCANSO" inside rest cells
    if (isRest) {
      pdf.setTextColor(...hex(C.restLabel))
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DESCANSO', x + L.cellW / 2, y + L.cellH / 2 + 5, { align: 'center' })
    }
  }

  // ── summary footer ──
  const sortedDays = [...selectedDays]
    .sort()
    .map((d) => parseInt(d.split('-')[2], 10))

  const totalRows = Math.ceil(cells.length / 7)
  const sy = bodyY + totalRows * L.cellH + 14

  if (sortedDays.length > 0) {
    pdf.setTextColor(...hex(C.summaryAccent))
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(
      `${sortedDays.length} día${sortedDays.length !== 1 ? 's' : ''} de descanso:`,
      L.tableX,
      sy,
    )

    pdf.setTextColor(...hex(C.summaryText))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(sortedDays.join(', '), L.tableX, sy + 5)
  }

  // ── vacation block ──
  const vacationY = sortedDays.length > 0 ? sy + 9 : sy
  if (vacationRange) {
    pdf.setTextColor(...hex(C.summaryAccent))
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('VACACIONES:', L.tableX, vacationY)

    pdf.setTextColor(...hex(C.summaryText))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `${vacationRange[0]} al ${vacationRange[1]} de ${monthName} de ${year}`,
      L.tableX,
      vacationY + 5,
    )
  }

  // ── output ──
  const blob = pdf.output('blob')
  return URL.createObjectURL(blob)
}
