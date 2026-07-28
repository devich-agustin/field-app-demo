'use client'

import { ChevronRight } from 'lucide-react'
import type { Job } from '@/lib/types'
import { useStore } from '@/lib/store'
import { StatusChip } from './status-chip'

export function JobRow({ job }: { job: Job }) {
  const { go } = useStore()
  return (
    <button
      type="button"
      onClick={() => go({ name: 'trabajo', jobId: job.id })}
      className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:bg-muted"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground">
        {job.cliente.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[17px] font-bold text-foreground">
            {job.cliente}
          </p>
        </div>
        {job.direccion ? (
          <p className="truncate text-sm text-muted-foreground">{job.direccion}</p>
        ) : (
          <p className="truncate text-sm text-muted-foreground">Sin dirección</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusChip status={job.status} />
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </button>
  )
}
