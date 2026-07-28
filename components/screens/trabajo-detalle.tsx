'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Phone,
  MapPin,
  Camera,
  FileText,
  Wallet,
  Bell,
  History,
  Send,
  Check,
} from 'lucide-react'
import Image from 'next/image'
import { useStore, STATUS_LABEL, formatMoney } from '@/lib/store'
import type { JobStatus } from '@/lib/types'
import { openWhatsApp, callPhone, openMap } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../screen-header'
import { StatusChip } from '../status-chip'
import { BottomSheet } from '../bottom-sheet'

const SAMPLE_PHOTOS = ['/photos/trabajo-1.png', '/photos/trabajo-2.png']

export function TrabajoDetalleScreen({ jobId }: { jobId: string }) {
  const store = useStore()
  const job = store.getJob(jobId)
  const [noteText, setNoteText] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [esperandoOpen, setEsperandoOpen] = useState(false)
  const [cobroOpen, setCobroOpen] = useState(false)
  const [monto, setMonto] = useState('')

  if (!job) return null

  const waMsg = `Hola ${job.cliente}, te escribo por el trabajo.`

  function pickStatus(s: JobStatus) {
    if (s === 'esperando') {
      setStatusOpen(false)
      setEsperandoOpen(true)
      return
    }
    if (s === 'cobrado') {
      setStatusOpen(false)
      setCobroOpen(true)
      return
    }
    store.setStatus(jobId, s)
    setStatusOpen(false)
  }

  function confirmarEsperando(when: string) {
    store.markEsperando(jobId, when)
    setEsperandoOpen(false)
  }

  function confirmarCobro() {
    const n = Number(monto.replace(/[^0-9]/g, '')) || job?.quote?.total || 0
    store.markCobrado(jobId, n)
    setCobroOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Encabezado */}
        <div className="px-5 pt-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-balance">
            {job.cliente}
          </h1>
          <div className="mt-2 flex flex-col gap-1">
            {job.direccion && (
              <button
                type="button"
                onClick={() => openMap(job.direccion)}
                className="flex items-center gap-2 text-left text-[15px] font-medium text-primary"
              >
                <MapPin className="size-4 shrink-0" /> {job.direccion}
              </button>
            )}
            {job.telefono && (
              <button
                type="button"
                onClick={() => callPhone(job.telefono)}
                className="flex items-center gap-2 text-left text-[15px] font-medium text-primary"
              >
                <Phone className="size-4 shrink-0" /> {job.telefono}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStatusOpen(true)}
            className="mt-3"
          >
            <StatusChip status={job.status} size="md" />
          </button>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-5 grid grid-cols-4 gap-2 px-5">
          <QuickAction
            icon={<MessageCircle className="size-6" />}
            label="WhatsApp"
            highlight
            onClick={() => openWhatsApp(job.telefono, waMsg)}
          />
          <QuickAction
            icon={<Phone className="size-6" />}
            label="Llamar"
            onClick={() => callPhone(job.telefono)}
          />
          <QuickAction
            icon={<MapPin className="size-6" />}
            label="Mapa"
            onClick={() => openMap(job.direccion)}
          />
          <QuickAction
            icon={<Camera className="size-6" />}
            label="Foto"
            onClick={() =>
              store.addPhoto(jobId, SAMPLE_PHOTOS[job.fotos.length % SAMPLE_PHOTOS.length])
            }
          />
        </div>

        {/* Nota */}
        <Section icon={<FileText className="size-5" />} title="Nota">
          <div className="flex flex-col gap-2">
            {job.notas.map((n) => (
              <div key={n.id} className="rounded-2xl bg-secondary px-4 py-3">
                <p className="text-[15px] leading-relaxed text-foreground text-pretty">
                  {n.text}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{n.at}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-3 focus-within:border-primary">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.nativeEvent.isComposing &&
                    e.keyCode !== 229 &&
                    noteText.trim()
                  ) {
                    store.addNote(jobId, noteText.trim())
                    setNoteText('')
                  }
                }}
                placeholder="Escribir una nota…"
                className="w-full bg-transparent py-3 text-[15px] outline-none"
              />
              <button
                type="button"
                aria-label="Agregar nota"
                disabled={!noteText.trim()}
                onClick={() => {
                  store.addNote(jobId, noteText.trim())
                  setNoteText('')
                }}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </Section>

        {/* Fotos */}
        <Section icon={<Camera className="size-5" />} title="Fotos">
          <div className="flex flex-wrap gap-2">
            {job.fotos.map((src, i) => (
              <div
                key={i}
                className="relative size-24 overflow-hidden rounded-2xl border border-border"
              >
                <Image
                  src={src || '/placeholder.svg'}
                  alt={`Foto del trabajo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                store.addPhoto(jobId, SAMPLE_PHOTOS[job.fotos.length % SAMPLE_PHOTOS.length])
              }
              className="flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-muted-foreground active:bg-muted"
            >
              <Camera className="size-6" />
              <span className="text-xs font-semibold">+ Foto</span>
            </button>
          </div>
        </Section>

        {/* Presupuesto */}
        <Section icon={<FileText className="size-5" />} title="Presupuesto">
          {job.quote ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-foreground">
                  {formatMoney(job.quote.total)}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    job.quote.status === 'enviado'
                      ? 'bg-status-proceso text-status-proceso-foreground'
                      : job.quote.status === 'aprobado'
                        ? 'bg-status-terminado text-status-terminado-foreground'
                        : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {job.quote.status === 'enviado'
                    ? 'Enviado'
                    : job.quote.status === 'aprobado'
                      ? 'Aprobado'
                      : 'Borrador'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => store.go({ name: 'presupuesto', jobId })}
                className="mt-3 w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground active:scale-[0.99]"
              >
                Ver / reenviar por WhatsApp
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => store.go({ name: 'presupuesto', jobId })}
              className="w-full rounded-2xl border border-dashed border-border py-4 text-base font-semibold text-primary active:bg-muted"
            >
              Crear presupuesto
            </button>
          )}
        </Section>

        {/* Cobro */}
        <Section icon={<Wallet className="size-5" />} title="Cobro">
          <button
            type="button"
            onClick={() => (job.cobrado ? undefined : setCobroOpen(true))}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
          >
            <span
              className={cn(
                'text-base font-bold',
                job.cobrado ? 'text-status-cobrado' : 'text-foreground',
              )}
            >
              {job.cobrado ? 'Cobrado' : 'Pendiente'}
            </span>
            {job.cobrado ? (
              <span className="flex items-center gap-2 text-base font-bold text-status-cobrado">
                {job.montoCobrado ? formatMoney(job.montoCobrado) : ''}
                <Check className="size-5" />
              </span>
            ) : (
              <span className="text-sm font-semibold text-primary">
                Marcar cobrado
              </span>
            )}
          </button>
        </Section>

        {/* Recordatorio activo */}
        {job.status === 'esperando' && job.reminderText && (
          <Section icon={<Bell className="size-5" />} title="Recordatorio">
            <div className="rounded-2xl border border-border bg-status-esperando/40 p-4">
              <p className="text-[15px] font-semibold text-foreground text-pretty">
                {job.reminderWhen}: {job.reminderText}
              </p>
              <button
                type="button"
                onClick={() => store.setStatus(jobId, 'proceso')}
                className="mt-2 text-sm font-semibold text-primary"
              >
                Cancelar recordatorio
              </button>
            </div>
          </Section>
        )}

        {/* Historial */}
        {job.historial && (
          <Section icon={<History className="size-5" />} title="Historial del cliente">
            <p className="rounded-2xl bg-secondary px-4 py-3 text-[15px] text-secondary-foreground text-pretty">
              {job.historial}
            </p>
          </Section>
        )}
      </div>

      {/* Botón primario contextual */}
      <PrimaryAction
        job={job}
        onFinish={() => store.setStatus(jobId, 'terminado')}
        onStart={() => store.setStatus(jobId, 'proceso')}
        onCobrar={() => setCobroOpen(true)}
      />

      {/* Sheet: seleccionar estado */}
      <BottomSheet
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Cambiar estado"
      >
        <div className="flex flex-col gap-2">
          {(['agendado', 'proceso', 'esperando', 'terminado', 'cobrado'] as JobStatus[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickStatus(s)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-4 text-left',
                  job.status === s
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card',
                )}
              >
                <span className="flex items-center gap-3">
                  <StatusChip status={s} />
                  {s === 'esperando' && (
                    <span className="text-sm text-muted-foreground">
                      crea un recordatorio
                    </span>
                  )}
                </span>
                {job.status === s && <Check className="size-5 text-primary" />}
              </button>
            ),
          )}
        </div>
      </BottomSheet>

      {/* Sheet: esperando ¿cuándo? */}
      <BottomSheet
        open={esperandoOpen}
        onClose={() => setEsperandoOpen(false)}
        title="¿Cuándo te lo recuerdo?"
      >
        <p className="mb-3 px-1 text-sm text-muted-foreground text-pretty">
          Marcamos el trabajo como <b>Esperando</b> y te avisamos solos.
        </p>
        <div className="flex flex-col gap-2">
          {['Mañana', 'En 2 días', 'La semana que viene'].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => confirmarEsperando(w)}
              className="rounded-2xl border border-border bg-card px-4 py-4 text-left text-base font-semibold text-foreground active:bg-muted"
            >
              {w}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sheet: cobro */}
      <BottomSheet
        open={cobroOpen}
        onClose={() => setCobroOpen(false)}
        title="Registrar cobro"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4 focus-within:border-primary">
          <span className="text-xl font-bold text-muted-foreground">$</span>
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="numeric"
            placeholder={job.quote ? String(job.quote.total) : 'Monto'}
            autoFocus
            className="w-full bg-transparent py-4 text-xl font-bold outline-none"
          />
        </div>
        <button
          type="button"
          onClick={confirmarCobro}
          className="mt-4 h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground active:scale-[0.99]"
        >
          Marcar cobrado
        </button>
      </BottomSheet>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-semibold transition active:scale-95',
        highlight
          ? 'bg-whatsapp text-whatsapp-foreground'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 px-5">
      <div className="mb-2 flex items-center gap-2 px-1 text-muted-foreground">
        {icon}
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function PrimaryAction({
  job,
  onFinish,
  onStart,
  onCobrar,
}: {
  job: import('@/lib/types').Job
  onFinish: () => void
  onStart: () => void
  onCobrar: () => void
}) {
  let label: string | null = null
  let action: () => void = () => {}

  if (job.status === 'terminado' && !job.cobrado) {
    label = 'Marcar cobrado'
    action = onCobrar
  } else if (job.status === 'proceso') {
    label = 'Terminar trabajo'
    action = onFinish
  } else if (job.status === 'agendado') {
    label = 'Empezar trabajo'
    action = onStart
  } else if (job.status === 'esperando') {
    label = null
  }

  if (!label) return null

  return (
    <div className="border-t border-border bg-card px-5 pb-8 pt-4">
      <button
        type="button"
        onClick={action}
        className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition active:scale-[0.99]"
      >
        {label}
      </button>
    </div>
  )
}
