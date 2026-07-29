'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { useStore, formatMoney } from '@/lib/store'
import type { Job, JobStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────
   Trabajos = historial cronológico (no un CRM / no una lista de clientes).
   El usuario piensa "¿qué hice ayer? ¿esta semana? ¿cuánto cobré este mes?".
   Por eso: agrupado por fecha, con selector de período y un resumen mensual.
   ──────────────────────────────────────────────────────────────────────── */

type Period = 'hoy' | 'semana' | 'mes' | 'todo'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'todo', label: 'Todo' },
]

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const MESES_ABBR = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function diffInDays(iso: string): number {
  const today = midnight(new Date()).getTime()
  const that = midnight(parseISO(iso)).getTime()
  return Math.round((today - that) / 86_400_000)
}

/** Encabezado de grupo: HOY / AYER / MAÑANA / "VIERNES 25 JUL". */
function headerLabel(iso: string): string {
  const diff = diffInDays(iso)
  if (diff === 0) return 'HOY'
  if (diff === 1) return 'AYER'
  if (diff === -1) return 'MAÑANA'
  const d = parseISO(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES_ABBR[d.getMonth()]}`.toUpperCase()
}

function inPeriod(iso: string, period: Period): boolean {
  if (period === 'todo') return true
  const date = midnight(parseISO(iso))
  const today = midnight(new Date())
  if (period === 'hoy') return date.getTime() === today.getTime()
  if (period === 'mes') {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    )
  }
  // semana: lunes a domingo de la semana actual
  const dow = (today.getDay() + 6) % 7 // 0 = lunes
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return date >= monday && date <= sunday
}

/** Búsqueda ampliada: cliente, dirección, teléfono, notas, presupuesto. */
function matchesQuery(job: Job, q: string): boolean {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const haystack = [
    job.cliente,
    job.titulo,
    job.direccion,
    job.telefono,
    ...job.notas.map((n) => n.text),
    job.quote?.descripcion,
    ...(job.quote?.items?.map((i) => i.descripcion) ?? []),
    job.quote ? formatMoney(job.quote.total) : '',
    typeof job.montoCobrado === 'number' ? formatMoney(job.montoCobrado) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(t)
}

const plural = (n: number, sing: string, plur: string) =>
  `${n} ${n === 1 ? sing : plur}`

export function TrabajosScreen() {
  const { jobs, profile } = useStore()
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState<Period>('todo')

  const searching = q.trim().length > 0

  // Buscar recorre TODO el historial; sin búsqueda, se aplica el período.
  const filtered = useMemo(() => {
    return jobs
      .filter((j) => (searching ? matchesQuery(j, q) : inPeriod(j.fecha, period)))
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha)) // más nuevo primero
  }, [jobs, q, period, searching])

  // Agrupar por fecha, preservando el orden ya ordenado.
  const groups = useMemo(() => {
    const out: { iso: string; label: string; jobs: Job[] }[] = []
    for (const j of filtered) {
      const last = out[out.length - 1]
      if (last && last.iso === j.fecha) last.jobs.push(j)
      else out.push({ iso: j.fecha, label: headerLabel(j.fecha), jobs: [j] })
    }
    return out
  }, [filtered])

  // Resumen del mes (solo cuando el período es "Este mes" y no se está buscando).
  const monthSummary = useMemo(() => {
    if (period !== 'mes' || searching) return null
    const inMonth = jobs.filter((j) => inPeriod(j.fecha, 'mes'))
    const cobrado = inMonth
      .filter((j) => j.cobrado)
      .reduce((s, j) => s + (j.montoCobrado ?? j.quote?.total ?? 0), 0)
    return {
      mes: MESES[new Date().getMonth()],
      trabajos: inMonth.length,
      cobrado,
      presupuestos: inMonth.filter((j) => j.quote?.status === 'enviado').length,
      pendientesCobro: inMonth.filter(
        (j) => j.status === 'terminado' && !j.cobrado,
      ).length,
      seguimientos: inMonth.filter(
        (j) =>
          j.quote?.status === 'enviado' &&
          (j.quote.enviadoHace ?? 0) >= 3 &&
          j.status !== 'cobrado',
      ).length,
    }
  }, [jobs, period, searching])

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="flex items-center justify-between px-5 pb-1 pt-7">
        <h1 className="text-[32px] font-extrabold tracking-tight text-foreground">
          Trabajos
        </h1>
        <div className="flex size-10 items-center justify-center rounded-full bg-card text-[15px] font-bold text-foreground shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          {profile.nombre.slice(0, 1)}
        </div>
      </header>

      {/* Buscador (sticky) */}
      <div className="sticky top-0 z-10 bg-background/90 px-5 py-3 backdrop-blur">
        <div className="input-soft flex items-center gap-2.5 px-4">
          <Search className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, dirección, nota o monto"
            className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Selector de período (se oculta al buscar: la búsqueda ve todo) */}
        {!searching && (
          <div className="mt-3 flex gap-1 rounded-full bg-secondary p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'flex-1 rounded-full px-2 py-2 text-[13px] font-semibold transition-all duration-200',
                  period === p.key
                    ? 'bg-card text-foreground shadow-[var(--shadow-soft)]'
                    : 'text-muted-foreground active:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-10">
        {/* Resumen mensual */}
        {monthSummary && <MonthSummary s={monthSummary} />}

        {/* Nota al buscar */}
        {searching && (
          <p className="mb-3 mt-1 px-1 text-[13px] font-medium text-muted-foreground">
            {filtered.length === 0
              ? `Sin resultados para “${q.trim()}”`
              : `${plural(filtered.length, 'resultado', 'resultados')} en todo el historial`}
          </p>
        )}

        {/* Lista agrupada por fecha */}
        {groups.length > 0 ? (
          <div className="flex flex-col gap-7">
            {groups.map((g) => (
              <section key={g.iso}>
                <h2 className="mb-2.5 px-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </h2>
                <div className="card-soft overflow-hidden">
                  {g.jobs.map((j, i) => (
                    <HistoryRow key={j.id} job={j} divider={i > 0} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          !searching && (
            <p className="mt-12 text-center text-[15px] text-muted-foreground">
              No hay trabajos en este período.
            </p>
          )
        )}
      </div>
    </div>
  )
}

/* ── Fila de historial ──────────────────────────────────────────────────
   Jerarquía de lectura: los trabajos abiertos (esperando / pendiente de cobro)
   pesan más; los cobrados se muestran apagados y con el monto facturado.     */

function HistoryRow({ job, divider }: { job: Job; divider: boolean }) {
  const { go } = useStore()
  const cobrado = job.status === 'cobrado'

  return (
    <button
      type="button"
      onClick={() => go({ name: 'trabajo', jobId: job.id })}
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-4 text-left transition active:bg-black/[0.02]',
        divider && 'border-t border-border/60',
      )}
    >
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold',
          cobrado
            ? 'bg-secondary/70 text-muted-foreground'
            : 'bg-secondary text-secondary-foreground',
        )}
      >
        {job.cliente.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[17px] font-bold',
            cobrado ? 'text-foreground/80' : 'text-foreground',
          )}
        >
          {job.titulo || job.cliente}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {job.titulo && job.titulo !== job.cliente
            ? job.cliente
            : (job.direccion ?? 'Sin dirección')}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusTag status={job.status} />
        {cobrado ? (
          typeof job.montoCobrado === 'number' && (
            <span className="text-[13px] font-semibold text-status-cobrado">
              {formatMoney(job.montoCobrado)}
            </span>
          )
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </div>
    </button>
  )
}

/* Etiqueta de estado con jerarquía. No usa el StatusChip global para no
   alterar la pantalla Hoy: "cobrado" acá va apagado (menos protagonismo). */
function StatusTag({ status }: { status: JobStatus }) {
  // Cada estado con identidad de color propia (dot + tinte), no una pill gris.
  const cfg: Record<JobStatus, { pill: string; dot: string; label: string }> = {
    agendado: { pill: 'bg-primary/[0.08] text-primary', dot: 'bg-primary', label: 'Agendado' },
    proceso: {
      pill: 'bg-status-proceso text-status-proceso-foreground',
      dot: 'bg-status-proceso-foreground',
      label: 'En proceso',
    },
    esperando: {
      pill: 'bg-status-esperando text-status-esperando-foreground',
      dot: 'bg-status-esperando-foreground',
      label: 'Esperando',
    },
    terminado: {
      pill: 'bg-status-terminado text-status-terminado-foreground',
      dot: 'bg-status-terminado-foreground',
      label: 'Pendiente de cobro',
    },
    // cobrado: apagado (cerrado), pero con dot verde para leerse "cobrado"
    cobrado: { pill: 'bg-secondary text-muted-foreground', dot: 'bg-status-cobrado', label: 'Cobrado' },
  }
  const c = cfg[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none',
        c.pill,
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}

/* ── Resumen mensual: el monto es el protagonista; cada indicador con color ── */
function MonthSummary({
  s,
}: {
  s: {
    mes: string
    trabajos: number
    cobrado: number
    presupuestos: number
    pendientesCobro: number
    seguimientos: number
  }
}) {
  return (
    <div className="card-soft mb-6 p-5">
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
        {s.mes}
      </p>
      <p className="mt-1 text-[36px] font-extrabold leading-none tracking-tight text-foreground">
        {formatMoney(s.cobrado)}
      </p>
      <p className="mt-2 text-[13px] font-medium text-muted-foreground">
        cobrado · {plural(s.trabajos, 'trabajo', 'trabajos')} este mes
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <IndChip tone="green" value={s.pendientesCobro} label="Por cobrar" />
        <IndChip tone="amber" value={s.presupuestos} label="Presupuestos" />
        <IndChip tone="blue" value={s.seguimientos} label="Seguimientos" />
      </div>
    </div>
  )
}

function IndChip({
  tone,
  value,
  label,
}: {
  tone: 'green' | 'amber' | 'blue'
  value: number
  label: string
}) {
  const tones = {
    green: { bg: 'bg-status-terminado/50', num: 'text-status-terminado-foreground', dot: 'bg-status-terminado-foreground' },
    amber: { bg: 'bg-status-esperando/50', num: 'text-status-esperando-foreground', dot: 'bg-status-esperando-foreground' },
    blue: { bg: 'bg-accent', num: 'text-accent-foreground', dot: 'bg-accent-foreground' },
  }[tone]
  return (
    <div className={cn('rounded-2xl px-3 py-2.5', tones.bg)}>
      <div className="flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', tones.dot)} />
        <span className={cn('text-[19px] font-extrabold leading-none tabular-nums', tones.num)}>
          {value}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
