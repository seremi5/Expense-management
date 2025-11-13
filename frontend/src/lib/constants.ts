export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Get file URL - returns the URL as-is
 * In development: Vite proxy routes /uploads to backend (localhost:3000)
 * In production: Reverse proxy (nginx) routes /uploads to backend
 */
export function getFileUrl(fileUrl: string | null | undefined): string | null {
  return fileUrl || null
}

export const EXPENSE_STATUS = {
  SUBMITTED: 'submitted',
  READY_TO_PAY: 'ready_to_pay',
  PAID: 'paid',
  DECLINED: 'declined',
} as const

export const EXPENSE_STATUS_LABELS = {
  submitted: 'Enviada',
  ready_to_pay: 'Llesta per pagar',
  paid: 'Pagada',
  declined: 'Denegada',
} as const

export const EVENTS = {
  PEREGRINATGE_ESTIU_ROMA: 'peregrinatge_estiu_roma',
  BARTIMEU: 'bartimeu',
  BE_APOSTLE: 'be_apostle',
  EMUNAH: 'emunah',
  ESCOLA_PREGARIA: 'escola_pregaria',
  EXERCICIS_ESPIRITUALS: 'exercicis_espirituals',
  HAR_TABOR: 'har_tabor',
  NICODEMUS: 'nicodemus',
  TROBADA_ADOLESCENTS: 'trobada_adolescents',
  EQUIP_DELE: 'equip_dele',
  GENERAL: 'general',
} as const

export const EVENT_LABELS = {
  peregrinatge_estiu_roma: 'Peregrinatge d\'estiu (Roma)',
  bartimeu: 'Bartimeu',
  be_apostle: 'Be apostle',
  emunah: 'Emunah',
  escola_pregaria: 'Escola de pregària',
  exercicis_espirituals: 'Exercicis espirituals',
  har_tabor: 'Har Tabor',
  nicodemus: 'Nicodemus',
  trobada_adolescents: 'Trobada adolescents',
  equip_dele: 'Equip Dele',
  general: 'General',
} as const

export const CATEGORIES = {
  MENJAR: 'menjar',
  TRANSPORT: 'transport',
  MATERIAL_ACTIVITATS: 'material_activitats',
  DIETES: 'dietes',
  IMPRESOS_FOTOCOPIES: 'impresos_fotocopies',
  WEB_XARXES: 'web_xarxes',
  CASA_CONVIS: 'casa_convis',
  FORMACIO: 'formacio',
  CANCELLACIONS: 'cancellacions',
  MATERIAL_MUSICA: 'material_musica',
  REPARACIONS: 'reparacions',
  MOBILIARI: 'mobiliari',
} as const

export const CATEGORY_LABELS = {
  menjar: 'Menjar per activitats o reunions',
  transport: 'Transport',
  material_activitats: 'Material per activitats o reunions',
  dietes: 'Dietes',
  impresos_fotocopies: 'Impresos i fotocòpies',
  web_xarxes: 'Web/Xarxes socials',
  casa_convis: 'Casa de convis',
  formacio: 'Formació',
  cancellacions: 'Cancel·lacions',
  material_musica: 'Material música',
  reparacions: 'Reparacions',
  mobiliari: 'Mobiliari',
} as const

export const EXPENSE_TYPES = {
  REIMBURSABLE: 'reimbursable',
  NON_REIMBURSABLE: 'non_reimbursable',
  PAYABLE: 'payable',
} as const

export const EXPENSE_TYPE_LABELS = {
  reimbursable: 'Reemborsable',
  non_reimbursable: 'No reemborsable',
  payable: 'A pagar',
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const
