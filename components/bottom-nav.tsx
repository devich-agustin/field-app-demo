'use client'

import { Home, Plus, ClipboardList } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { view, go } = useStore()
  const active = view.name

  return (
    <nav className="relative z-20 flex items-end justify-around border-t border-border/60 bg-card/95 px-2 pb-6 pt-2 backdrop-blur">
      <NavItem
        icon={<Home className="size-[23px]" strokeWidth={2.1} />}
        label="Hoy"
        active={active === 'hoy'}
        onClick={() => go({ name: 'hoy' })}
      />

      <button
        type="button"
        aria-label="Crear trabajo"
        onClick={() => go({ name: 'crear' })}
        className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] transition active:scale-90"
      >
        <Plus className="size-7" strokeWidth={2.4} />
      </button>

      <NavItem
        icon={<ClipboardList className="size-[23px]" strokeWidth={2.1} />}
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
        'flex w-20 flex-col items-center gap-1 py-1 text-[11px] font-semibold transition-colors duration-200',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <span className={cn('transition-transform duration-200', active && 'scale-105')}>
        {icon}
      </span>
      {label}
    </button>
  )
}
