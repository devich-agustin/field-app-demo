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
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-500">
      <div className="flex min-h-full flex-col px-6 pt-12 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
        <div className="flex flex-1 flex-col">
          <div className="mb-9 flex flex-col items-center text-center">
            {/* Ícono con glow sutil: profundidad y personalidad */}
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-[28px] bg-primary/25 blur-2xl"
                aria-hidden
              />
              <div className="relative flex size-[68px] items-center justify-center rounded-[21px] bg-primary text-primary-foreground shadow-[var(--shadow-pop)]">
                <Bell className="size-8" strokeWidth={2.2} />
              </div>
            </div>
            <h1 className="text-[31px] font-extrabold leading-[1.08] tracking-tight text-foreground text-balance">
              La app se acuerda
              <br />
              por vos
            </h1>
            <p className="mt-3 max-w-[280px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Tus trabajos, tus cobros y tus recordatorios en un solo lugar. Simple
              como un chat.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block px-1 text-[13px] font-semibold text-muted-foreground">
                ¿Cómo te llamás?
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="input-soft w-full px-4 py-3 text-[16px] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block px-1 text-[13px] font-semibold text-muted-foreground">
                ¿A qué te dedicás?
              </label>
              <div className="flex flex-wrap gap-2">
                {OFICIOS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOficio(o)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95',
                      oficio === o
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground ring-1 ring-black/[0.06]',
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
          className="mt-14 h-14 w-full shrink-0 rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-[var(--shadow-fab)] transition active:scale-[0.98]"
        >
          Empezar
        </button>
      </div>
    </div>
  )
}
