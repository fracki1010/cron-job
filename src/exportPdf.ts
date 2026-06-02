import jsPDF from 'jspdf'

// ─── layout ────────────────────────────────────────────────
const PAGE_W = 210
const PAGE_H = 297
const ML = 15 // margin-left
const CELL_W = 25.72 // (210 - 2×15) / 7
const CELL_H = 20
const HEADER_H = 9
const TABLE_X = ML
const TABLE_Y = 42
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

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
  isWeekend: boolean
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

    const dow = i % 7
    cells.push({
      day,
      dateStr: `${y}-${pad(m + 1)}-${pad(day)}`,
      isPadding: isPad,
      isWeekend: dow === 0 || dow === 6,
    })
  }
  return cells
}

// ─── colours (slate dark theme) ────────────────────────────
const C = {
  pageBg: '#020617',
  title: '#f59e0b',       // amber-400
  monthTitle: '#e2e8f0',  // slate-200
  headerBg: '#334155',    // slate-700
  headerText: '#cbd5e1',  // slate-300
  normalBg: '#1e293b',    // slate-800
  normalText: '#e2e8f0',  // slate-200
  normalBorder: '#334155', // slate-700
  weekendBg: '#0f172a',   // slate-900 (slightly different)
  weekendText: '#94a3b8', // slate-400
  weekendBorder: '#1e293b',
  paddingBg: '#0f172a',   // slate-900
  paddingText: '#475569', // slate-600
  paddingBorder: '#1e293b',
  restBg: '#064e3b',      // emerald-900
  restText: '#6ee7b7',    // emerald-300
  restBorder: '#34d399',  // emerald-400
  restLabel: '#a7f3d0',   // emerald-200
  summaryText: '#94a3b8', // slate-400
  summaryAccent: '#34d399', // emerald-400
}

// ─── main ──────────────────────────────────────────────────
export async function exportCalendarPdf(
  year: number,
  month: number,
  selectedDays: Set<string>,
  _monthName: string,
): Promise<string> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const cells = buildGrid(year, month)

  // ---------- page background ----------
  pdf.setFillColor(...hex(C.pageBg))
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // ---------- title ----------
  pdf.setTextColor(...hex(C.title))
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CronoJob', PAGE_W / 2, 18, { align: 'center' })

  pdf.setTextColor(...hex(C.monthTitle))
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${_monthName} ${year}`, PAGE_W / 2, 29, { align: 'center' })

  // ---------- day headers ----------
  for (let c = 0; c < 7; c++) {
    const x = TABLE_X + c * CELL_W
    pdf.setFillColor(...hex(C.headerBg))
    pdf.rect(x, TABLE_Y, CELL_W, HEADER_H, 'F')
    pdf.setDrawColor(...hex(C.normalBorder))
    pdf.rect(x, TABLE_Y, CELL_W, HEADER_H, 'S')
    pdf.setTextColor(...hex(C.headerText))
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.text(DAYS[c], x + CELL_W / 2, TABLE_Y + HEADER_H / 2 + 1.2, { align: 'center' })
  }

  // ---------- day cells ----------
  const bodyY = TABLE_Y + HEADER_H

  for (const cell of cells) {
    const i = cells.indexOf(cell)
    const row = Math.floor(i / 7)
    const col = i % 7
    const x = TABLE_X + col * CELL_W
    const y = bodyY + row * CELL_H
    const isRest = selectedDays.has(cell.dateStr)

    // background
    let bg: string, border: string
    if (isRest) {
      bg = C.restBg
      border = C.restBorder
    } else if (cell.isPadding) {
      bg = C.paddingBg
      border = C.paddingBorder
    } else if (cell.isWeekend) {
      bg = C.weekendBg
      border = C.weekendBorder
    } else {
      bg = C.normalBg
      border = C.normalBorder
    }

    pdf.setFillColor(...hex(bg))
    pdf.rect(x, y, CELL_W, CELL_H, 'F')
    pdf.setDrawColor(...hex(border))
    pdf.rect(x, y, CELL_W, CELL_H, 'S')

    // day number
    let txtCol: string
    if (isRest) {
      txtCol = C.restText
    } else if (cell.isPadding) {
      txtCol = C.paddingText
    } else if (cell.isWeekend) {
      txtCol = C.weekendText
    } else {
      txtCol = C.normalText
    }
    pdf.setTextColor(...hex(txtCol))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(String(cell.day), x + 2.5, y + 5.5)

    // "DESCANSO" label inside rest day cells
    if (isRest) {
      pdf.setTextColor(...hex(C.restLabel))
      pdf.setFontSize(5.5)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DESCANSO', x + CELL_W / 2, y + CELL_H / 2 + 4, { align: 'center' })
    }
  }

  // ---------- summary footer ----------
  const sortedDays = [...selectedDays]
    .sort()
    .map((d) => parseInt(d.split('-')[2], 10))

  if (sortedDays.length > 0) {
    const totalRows = Math.ceil(cells.length / 7)
    const sy = bodyY + totalRows * CELL_H + 12

    pdf.setTextColor(...hex(C.summaryAccent))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(
      `${sortedDays.length} día${sortedDays.length !== 1 ? 's' : ''} de descanso:`,
      TABLE_X,
      sy,
    )

    pdf.setTextColor(...hex(C.summaryText))
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(sortedDays.join(', '), TABLE_X, sy + 5)
  }

  // ---------- output ----------
  const blob = pdf.output('blob')
  return URL.createObjectURL(blob)
}
