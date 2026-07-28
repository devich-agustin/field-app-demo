'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '@/lib/store'
import { JobRow } from '../job-row'

export function TrabajosScreen() {
  const { jobs, profile } = useStore()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return jobs
    return jobs.filter(
      (j) =>
        j.cliente.toLowerCase().includes(t) ||
        (j.direccion ?? '').toLowerCase().includes(t) ||
        j.notas.some((n) => n.text.toLowerCase().includes(t)),
    )
  }, [jobs, q])

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="flex items-center justify-between px-5 pb-1 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Trabajos
        </h1>
        <div className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {profile.nombre.slice(0, 1)}
        </div>
      </header>

      <div className="sticky top-0 z-10 bg-background/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4">
          <Search className="size-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, dirección o nota"
            className="w-full bg-transparent py-3 text-[15px] outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-8">
        {filtered.length > 0 ? (
          filtered.map((j) => <JobRow key={j.id} job={j} />)
        ) : (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No encontramos trabajos con “{q}”.
          </p>
        )}
      </div>
    </div>
  )
}
