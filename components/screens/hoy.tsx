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
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-300">
      <header className="flex items-center justify-between px-5 pb-1 pt-7">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-foreground">
          {todayLabel()}
        </h1>
        <div className="flex size-10 items-center justify-center rounded-full bg-card text-[15px] font-bold text-foreground shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          {profile.nombre.slice(0, 1)}
        </div>
      </header>

      {/* TRABAJOS DE HOY — la prioridad al abrir la app */}
      <section className="mt-6 px-5">
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-wider text-foreground/70">
          Trabajos de hoy
        </h2>
        {hoy.length > 0 ? (
          <div className="card-soft overflow-hidden">
            {hoy.map((j, i) => (
              <JobRow key={j.id} job={j} divider={i > 0} />
            ))}
          </div>
        ) : (
          <div className="card-soft flex flex-col items-center gap-3 px-6 py-11 text-center">
            <p className="text-[17px] font-semibold text-foreground text-balance">
              Hoy no tenés trabajos.
            </p>
            <p className="max-w-[220px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Tocá el botón de abajo para agregar uno.
            </p>
            <button
              type="button"
              onClick={() => go({ name: 'crear' })}
              className="mt-1 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition active:scale-95"
            >
              <Plus className="size-5" /> Nuevo trabajo
            </button>
          </div>
        )}
      </section>

      {/* NO TE OLVIDES — secundario y liviano, no compite con el día */}
      {reminders.length > 0 && (
        <section className="mt-8 px-5">
          <div className="mb-2.5 flex items-center gap-2 px-1">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              No te olvides
            </h2>
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-bold text-muted-foreground">
              {reminders.length}
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
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-semibold text-muted-foreground transition active:bg-secondary"
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

      <div className="h-10" aria-hidden />
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
        'rounded-2xl bg-card p-3.5 ring-1 ring-black/[0.05]',
        reminder.priority && 'ring-status-terminado-foreground/20',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            meta.badge,
          )}
        >
          <Icon className="size-[17px]" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {meta.eyebrow}
          </p>
          <p className="mt-0.5 text-[14px] font-semibold leading-snug text-foreground text-pretty">
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
          <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="input-soft flex flex-1 items-center gap-1.5 px-3 py-2.5">
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
              className="flex items-center justify-center gap-1.5 rounded-xl bg-status-cobrado px-4 py-2 text-[13px] font-semibold text-status-cobrado-foreground shadow-[var(--shadow-soft)] transition active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
            >
              <Check className="size-4" strokeWidth={2.5} /> Confirmar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCobro(false)}
              aria-label="Cancelar"
              className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition active:scale-[0.97]"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setConfirmingCobro(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-status-cobrado/12 px-4 py-2 text-[13px] font-semibold text-status-cobrado transition active:scale-[0.98]"
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary transition active:scale-[0.98]"
          >
            Abrir trabajo <ArrowUpRight className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => dismissReminder(reminder.id)}
            className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-[13px] font-semibold text-secondary-foreground transition active:scale-[0.98]"
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary transition active:scale-[0.98]"
          >
            <Phone className="size-4" strokeWidth={2.5} /> Llamar a {job?.cliente}
          </button>
          <button
            type="button"
            onClick={() => dismissReminder(reminder.id)}
            className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-[13px] font-semibold text-secondary-foreground transition active:scale-[0.98]"
          >
            <Check className="size-4" strokeWidth={2.5} /> Listo
          </button>
        </div>
      )}
    </div>
  )
}
