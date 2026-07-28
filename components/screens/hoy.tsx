'use client'

import { useState } from 'react'
import {
  Check,
  Phone,
  Wallet,
  Plus,
  RotateCcw,
  FileClock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { useStore, formatMoney } from '@/lib/store'
import { callPhone } from '@/lib/actions'
import type { Reminder } from '@/lib/types'
import { cn } from '@/lib/utils'
import { JobRow } from '../job-row'

/** Máximo de recordatorios visibles antes de colapsar. La cantidad es parte
 *  del diseño emocional: pocas cosas y bajo control, no una torre de pendientes. */
const MAX_VISIBLE_REMINDERS = 3

function todayLabel() {
  const d = new Date()
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ]
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
}

export function HoyScreen() {
  const { profile, jobs, reminders, go } = useStore()
  const hoy = jobs.filter((j) => j.esHoy && j.status !== 'cobrado')

  const [showAllReminders, setShowAllReminders] = useState(false)
  const visibleReminders = showAllReminders
    ? reminders
    : reminders.slice(0, MAX_VISIBLE_REMINDERS)
  const hiddenCount = reminders.length - visibleReminders.length

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header — solo la fecha ancla el día. Sin saludo: gana aire para que
          los trabajos de hoy entren en la primera pantalla. */}
      <header className="flex items-end justify-between px-5 pb-1 pt-6">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-foreground">
          {todayLabel()}
        </h1>
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground">
          {profile.nombre.slice(0, 1)}
        </div>
      </header>

      {/* No te olvides — el corazón de la app */}
      {reminders.length > 0 && (
        <section className="mt-4 px-5">
          <div className="mb-2.5 flex items-baseline justify-between px-0.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              No te olvides
            </h2>
            <span className="text-[13px] font-medium text-muted-foreground">
              {reminders.length} {reminders.length === 1 ? 'cosa' : 'cosas'}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {visibleReminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </div>

          {reminders.length > MAX_VISIBLE_REMINDERS && (
            <button
              type="button"
              onClick={() => setShowAllReminders((v) => !v)}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[14px] font-semibold text-muted-foreground active:bg-muted"
            >
              {showAllReminders ? (
                <>
                  Ver menos <ChevronUp className="size-4" strokeWidth={2.5} />
                </>
              ) : (
                <>
                  Ver {hiddenCount} {hiddenCount === 1 ? 'pendiente' : 'pendientes'} más
                  <ChevronDown className="size-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          )}
        </section>
      )}

      {/* Trabajos de hoy */}
      <section className="mt-5 px-5 pb-10">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Trabajos de hoy
        </h2>
        {hoy.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {hoy.map((j, i) => (
              <JobRow key={j.id} job={j} divider={i > 0} />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-[17px] font-semibold text-foreground text-balance">
              Hoy no tenés trabajos.
            </p>
            <p className="max-w-[220px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Tocá el botón de abajo para agregar uno.
            </p>
            <button
              type="button"
              onClick={() => go({ name: 'crear' })}
              className="mt-1 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground active:scale-95"
            >
              <Plus className="size-5" /> Nuevo trabajo
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

const BADGE: Record<
  Reminder['action'],
  { icon: typeof Wallet; badge: string; eyebrow: string }
> = {
  cobrar: {
    icon: Wallet,
    badge: 'bg-status-terminado text-status-terminado-foreground',
    eyebrow: 'Cobro pendiente',
  },
  volver: {
    icon: RotateCcw,
    badge: 'bg-accent text-accent-foreground',
    eyebrow: 'Recordatorio',
  },
  'seguir-presupuesto': {
    icon: FileClock,
    badge: 'bg-status-esperando text-status-esperando-foreground',
    eyebrow: 'Presupuesto',
  },
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const { dismissReminder, getJob, go, markCobrado } = useStore()
  const job = getJob(reminder.jobId)
  const meta = BADGE[reminder.action]
  const Icon = meta.icon

  // Estado local para el cobro inline: un recordatorio de cobro NO se puede
  // descartar sin registrar. La única salida es registrar el monto.
  const [confirmingCobro, setConfirmingCobro] = useState(false)
  const [monto, setMonto] = useState(
    reminder.amount ? String(reminder.amount) : '',
  )
  const montoNum = Number(monto.replace(/[^0-9]/g, '')) || 0

  const registrarCobro = () => {
    if (montoNum <= 0) return
    markCobrado(reminder.jobId, montoNum)
    dismissReminder(reminder.id)
  }

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-3.5 shadow-sm',
        reminder.priority
          ? 'border-status-terminado-foreground/25 ring-1 ring-status-terminado-foreground/15'
          : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            meta.badge,
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {meta.eyebrow}
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground text-pretty">
            {reminder.text}
          </p>
          {reminder.subtitle && (
            <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
              {reminder.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* COBRO — sin "Listo": la única salida es registrar el cobro */}
      {reminder.action === 'cobrar' &&
        (confirmingCobro ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2">
              <span className="text-[15px] font-semibold text-muted-foreground">$</span>
              <input
                autoFocus
                inputMode="numeric"
                value={monto ? Number(monto.replace(/[^0-9]/g, '')).toLocaleString('es-AR') : ''}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Monto cobrado"
                className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={registrarCobro}
              disabled={montoNum <= 0}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-status-cobrado px-4 py-2.5 text-[14px] font-semibold text-status-cobrado-foreground active:scale-[0.98] disabled:opacity-40"
            >
              <Check className="size-4" strokeWidth={2.5} /> Confirmar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCobro(false)}
              aria-label="Cancelar"
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground active:scale-[0.98]"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setConfirmingCobro(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-status-cobrado px-4 py-2.5 text-[14px] font-semibold text-status-cobrado-foreground active:scale-[0.98]"
            >
              <Wallet className="size-4" strokeWidth={2.5} /> Registrar cobro
            </button>
          </div>
        ))}

      {/* VOLVER */}
      {reminder.action === 'volver' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go({ name: 'trabajo', jobId: reminder.jobId })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground active:scale-[0.98]"
          >
            Abrir trabajo <ArrowUpRight className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => dismissReminder(reminder.id)}
            className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-[14px] font-semibold text-secondary-foreground active:scale-[0.98]"
          >
            <Check className="size-4" strokeWidth={2.5} /> Listo
          </button>
        </div>
      )}

      {/* SEGUIR PRESUPUESTO */}
      {reminder.action === 'seguir-presupuesto' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => callPhone(job?.telefono)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground active:scale-[0.98]"
          >
            <Phone className="size-4" strokeWidth={2.5} /> Llamar a {job?.cliente}
          </button>
          <button
            type="button"
            onClick={() => dismissReminder(reminder.id)}
            className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-[14px] font-semibold text-secondary-foreground active:scale-[0.98]"
          >
            <Check className="size-4" strokeWidth={2.5} /> Listo
          </button>
        </div>
      )}
    </div>
  )
}
