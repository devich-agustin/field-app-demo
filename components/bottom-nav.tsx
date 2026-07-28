'use client'

import { Home, Plus, ClipboardList } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { view, go } = useStore()
  const active = view.name

  return (
    <nav className="relative z-20 flex items-end justify-around border-t border-border bg-card px-2 pb-6 pt-2">
      <NavItem
        icon={<Home className="size-6" strokeWidth={2.2} />}
        label="Hoy"
        active={active === 'hoy'}
        onClick={() => go({ name: 'hoy' })}
      />

      <button
        type="button"
        aria-label="Crear trabajo"
        onClick={() => go({ name: 'crear' })}
        className="-mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95"
      >
        <Plus className="size-8" strokeWidth={2.5} />
      </button>

      <NavItem
        icon={<ClipboardList className="size-6" strokeWidth={2.2} />}
        label="Trabajos"
        active={active === 'trabajos'}
        onClick={() => go({ name: 'trabajos' })}
      />
    </nav>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-20 flex-col items-center gap-1 py-1 text-xs font-semibold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
