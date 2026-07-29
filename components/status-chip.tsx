import type { JobStatus } from '@/lib/types'
import { STATUS_LABEL } from '@/lib/store'
import { cn } from '@/lib/utils'

const styles: Record<JobStatus, string> = {
  agendado: 'bg-status-agendado text-status-agendado-foreground',
  proceso: 'bg-status-proceso text-status-proceso-foreground',
  esperando: 'bg-status-esperando text-status-esperando-foreground',
  terminado: 'bg-status-terminado text-status-terminado-foreground',
  cobrado: 'bg-status-cobrado text-status-cobrado-foreground',
}

export function StatusChip({
  status,
  className,
  size = 'sm',
}: {
  status: JobStatus
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold leading-none tracking-[-0.006em]',
        size === 'sm' ? 'px-2.5 py-[5px] text-[11px]' : 'px-3 py-1.5 text-[13px]',
        styles[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
