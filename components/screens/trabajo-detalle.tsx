'use client'

import { useState } from 'react'
import {
  Phone,
  MapPin,
  Camera,
  FileText,
  Bell,
  Send,
  Check,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import Image from 'next/image'
import { useStore, formatMoney } from '@/lib/store'
import type { Job, JobStatus } from '@/lib/types'
import { openWhatsApp, callPhone, openMap } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../screen-header'
import { StatusChip } from '../status-chip'
import { BottomSheet } from '../bottom-sheet'

const SAMPLE_PHOTOS = ['/photos/trabajo-1.png', '/photos/trabajo-2.png']

// WhatsApp brand mark (para que el ícono se sienta de la familia)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.96 1.36-.5.04-.99.22-3.35-.7-2.83-1.11-4.62-4-4.76-4.19-.14-.19-1.14-1.51-1.14-2.88s.72-2.05 .98-2.33c.24-.26.53-.33.7-.33.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.8 2 .87 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.72 1.18 1.55 1.91 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.18-.28.36-.23.61-.14.24.09 1.55.73 1.82.86.27.14.44.21.51.33.07.12.07.69-.17 1.36Z" />
    </svg>
  )
}

export function TrabajoDetalleScreen({ jobId }: { jobId: string }) {
  const store = useStore()
  const job = store.getJob(jobId)
  const [noteText, setNoteText] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [esperandoOpen, setEsperandoOpen] = useState(false)
  const [cobroOpen, setCobroOpen] = useState(false)
  const [monto, setMonto] = useState('')

  if (!job) return null

  const titulo = job.titulo || job.cliente
  const tieneTitulo = Boolean(job.titulo) && job.titulo !== job.cliente
  const waMsg = `Hola ${job.cliente}, te escribo por el trabajo${
    job.titulo ? ` (${job.titulo.toLowerCase()})` : ''
  }.`

  function openCobro() {
    setMonto(job?.quote?.total ? String(job.quote.total) : '')
    setCobroOpen(true)
  }

  function pickStatus(s: JobStatus) {
    if (s === 'esperando') {
      setStatusOpen(false)
      setEsperandoOpen(true)
      return
    }
    if (s === 'cobrado') {
      setStatusOpen(false)
      openCobro()
      return
    }
    store.setStatus(jobId, s)
    setStatusOpen(false)
  }

  function confirmarEsperando(when: string) {
    store.markEsperando(jobId, when)
    setEsperandoOpen(false)
  }

  const montoNum = Number(monto.replace(/[^0-9]/g, '')) || 0
  function confirmarCobro() {
    if (montoNum <= 0) return
    store.markCobrado(jobId, montoNum)
    setCobroOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        right={
          <button
            type="button"
            onClick={() => setStatusOpen(true)}
            aria-label="Cambiar estado"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition active:bg-secondary"
          >
            <MoreHorizontal className="size-6" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-6 animate-in fade-in duration-300">
        {/* ── Encabezado: la tarea manda ── */}
        <div className="px-5 pt-1">
          <button
            type="button"
            onClick={() => setStatusOpen(true)}
            className="transition active:scale-95"
          >
            <StatusChip status={job.status} size="md" />
          </button>

          <h1 className="mt-3 text-[27px] font-extrabold leading-[1.14] tracking-tight text-foreground text-balance">
            {titulo}
          </h1>

          {tieneTitulo && (
            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-secondary-foreground">
                {job.cliente.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-[15px] font-semibold text-foreground">
                {job.cliente}
              </span>
            </div>
          )}
        </div>

        {/* ── Acciones principales (protagonistas) ── */}
        <div className="mt-6 flex items-start justify-around px-4">
          <CircleAction
            icon={<Phone className="size-[22px]" strokeWidth={2.2} />}
            label="Llamar"
            disabled={!job.telefono}
            onClick={() => callPhone(job.telefono)}
          />
          <CircleAction
            icon={<WhatsAppIcon className="size-[24px]" />}
            label="WhatsApp"
            variant="whatsapp"
            disabled={!job.telefono}
            onClick={() => openWhatsApp(job.telefono, waMsg)}
          />
          <CircleAction
            icon={<MapPin className="size-[22px]" strokeWidth={2.2} />}
            label="Ubicación"
            disabled={!job.direccion}
            onClick={() => openMap(job.direccion)}
          />
          <CircleAction
            icon={<Camera className="size-[22px]" strokeWidth={2.2} />}
            label="Foto"
            onClick={() =>
              store.addPhoto(jobId, SAMPLE_PHOTOS[job.fotos.length % SAMPLE_PHOTOS.length])
            }
          />
        </div>

        {/* ── Heads-up: cuándo hay que volver ── */}
        {job.status === 'esperando' && job.reminderText && (
          <div className="mt-6 px-5">
            <div className="card-soft flex items-start gap-3 bg-status-esperando/40 p-4 ring-1 ring-status-esperando-foreground/12">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-esperando text-status-esperando-foreground">
                <Bell className="size-[18px]" strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-status-esperando-foreground">
                  Te aviso {(job.reminderWhen ?? 'pronto').toLowerCase()}
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-foreground text-pretty">
                  {job.reminderText}
                </p>
                <button
                  type="button"
                  onClick={() => store.setStatus(jobId, 'proceso')}
                  className="mt-2 text-[13px] font-semibold text-primary active:opacity-60"
                >
                  Ya volví, retomar trabajo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Detalles ── */}
        {(job.direccion || job.telefono || job.cuando) && (
          <Section title="Detalles">
            <div className="card-soft divide-y divide-border/60">
              {job.direccion && (
                <DetailRow
                  icon={<MapPin className="size-[18px]" strokeWidth={2.1} />}
                  text={job.direccion}
                  onClick={() => openMap(job.direccion)}
                />
              )}
              {job.telefono && (
                <DetailRow
                  icon={<Phone className="size-[18px]" strokeWidth={2.1} />}
                  text={job.telefono}
                  onClick={() => callPhone(job.telefono)}
                />
              )}
              <DetailRow
                icon={<CalendarDays className="size-[18px]" strokeWidth={2.1} />}
                text={job.cuando}
                muted
              />
            </div>
          </Section>
        )}

        {/* ── Nota ── */}
        <Section title="Nota">
          <div className="flex flex-col gap-2">
            {job.notas.length === 0 && (
              <p className="px-1 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                Anotá qué hiciste o qué falta. Cuaderno se acuerda por vos.
              </p>
            )}
            {job.notas.map((n) => (
              <div key={n.id} className="rounded-2xl bg-secondary px-4 py-3">
                <p className="text-[15px] leading-relaxed text-foreground text-pretty">
                  {n.text}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{n.at}</p>
              </div>
            ))}
            <div className="input-soft flex items-center gap-2 px-3">
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
                className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Agregar nota"
                disabled={!noteText.trim()}
                onClick={() => {
                  store.addNote(jobId, noteText.trim())
                  setNoteText('')
                }}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-90 disabled:opacity-30"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </Section>

        {/* ── Fotos ── */}
        <Section title="Fotos">
          <div className="flex flex-wrap gap-2.5">
            {job.fotos.map((src, i) => (
              <div
                key={i}
                className="relative size-24 overflow-hidden rounded-2xl shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] animate-in fade-in zoom-in-95 duration-200"
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
              className="flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-muted-foreground transition active:scale-95 active:bg-secondary"
            >
              <Camera className="size-6" />
              <span className="text-xs font-semibold">Sacar foto</span>
            </button>
          </div>
        </Section>

        {/* ── Presupuesto ── */}
        <Section title="Presupuesto">
          {job.quote ? (
            <div className="card-soft p-4">
              <div className="flex items-center justify-between">
                <span className="text-[26px] font-extrabold tracking-tight text-foreground">
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
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-3 text-sm font-semibold text-primary transition active:scale-[0.99]"
              >
                <WhatsAppIcon className="size-4" /> Reenviar por WhatsApp
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => store.go({ name: 'presupuesto', jobId })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-base font-semibold text-primary transition active:scale-[0.99] active:bg-secondary"
            >
              <FileText className="size-5" /> Crear presupuesto
            </button>
          )}
        </Section>

        {/* ── Cobro ── */}
        <Section title="Cobro">
          {job.cobrado ? (
            <div className="card-soft flex items-center justify-between bg-status-cobrado/[0.08] px-4 py-4 ring-1 ring-status-cobrado/20 animate-in fade-in duration-300">
              <span className="flex items-center gap-2 text-base font-bold text-status-cobrado">
                <CheckCircle2 className="size-5" /> Cobrado
              </span>
              {typeof job.montoCobrado === 'number' && (
                <span className="text-lg font-extrabold tracking-tight text-status-cobrado">
                  {formatMoney(job.montoCobrado)}
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openCobro}
              className="card-soft flex w-full items-center justify-between px-4 py-4 transition active:scale-[0.99]"
            >
              <span className="text-base font-bold text-foreground">Pendiente</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                Registrar cobro <ArrowRight className="size-4" />
              </span>
            </button>
          )}
        </Section>

        {/* ── Historial del cliente ── */}
        {job.historial && (
          <Section title="Historial del cliente">
            <p className="rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-relaxed text-secondary-foreground text-pretty">
              {job.historial}
            </p>
          </Section>
        )}
      </div>

      {/* ── Botón primario contextual ── */}
      <PrimaryAction
        job={job}
        onFinish={() => store.setStatus(jobId, 'terminado')}
        onStart={() => store.setStatus(jobId, 'proceso')}
        onResume={() => store.setStatus(jobId, 'proceso')}
        onCobrar={openCobro}
      />

      {/* Sheet: seleccionar estado */}
      <BottomSheet
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="¿En qué estado está?"
      >
        <div className="flex flex-col gap-2">
          {(['agendado', 'proceso', 'esperando', 'terminado', 'cobrado'] as JobStatus[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickStatus(s)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99]',
                  job.status === s
                    ? 'border-primary bg-accent'
                    : 'border-border/70 bg-card',
                )}
              >
                <span className="flex items-center gap-3">
                  <StatusChip status={s} />
                  {s === 'esperando' && (
                    <span className="text-sm text-muted-foreground">
                      te lo recuerdo solo
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
          Marcamos el trabajo como <b>Esperando</b> y te avisamos solos. Vos no tenés
          que acordarte de nada.
        </p>
        <div className="flex flex-col gap-2">
          {['Mañana', 'En 2 días', 'La semana que viene'].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => confirmarEsperando(w)}
              className="rounded-2xl border border-border/70 bg-card px-4 py-4 text-left text-base font-semibold text-foreground transition active:scale-[0.99] active:bg-secondary"
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
        <div className="input-soft flex items-center gap-2 px-4">
          <span className="text-2xl font-bold text-muted-foreground">$</span>
          <input
            value={monto ? Number(monto.replace(/[^0-9]/g, '')).toLocaleString('es-AR') : ''}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            autoFocus
            className="w-full bg-transparent py-4 text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        {job.quote?.total && montoNum !== job.quote.total && (
          <button
            type="button"
            onClick={() => setMonto(String(job.quote!.total))}
            className="mt-2 px-1 text-[13px] font-semibold text-primary active:opacity-60"
          >
            Usar el del presupuesto ({formatMoney(job.quote.total)})
          </button>
        )}
        <button
          type="button"
          onClick={confirmarCobro}
          disabled={montoNum <= 0}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-status-cobrado text-lg font-bold text-status-cobrado-foreground shadow-[var(--shadow-soft)] transition active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
        >
          <Check className="size-5" strokeWidth={2.5} /> Cobrado
        </button>
      </BottomSheet>
    </div>
  )
}

function CircleAction({
  icon,
  label,
  onClick,
  variant,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'whatsapp'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 transition disabled:opacity-35"
    >
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full shadow-[var(--shadow-soft)] transition active:scale-90',
          variant === 'whatsapp'
            ? 'bg-whatsapp text-whatsapp-foreground'
            : 'bg-card text-primary ring-1 ring-black/[0.05]',
        )}
      >
        {icon}
      </span>
      <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
    </button>
  )
}

function DetailRow({
  icon,
  text,
  onClick,
  muted,
}: {
  icon: React.ReactNode
  text: string
  onClick?: () => void
  muted?: boolean
}) {
  const content = (
    <>
      <span className={cn('shrink-0', muted ? 'text-muted-foreground' : 'text-primary')}>
        {icon}
      </span>
      <span
        className={cn(
          'flex-1 truncate text-[15px] font-medium',
          muted ? 'text-foreground' : 'text-foreground',
        )}
      >
        {text}
      </span>
      {onClick && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-black/[0.02]"
      >
        {content}
      </button>
    )
  }
  return <div className="flex items-center gap-3 px-4 py-3.5">{content}</div>
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 px-5">
      <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function PrimaryAction({
  job,
  onFinish,
  onStart,
  onResume,
  onCobrar,
}: {
  job: Job
  onFinish: () => void
  onStart: () => void
  onResume: () => void
  onCobrar: () => void
}) {
  let label: string | null = null
  let action: () => void = () => {}

  if (job.status === 'terminado' && !job.cobrado) {
    label = 'Registrar cobro'
    action = onCobrar
  } else if (job.status === 'proceso') {
    label = 'Terminar trabajo'
    action = onFinish
  } else if (job.status === 'agendado') {
    label = 'Empezar trabajo'
    action = onStart
  } else if (job.status === 'esperando') {
    label = 'Ya volví, retomar'
    action = onResume
  }

  if (!label) return null

  return (
    <div className="border-t border-border/60 bg-card px-5 pb-8 pt-4">
      <button
        type="button"
        onClick={action}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-[var(--shadow-fab)] transition active:scale-[0.98]"
      >
        {label} <ArrowRight className="size-5" />
      </button>
    </div>
  )
}
