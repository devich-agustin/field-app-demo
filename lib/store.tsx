'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Job, JobStatus, Quote, QuoteItem, Reminder } from './types'

type View =
  | { name: 'onboarding' }
  | { name: 'hoy' }
  | { name: 'trabajos' }
  | { name: 'crear' }
  | { name: 'trabajo'; jobId: string }
  | { name: 'presupuesto'; jobId: string }

interface Profile {
  nombre: string
  oficio: string
  matricula?: string
  horaDigest: string
}

interface PriceSuggestion {
  descripcion: string
  precio: number
}

interface Store {
  profile: Profile
  setProfile: (p: Profile) => void
  jobs: Job[]
  reminders: Reminder[]
  priceList: PriceSuggestion[]
  view: View
  stack: View[]
  go: (v: View) => void
  back: () => void
  getJob: (id: string) => Job | undefined
  createJob: (data: {
    cliente: string
    telefono?: string
    direccion?: string
    cuando: string
    esHoy: boolean
    nota?: string
  }) => string
  setStatus: (id: string, status: JobStatus) => void
  markEsperando: (id: string, whenLabel: string) => void
  addNote: (id: string, text: string) => void
  addPhoto: (id: string, url: string) => void
  markCobrado: (id: string, monto: number) => void
  saveQuote: (id: string, quote: Quote) => void
  sendQuote: (id: string) => void
  dismissReminder: (id: string) => void
  learnPrices: (items: QuoteItem[]) => void
}

const StoreContext = createContext<Store | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10)

const seedJobs: Job[] = [
  {
    id: 'j1',
    cliente: 'González',
    telefono: '1156781234',
    direccion: 'Av. Rivadavia 4820, CABA',
    cuando: 'Hoy',
    esHoy: true,
    status: 'esperando',
    notas: [
      {
        id: uid(),
        text: 'Bisagra de la puerta del placard rota. Falta el repuesto, lo traigo mañana.',
        at: 'Ayer 15:40',
      },
    ],
    fotos: [],
    cobrado: false,
    reminderText: 'Acordate de volver a lo de González con el repuesto de la bisagra.',
    reminderWhen: 'Mañana',
    historial: 'Ya lo atendiste 2 veces. Última: cambio de flexible, marzo.',
  },
  {
    id: 'j2',
    cliente: 'Pérez',
    telefono: '1145559876',
    direccion: 'Bulnes 1123, CABA',
    cuando: 'Hace 5 días',
    esHoy: false,
    status: 'terminado',
    notas: [
      { id: uid(), text: 'Cambio de termotanque 80L. Listo.', at: 'Hace 5 días' },
    ],
    fotos: [],
    cobrado: false,
    terminadoHaceDias: 5,
  },
  {
    id: 'j3',
    cliente: 'López',
    telefono: '1133224455',
    direccion: 'Thames 2200, CABA',
    cuando: 'Hace 4 días',
    esHoy: false,
    status: 'agendado',
    notas: [{ id: uid(), text: 'Presupuesto por reforma de baño.', at: 'Hace 4 días' }],
    fotos: [],
    cobrado: false,
    quote: {
      total: 185000,
      descripcion: 'Reforma de baño: mano de obra + materiales',
      items: [
        { id: uid(), descripcion: 'Mano de obra instalación', precio: 120000 },
        { id: uid(), descripcion: 'Materiales y sellados', precio: 65000 },
      ],
      status: 'enviado',
      enviadoHace: 4,
    },
  },
  {
    id: 'j4',
    cliente: 'Martínez',
    telefono: '1166778899',
    direccion: 'Av. Cabildo 1750, CABA',
    cuando: 'Hoy',
    esHoy: true,
    status: 'agendado',
    notas: [{ id: uid(), text: 'Pérdida en la cocina, revisar canilla.', at: 'Hoy 08:10' }],
    fotos: [],
    cobrado: false,
  },
]

function shortZone(direccion?: string): string | undefined {
  if (!direccion) return undefined
  // toma la última parte legible de la dirección (barrio / ciudad)
  const parts = direccion.split(',').map((p) => p.trim())
  return parts.length > 1 ? parts[parts.length - 1] : undefined
}

