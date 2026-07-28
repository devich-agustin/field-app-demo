'use client'

import type { ReactNode } from 'react'

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
      />
      <div className="relative z-10 rounded-t-3xl bg-card px-5 pb-8 pt-3 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        {title && (
          <h3 className="mb-3 px-1 text-lg font-bold text-foreground">{title}</h3>
        )}
        {children}
      </div>
    </div>
  )
}
