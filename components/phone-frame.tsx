'use client'

import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[oklch(0.93_0.006_260)] p-0 sm:p-6">
      <div className="relative flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-background shadow-none sm:h-[860px] sm:rounded-[2.6rem] sm:border-8 sm:border-[oklch(0.2_0.01_260)] sm:shadow-2xl">
        {children}
      </div>
    </div>
  )
}
