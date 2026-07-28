'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const OFICIOS = ['Plomero', 'Gasista', 'Electricista', 'Técnico', 'Jardinero', 'Otro']

export function OnboardingScreen() {
  const { profile, setProfile, go } = useStore()
  const [nombre, setNombre] = useState(profile.nombre)
  const [oficio, setOficio] = useState(profile.oficio)

  function empezar() {
    setProfile({ ...profile, nombre: nombre.trim() || 'Yo', oficio })
    go({ name: 'hoy' })
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-10 pt-16">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Bell className="size-8" strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-balance">
            La app se acuerda por vos
          </h1>
          <p className="mt-2 max-w-[280px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Tus trabajos, tus cobros y tus recordatorios en un solo lugar. Simple
            como un chat.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block px-1 text-sm font-bold text-foreground">
              ¿Cómo te llamás?
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-[17px] outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block px-1 text-sm font-bold text-foreground">
              ¿A qué te dedicás?
            </label>
            <div className="flex flex-wrap gap-2">
              {OFICIOS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOficio(o)}
                  className={cn(
                    'rounded-full border px-4 py-2.5 text-sm font-semibold transition',
                    oficio === o
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-card text-foreground',
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={empezar}
        className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition active:scale-[0.99]"
      >
        Empezar
      </button>
    </div>
  )
}
