export type JobStatus =
  | 'agendado'
  | 'proceso'
  | 'esperando'
  | 'terminado'
  | 'cobrado'

export type QuoteStatus = 'borrador' | 'enviado' | 'aprobado'

export interface QuoteItem {
  id: string
  descripcion: string
  precio: number
}

export interface Quote {
  total: number
  descripcion?: string
  items: QuoteItem[]
  status: QuoteStatus
  enviadoHace?: number // días desde el envío (para el prototipo)
}

export interface Reminder {
  id: string
  jobId: string
  text: string
  action: 'volver' | 'cobrar' | 'seguir-presupuesto'
  when: string // etiqueta legible, ej. "Mañana"
  subtitle?: string // contexto concreto, ej. "Barrio Norte · hace 3 días"
  amount?: number // monto en juego, ej. lo que falta cobrar
  priority?: boolean // true = lo más urgente, va arriba y resaltado
}

export interface JobNote {
  id: string
  text: string
  at: string
}

export interface Job {
  id: string
  cliente: string
  telefono?: string
  direccion?: string
  cuando: string // "Hoy" | "Mañana" | fecha
  esHoy: boolean
  status: JobStatus
  notas: JobNote[]
  fotos: string[]
  quote?: Quote
  cobrado: boolean
  montoCobrado?: number
  reminderText?: string
  reminderWhen?: string
  terminadoHaceDias?: number
  historial?: string
}
