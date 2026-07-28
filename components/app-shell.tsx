'use client'

import { useStore } from '@/lib/store'
import { PhoneFrame } from './phone-frame'
import { BottomNav } from './bottom-nav'
import { OnboardingScreen } from './screens/onboarding'
import { HoyScreen } from './screens/hoy'
import { TrabajosScreen } from './screens/trabajos'
import { CrearTrabajoScreen } from './screens/crear-trabajo'
import { TrabajoDetalleScreen } from './screens/trabajo-detalle'
import { PresupuestoScreen } from './screens/presupuesto'

export function AppShell() {
  const { view } = useStore()

  const showNav = view.name === 'hoy' || view.name === 'trabajos'

  return (
    <PhoneFrame>
      <div className="flex min-h-0 flex-1 flex-col">
        {view.name === 'onboarding' && <OnboardingScreen />}
        {view.name === 'hoy' && <HoyScreen />}
        {view.name === 'trabajos' && <TrabajosScreen />}
        {view.name === 'crear' && <CrearTrabajoScreen />}
        {view.name === 'trabajo' && <TrabajoDetalleScreen jobId={view.jobId} />}
        {view.name === 'presupuesto' && <PresupuestoScreen jobId={view.jobId} />}
      </div>
      {showNav && <BottomNav />}
    </PhoneFrame>
  )
}
