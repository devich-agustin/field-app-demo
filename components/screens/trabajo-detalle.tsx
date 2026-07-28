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
  CheckCircle2,
  User,
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

export function TrabajoDetalleScreen({ jobId }: { jobId: string }) {
  const store = useStore()
  const job = store.getJob(jobId)
  const [noteText, setNoteText] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [esperandoOpen, setEsperandoOpen] = useState(false)
  const [cobroOpen, setCobroOpen] = useState(false)
  const [monto, setMonto] = useState('')

  if (!job) return null

  // El título (la tarea) es el protagonista; el cliente pasa a segundo plano.
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
          >
            <StatusChip status={job.status} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-6 animate-in fade-in duration-300">
        {/* ── Encabezado: la tarea manda, el cliente acompaña ── */}
        <div className="px-5 pt-2">
          <h1 className="text-[27px] font-extrabold leading-[1.15] tracking-tight text-foreground text-balance">
            {titulo}
          </h1>

          {tieneTitulo && (
            <div className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-muted-foreground">
              <User className="size-4 shrink-0" />
              {job.cliente}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            {job.direccion && (
              <button
                type="button"
                onClick={() => openMap(job.direccion)}
                className="flex items-center gap-2 text-left text-[15px] font-medium text-primary active:opacity-60"
              >
                <MapPin className="size-4 shrink-0" /> {job.direccion}
              </button>
            )}
            {job.telefono && (
              <button
                type="button"
                onClick={() => callPhone(job.telefono)}
                className="flex items-center gap-2 text-left text-[15px] font-medium text-primary active:opacity-60"
              >
                <Phone className="size-4 shrink-0" /> {job.telefono}
              </button>
            )}
          </div>
        </div>

        {/* ── Heads-up: cuándo hay que volver (lo más importante si espera) ── */}
        {job.status === 'esperando' && job.reminderText && (
          <div className="mt-5 px-5">
            <div className="flex items-start gap-3 rounded-2xl border border-status-esperando-foreground/20 bg-status-esperando/50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-esperando text-status-esperando-foreground">
                <Bell className="size-[18px]" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-status-esperando-foreground">
                  Te aviso {(job.reminderWhen ?? 'pronto').toLowerCase()}
                </p>
                <p className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground text-pretty">
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

        {/* ── Acciones rápidas ── */}
        <div className="mt-5 grid grid-cols-4 gap-2 px-5">
          <QuickAction
            icon={<MessageCircle className="size-[22px]" />}
            label="WhatsApp"
            highlight
            disabled={!job.telefono}
            onClick={() => openWhatsApp(job.telefono, waMsg)}
          />
          <QuickAction
            icon={<Phone className="size-[22px]" />}
            label="Llamar"
            disabled={!job.telefono}
            onClick={() => callPhone(job.telefono)}
          />
          <QuickAction
            icon={<MapPin className="size-[22px]" />}
            label="Mapa"
            disabled={!job.direccion}
            onClick={() => openMap(job.direccion)}
          />
          <QuickAction
            icon={<Camera className="size-[22px]" />}
            label="Foto"
            onClick={() =>
              store.addPhoto(jobId, SAMPLE_PHOTOS[job.fotos.length % SAMPLE_PHOTOS.length])
            }
          />
        </div>

        {/* ── Nota ── */}
        <Section icon={<FileText className="size-[18px]" />} title="Nota">
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
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-3 transition-colors focus-within:border-primary">
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
        <Section icon={<Camera className="size-[18px]" />} title="Fotos">
          <div className="flex flex-wrap gap-2">
            {job.fotos.map((src, i) => (
              <div
                key={i}
                className="relative size-24 overflow-hidden rounded-2xl border border-border animate-in fade-in zoom-in-95 duration-200"
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
              className="flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-muted-foreground transition active:scale-95 active:bg-muted"
            >
              <Camera className="size-6" />
              <span className="text-xs font-semibold">Sacar foto</span>
            </button>
          </div>
        </Section>

        {/* ── Presupuesto ── */}
        <Section icon={<FileText className="size-[18px]" />} title="Presupuesto">
          {job.quote ? (
            <div className="rounded-2xl border border-border bg-card p-4">
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
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground transition active:scale-[0.99]"
              >
                <MessageCircle className="size-4" /> Reenviar por WhatsApp
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => store.go({ name: 'presupuesto', jobId })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-base font-semibold text-primary transition active:scale-[0.99] active:bg-muted"
            >
              <FileText className="size-5" /> Crear presupuesto
            </button>
          )}
        </Section>

        {/* ── Cobro ── */}
        <Section icon={<Wallet className="size-[18px]" />} title="Cobro">
          {job.cobrado ? (
            <div className="flex items-center justify-between rounded-2xl border border-status-cobrado/30 bg-status-cobrado/10 px-4 py-4 animate-in fade-in duration-300">
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
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 transition active:scale-[0.99] active:bg-muted"
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
          <Section icon={<History className="size-[18px]" />} title="Historial del cliente">
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
                    : 'border-border bg-card',
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
              className="rounded-2xl border border-border bg-card px-4 py-4 text-left text-base font-semibold text-foreground transition active:scale-[0.99] active:bg-muted"
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
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4 transition-colors focus-within:border-primary">
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
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-status-cobrado text-lg font-bold text-status-cobrado-foreground transition active:scale-[0.99] disabled:opacity-40"
        >
          <Check className="size-5" strokeWidth={2.5} /> Cobrado
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
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  highlight?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl py-3.5 text-xs font-semibold transition active:scale-95 disabled:opacity-35 disabled:active:scale-100',
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
      <div className="mb-2 flex items-center gap-1.5 px-1 text-muted-foreground">
        {icon}
        <h2 className="text-[12px] font-bold uppercase tracking-wider">{title}</h2>
      </div>
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
    <div className="border-t border-border bg-card px-5 pb-8 pt-4">
      <button
        type="button"
        onClick={action}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition active:scale-[0.99]"
      >
        {label} <ArrowRight className="size-5" />
      </button>
    </div>
  )
}
