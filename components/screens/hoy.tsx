'use client'

import {
  Check,
  Phone,
  Wallet,
  Plus,
  RotateCcw,
  FileClock,
  ArrowUpRight,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { callPhone } from '@/lib/actions'
import type { Reminder } from '@/lib/types'
import { cn } from '@/lib/utils'
import { JobRow } from '../job-row'

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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="flex items-end justify-between px-5 pb-1 pt-7">
        <div>
          <p className="text-[15px] font-semibold text-muted-foreground">
            Hola, {profile.nombre}
          </p>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight text-foreground">
            {todayLabel()}
          </h1>
        </div>
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground">
          {profile.nombre.slice(0, 1)}
        </div>
      </header>

      {/* No te olvides — el corazón de la app */}
      {reminders.length > 0 && (
        <section className="mt-5 px-5">
          <div className="mb-3 flex items-baseline justify-between px-0.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              No te olvides
            </h2>
            <span className="text-[13px] font-medium text-muted-foreground">
              {reminders.length} {reminders.length === 1 ? 'cosa' : 'cosas'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {reminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </div>
        </section>
      )}

      {/* Trabajos de hoy */}
      <section className="mt-7 px-5 pb-10">
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

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-sm',
        reminder.priority
          ? 'border-status-terminado-foreground/25 ring-1 ring-status-terminado-foreground/15'
          : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            meta.badge,
          )}
        >
          <Icon className="size-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {meta.eyebrow}
          </p>
          <p className="mt-0.5 text-[17px] font-semibold leading-snug text-foreground text-pretty">
            {reminder.text}
          </p>
          {reminder.subtitle && (
            <p className="mt-1 text-[14px] font-medium text-muted-foreground">
              {reminder.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        {reminder.action === 'volver' && (
          <button
            type="button"
            onClick={() => go({ name: 'trabajo', jobId: reminder.jobId })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground active:scale-[0.98]"
          >
            Abrir trabajo <ArrowUpRight className="size-4" strokeWidth={2.5} />
          </button>
        )}

        {reminder.action === 'cobrar' && (
          <button
            type="button"
            onClick={() => {
              markCobrado(reminder.jobId, reminder.amount ?? 0)
              dismissReminder(reminder.id)
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-status-cobrado px-4 py-2.5 text-[15px] font-semibold text-status-cobrado-foreground active:scale-[0.98]"
          >
            <Wallet className="size-4" strokeWidth={2.5} /> Registrar cobro
          </button>
        )}

        {reminder.action === 'seguir-presupuesto' && (
          <button
            type="button"
            onClick={() => callPhone(job?.telefono)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground active:scale-[0.98]"
          >
            <Phone className="size-4" strokeWidth={2.5} /> Llamar a {job?.cliente}
          </button>
        )}

        <button
          type="button"
          onClick={() => dismissReminder(reminder.id)}
          aria-label="Marcar como listo"
          className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-[15px] font-semibold text-secondary-foreground active:scale-[0.98]"
        >
          <Check className="size-4" strokeWidth={2.5} /> Listo
        </button>
      </div>
    </div>
  )
}