function buildReminders(jobs: Job[]): Reminder[] {
  const out: Reminder[] = []
  for (const j of jobs) {
    // Cobro pendiente — lo más importante: es plata sin cobrar
    if (j.status === 'terminado' && !j.cobrado && (j.terminadoHaceDias ?? 0) >= 2) {
      const monto = j.quote?.total
      out.push({
        id: 'rc-' + j.id,
        jobId: j.id,
        text: `Terminaste lo de ${j.cliente} hace ${j.terminadoHaceDias} días y todavía no registraste el cobro.`,
        subtitle: monto
          ? `${formatMoney(monto)} sin cobrar`
          : 'Sin registrar el cobro',
        amount: monto,
        action: 'cobrar',
        when: 'Cobro pendiente',
        priority: true,
      })
    }

    // Volver con el repuesto / seguimiento del trabajo
    if (j.status === 'esperando' && j.reminderText) {
      const zona = shortZone(j.direccion)
      out.push({
        id: 'r-' + j.id,
        jobId: j.id,
        text: j.reminderText,
        subtitle: [j.reminderWhen ?? 'Pronto', zona].filter(Boolean).join(' · '),
        action: 'volver',
        when: j.reminderWhen ?? 'Mañana',
      })
    }

    // Presupuesto enviado sin respuesta
    if (
      j.quote?.status === 'enviado' &&
      (j.quote.enviadoHace ?? 0) >= 3 &&
      j.status !== 'cobrado'
    ) {
      out.push({
        id: 'rp-' + j.id,
        jobId: j.id,
        text: `El presupuesto de ${j.cliente} sigue sin respuesta.`,
        subtitle: `Enviado hace ${j.quote.enviadoHace} días · ${formatMoney(
          j.quote.total,
        )}`,
        amount: j.quote.total,
        action: 'seguir-presupuesto',
        when: 'Seguimiento',
      })
    }
  }
  // los prioritarios (cobros) primero
  return out.sort((a, b) => Number(b.priority ?? false) - Number(a.priority ?? false))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>({
    nombre: 'Carlos',
    oficio: 'Plomero',
    matricula: 'Mat. 4821',
    horaDigest: '08:00',
  })
  const [jobs, setJobs] = useState<Job[]>(seedJobs)
  const [priceList, setPriceList] = useState<PriceSuggestion[]>([
    { descripcion: 'Mano de obra instalación', precio: 120000 },
    { descripcion: 'Destape de cañería', precio: 45000 },
    { descripcion: 'Cambio de flexible', precio: 18000 },
    { descripcion: 'Visita y diagnóstico', precio: 15000 },
  ])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [stack, setStack] = useState<View[]>([{ name: 'onboarding' }])

  const view = stack[stack.length - 1]

  const go = (v: View) => setStack((s) => [...s, v])
  const back = () =>
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))

  const reminders = useMemo(
    () => buildReminders(jobs).filter((r) => !dismissed.includes(r.id)),
    [jobs, dismissed],
  )

  const getJob = (id: string) => jobs.find((j) => j.id === id)

  const updateJob = (id: string, patch: Partial<Job>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)))

  const createJob: Store['createJob'] = (data) => {
    const id = uid()
    const job: Job = {
      id,
      cliente: data.cliente,
      telefono: data.telefono || undefined,
      direccion: data.direccion || undefined,
      cuando: data.cuando,
      esHoy: data.esHoy,
      status: 'agendado',
      notas: data.nota
        ? [{ id: uid(), text: data.nota, at: 'Recién' }]
        : [],
      fotos: [],
      cobrado: false,
    }
    setJobs((js) => [job, ...js])
    return id
  }

  const setStatus: Store['setStatus'] = (id, status) => {
    if (status === 'cobrado') {
      updateJob(id, { status, cobrado: true })
      return
    }
    updateJob(id, { status })
  }

  const markEsperando: Store['markEsperando'] = (id, whenLabel) => {
    const job = getJob(id)
    const cliente = job?.cliente ?? ''
    const lastNote = job?.notas[job.notas.length - 1]?.text
    const detail = lastNote ? ` con ${lastNote.split('.')[0].toLowerCase()}` : ''
    updateJob(id, {
      status: 'esperando',
      reminderWhen: whenLabel,
      reminderText: `Acordate de volver a lo de ${cliente}${detail}.`,
    })
  }

  const addNote: Store['addNote'] = (id, text) => {
    const job = getJob(id)
    if (!job) return
    updateJob(id, {
      notas: [...job.notas, { id: uid(), text, at: 'Recién' }],
    })
  }

  const addPhoto: Store['addPhoto'] = (id, url) => {
    const job = getJob(id)
    if (!job) return
    updateJob(id, { fotos: [...job.fotos, url] })
  }

  const markCobrado: Store['markCobrado'] = (id, monto) => {
    updateJob(id, { cobrado: true, status: 'cobrado', montoCobrado: monto })
  }

  const saveQuote: Store['saveQuote'] = (id, quote) => {
    updateJob(id, { quote })
  }

  const sendQuote: Store['sendQuote'] = (id) => {
    const job = getJob(id)
    if (!job?.quote) return
    updateJob(id, {
      quote: { ...job.quote, status: 'enviado', enviadoHace: 0 },
    })
  }

  const dismissReminder: Store['dismissReminder'] = (rid) =>
    setDismissed((d) => [...d, rid])

  const learnPrices: Store['learnPrices'] = (items) => {
    setPriceList((prev) => {
      const next = [...prev]
      for (const it of items) {
        if (!it.descripcion.trim()) continue
        const idx = next.findIndex(
          (p) => p.descripcion.toLowerCase() === it.descripcion.toLowerCase(),
        )
        if (idx >= 0) next[idx] = { descripcion: it.descripcion, precio: it.precio }
        else next.push({ descripcion: it.descripcion, precio: it.precio })
      }
      return next
    })
  }

  const value: Store = {
    profile,
    setProfile,
    jobs,
    reminders,
    priceList,
    view,
    stack,
    go,
    back,
    getJob,
    createJob,
    setStatus,
    markEsperando,
    addNote,
    addPhoto,
    markCobrado,
    saveQuote,
    sendQuote,
    dismissReminder,
    learnPrices,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  agendado: 'Agendado',
  proceso: 'En proceso',
  esperando: 'Esperando',
  terminado: 'Terminado',
  cobrado: 'Cobrado',
}

export function formatMoney(n: number) {
  return '$' + n.toLocaleString('es-AR')
}
