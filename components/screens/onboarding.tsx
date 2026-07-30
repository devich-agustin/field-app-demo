'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useStore } from '@/lib/store'

export function OnboardingScreen() {
  const { profile, setProfile, go } = useStore()
  const [nombre, setNombre] = useState(profile.nombre)

  function empezar() {
    setProfile({ ...profile, nombre: nombre.trim() || 'Yo' })
    go({ name: 'hoy' })
  }

  return (
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-500">
      <div className="flex min-h-full flex-col px-7 pt-16 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
        <div className="flex flex-1 flex-col justify-center">
          {/* Bienvenida */}
          <div className="text-center">
            <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-tight text-foreground text-balance">
              La app se acuerda
              <br />
              por vos
            </h1>
            <p className="mx-auto mt-3.5 max-w-[270px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Todo tu trabajo en un solo lugar. Ella te avisa lo que estabas por
              olvidarte.
            </p>
          </div>

          {/* Mockup de la app: la tarjeta que se acuerda por vos */}
          <div className="pointer-events-none my-11 select-none">
            <div className="mx-auto w-full max-w-[300px] rotate-[-1.5deg] rounded-[1.4rem] bg-card p-4 shadow-[var(--shadow-pop)] ring-1 ring-black/[0.04]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-terminado text-status-terminado-foreground">
                  <Wallet className="size-[17px]" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cobro pendiente
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-snug text-foreground">
                    Terminaste lo de Pérez y todavía no registraste el cobro.
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-status-cobrado/[0.12] py-2 text-center text-[13px] font-semibold text-status-cobrado">
                Registrar cobro
              </div>
            </div>
          </div>

          {/* Único dato: el nombre (se usa para saludarte y firmar presupuestos) */}
          <div>
            <label className="mb-2 block px-1 text-center text-[14px] font-medium text-muted-foreground">
              ¿Cómo te llamás?
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              className="input-soft w-full px-4 py-3.5 text-center text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={empezar}
          className="mt-10 h-[54px] w-full shrink-0 rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-[var(--shadow-fab)] transition active:scale-[0.98]"
        >
          Empezar
        </button>
      </div>
    </div>
  )
}
