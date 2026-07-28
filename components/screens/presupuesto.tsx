'use client'

import { useState } from 'react'
import { Plus, X, MessageCircle } from 'lucide-react'
import { useStore, formatMoney } from '@/lib/store'
import type { QuoteItem } from '@/lib/types'
import { openWhatsApp } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../screen-header'

const uid = () => Math.random().toString(36).slice(2, 8)

export function PresupuestoScreen({ jobId }: { jobId: string }) {
  const store = useStore()
  const job = store.getJob(jobId)
  const [modo, setModo] = useState<'total' | 'items'>(
    job?.quote && job.quote.items.length > 0 ? 'items' : 'total',
  )
  const [descripcion, setDescripcion] = useState(job?.quote?.descripcion ?? '')
  const [totalUnico, setTotalUnico] = useState(
    job?.quote && job.quote.items.length === 0 ? String(job.quote.total) : '',
  )
  const [items, setItems] = useState<QuoteItem[]>(
    job?.quote?.items.length ? job.quote.items : [{ id: uid(), descripcion: '', precio: 0 }],
  )

  if (!job) return null

  const total =
    modo === 'total'
      ? Number(totalUnico.replace(/[^0-9]/g, '')) || 0
      : items.reduce((s, it) => s + (it.precio || 0), 0)

  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function applySuggestion(id: string, desc: string) {
    const found = store.priceList.find(
      (p) => p.descripcion.toLowerCase() === desc.toLowerCase(),
    )
    updateItem(id, { descripcion: desc, precio: found ? found.precio : 0 })
  }

  function enviar() {
    const cleanItems =
      modo === 'items' ? items.filter((it) => it.descripcion.trim()) : []
    store.saveQuote(jobId, {
      total,
      descripcion: descripcion.trim() || undefined,
      items: cleanItems,
      status: 'borrador',
    })
    store.learnPrices(cleanItems)
    store.sendQuote(jobId)
    openWhatsApp(
      job?.telefono,
      `Hola ${job?.cliente}, te paso el presupuesto por el trabajo: ${formatMoney(
        total,
      )}. Cualquier cosa avisame.`,
    )
    store.back()
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Presupuesto" />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Selector de modo */}
        <div className="mb-5 flex gap-2 rounded-2xl bg-secondary p-1">
          {(['total', 'items'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-bold transition',
                modo === m
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {m === 'total' ? 'Monto único' : 'Por ítems'}
            </button>
          ))}
        </div>

        {modo === 'total' ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block px-1 text-sm font-bold text-foreground">
                Total
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-4 focus-within:border-primary">
                <span className="text-2xl font-bold text-muted-foreground">$</span>
                <input
                  value={totalUnico}
                  onChange={(e) => setTotalUnico(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full bg-transparent py-4 text-2xl font-bold outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block px-1 text-sm font-bold text-foreground">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Ej. Cambio de termotanque + mano de obra"
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-[15px] outline-none focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <input
                    value={it.descripcion}
                    onChange={(e) => updateItem(it.id, { descripcion: e.target.value })}
                    list="price-suggestions"
                    placeholder="Descripción"
                    className="min-w-0 flex-1 bg-transparent py-1 text-[15px] outline-none"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      aria-label="Quitar ítem"
                      onClick={() => setItems((its) => its.filter((x) => x.id !== it.id))}
                      className="text-muted-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 border-t border-border pt-2">
                  <span className="text-base font-bold text-muted-foreground">$</span>
                  <input
                    value={it.precio || ''}
                    onChange={(e) =>
                      updateItem(it.id, {
                        precio: Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                      })
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full bg-transparent py-1 text-base font-bold outline-none"
                  />
                </div>
                {/* sugerencias aprendidas */}
                {!it.descripcion &&
                  store.priceList.slice(0, 3).map((p) => (
                    <button
                      key={p.descripcion}
                      type="button"
                      onClick={() => applySuggestion(it.id, p.descripcion)}
                      className="mr-1.5 mt-2 inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {p.descripcion} · {formatMoney(p.precio)}
                    </button>
                  ))}
              </div>
            ))}
            <datalist id="price-suggestions">
              {store.priceList.map((p) => (
                <option key={p.descripcion} value={p.descripcion} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => setItems((its) => [...its, { id: uid(), descripcion: '', precio: 0 }])}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-primary active:bg-muted"
            >
              <Plus className="size-4" /> Agregar ítem
            </button>
          </div>
        )}

        {/* Preview branded */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {store.profile.nombre.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {store.profile.nombre} · {store.profile.oficio}
                </p>
                <p className="text-xs text-muted-foreground">
                  {store.profile.matricula}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">PDF</span>
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
            Para
          </p>
          <p className="text-[15px] font-semibold text-foreground">{job.cliente}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-extrabold text-foreground">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={total <= 0}
          onClick={enviar}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp text-lg font-bold text-whatsapp-foreground transition active:scale-[0.99] disabled:opacity-40"
        >
          <MessageCircle className="size-6" /> Enviar por WhatsApp
        </button>
      </div>
    </div>
  )
}
