'use client'

import { ChevronLeft } from 'lucide-react'
import { useStore } from '@/lib/store'

export function ScreenHeader({
  title,
  right,
}: {
  title?: string
  right?: React.ReactNode
}) {
  const { back } = useStore()
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/90 px-3 py-3 backdrop-blur">
      <button
        type="button"
        onClick={back}
        aria-label="Volver"
        className="flex size-10 items-center justify-center rounded-full text-foreground active:bg-muted"
      >
        <ChevronLeft className="size-6" />
      </button>
      {title && (
        <h1 className="flex-1 truncate text-lg font-bold text-foreground">
          {title}
        </h1>
      )}
      {right && <div className="ml-auto pr-1">{right}</div>}
    </header>
  )
}
