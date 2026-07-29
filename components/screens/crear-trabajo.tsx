'use client'

import { useState } from 'react'
import { Phone, ClipboardList, CalendarCheck, Sun, CalendarDays } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../screen-header'

type Cuando = 'Hoy' | 'Mañana' | 'Fecha'

const CUANDO_OPTS: { key: Cuando; label: string; icon: typeof Sun }[] = [
  { key: 'Hoy', label: 'Hoy', icon: CalendarCheck },
  { key: 'Mañana', label: 'Mañana', icon: Sun },
  { key: 'Fecha', label: 'Elegir', icon: CalendarDays },
]

export function CrearTrabajoScreen() {
  const { createJob, go, back } = useStore()
  const [tarea, setTarea] = useState('')
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [cuando, setCuando] = useState<Cuando>('Hoy')
  const [fecha, setFecha] = useState('')

  // Alcanza con la tarea O el cliente: uno anota "cambiar bisagra" antes de
  // saber el nombre. Si no hay cliente, la tarea oficia de referencia.
  const puedeGuardar = tarea.trim().length > 0 || cliente.trim().length > 0

  function guardar() {
    if (!puedeGuardar) return
    const label = cuando === 'Fecha' ? fecha || 'Fecha a definir' : cuando
    const clienteFinal = cliente.trim() || tarea.trim()
    const id = createJob({
      cliente: clienteFinal,
      titulo: tarea.trim() || undefined,
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      cuando: label,
      esHoy: cuando === 'Hoy',
    })
    back()
    go({ name: 'trabajo', jobId: id })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Nuevo trabajo" />

      <div className="flex-1 overflow-y-auto px-5 py-5 animate-in fade-in duration-300">
        {/* La tarea primero: es lo que uno recuerda del trabajo */}
        <Field label="¿Qué hay que hacer?">
          <div className="input-soft flex items-start gap-2.5 px-4">
            <ClipboardList className="mt-3.5 size-5 shrink-0 text-muted-foreground" />
            <textarea
              value={tarea}
              onChange={(e) => setTarea(e.target.value)}
              placeholder="Ej. Cambiar bisagra de cocina"
              rows={2}
              autoFocus
              className="w-full resize-none bg-transparent py-3.5 text-[17px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </Field>

        <Field label="Cliente" hint="Opcional">
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
            className="input-soft w-full px-4 py-3.5 text-[17px] outline-none placeholder:text-muted-foreground"
          />
        </Field>

        <Field label="Teléfono" hint="Para mandarle WhatsApp">
          <div className="input-soft flex items-center gap-2.5 px-4">
            <Phone className="size-5 text-muted-foreground" />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
              placeholder="Agregar teléfono"
              className="w-full bg-transparent py-3.5 text-[17px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </Field>

        <Field label="Dirección" hint="Opcional">
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Agregar dirección"
            className="input-soft w-full px-4 py-3.5 text-[17px] outline-none placeholder:text-muted-foreground"
          />
        </Field>

        <Field label="¿Cuándo?">
          <div className="flex gap-2">
            {CUANDO_OPTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCuando(key)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 text-[13px] font-semibold transition active:scale-[0.98]',
                  cuando === key
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-soft)]'
                    : 'bg-card text-foreground shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]',
                )}
              >
                <Icon className="size-5" strokeWidth={2.1} />
                {label}
              </button>
            ))}
          </div>
          {cuando === 'Fecha' && (
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input-soft mt-2 w-full px-4 py-3.5 text-[17px] outline-none animate-in fade-in slide-in-from-top-1 duration-200"
            />
          )}
        </Field>
      </div>

      <div className="border-t border-border/60 bg-card px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={!puedeGuardar}
          onClick={guardar}
          className="h-14 w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-[var(--shadow-fab)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          Guardar trabajo
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <label className="text-[13px] font-semibold text-muted-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
