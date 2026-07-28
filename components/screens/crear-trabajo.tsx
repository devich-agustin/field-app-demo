'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../screen-header'

type Cuando = 'Hoy' | 'Mañana' | 'Fecha'

export function CrearTrabajoScreen() {
  const { createJob, go, back } = useStore()
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [nota, setNota] = useState('')
  const [cuando, setCuando] = useState<Cuando>('Hoy')
  const [fecha, setFecha] = useState('')

  const puedeGuardar = cliente.trim().length > 0

  function guardar() {
    if (!puedeGuardar) return
    const label = cuando === 'Fecha' ? (fecha || 'Fecha a definir') : cuando
    const id = createJob({
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      cuando: label,
      esHoy: cuando === 'Hoy',
      nota: nota.trim(),
    })
    // reemplazar la pantalla de creación por el detalle
    back()
    go({ name: 'trabajo', jobId: id })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Nuevo trabajo" />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <Field label="Cliente" hint="Lo único obligatorio">
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre o referencia (ej. Pérdida Belgrano)"
            autoFocus
            className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-[17px] outline-none focus:border-primary"
          />
        </Field>

        <Field label="Teléfono" hint="Sin esto no podés mandar WhatsApp después">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-4 focus-within:border-primary">
            <Phone className="size-5 text-muted-foreground" />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
              placeholder="Agregar teléfono"
              className="w-full bg-transparent py-3.5 text-[17px] outline-none"
            />
          </div>
        </Field>

        <Field label="Dirección">
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Agregar dirección"
            className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-[17px] outline-none focus:border-primary"
          />
        </Field>

        <Field label="¿Cuándo?">
          <div className="flex gap-2">
            {(['Hoy', 'Mañana', 'Fecha'] as Cuando[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCuando(c)}
                className={cn(
                  'flex-1 rounded-xl border py-3.5 text-base font-semibold transition',
                  cuando === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-card text-foreground',
                )}
              >
                {c === 'Fecha' ? 'Elegir fecha' : c}
              </button>
            ))}
          </div>
          {cuando === 'Fecha' && (
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-2 w-full rounded-xl border border-input bg-card px-4 py-3.5 text-[17px] outline-none focus:border-primary"
            />
          )}
        </Field>

        <Field label="Nota">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="¿Qué hay que hacer?"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3.5 text-[17px] outline-none focus:border-primary"
          />
        </Field>
      </div>

      <div className="border-t border-border bg-card px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={!puedeGuardar}
          onClick={guardar}
          className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition active:scale-[0.99] disabled:opacity-40"
        >
          Guardar
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
      <div className="mb-1.5 flex items-baseline justify-between px-1">
        <label className="text-sm font-bold text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
