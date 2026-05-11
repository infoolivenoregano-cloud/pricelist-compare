const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Distributors
export const getDistributors = () => req<Distributor[]>('/distributors')
export const createDistributor = (data: Partial<Distributor>) =>
  req<Distributor>('/distributors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateDistributor = (id: number, data: Partial<Distributor>) =>
  req<Distributor>(`/distributors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteDistributor = (id: number) =>
  req<void>(`/distributors/${id}`, { method: 'DELETE' })

// Uploads
export const getUploads = () => req<Upload[]>('/uploads')
export const previewUpload = (formData: FormData) =>
  req<ExcelPreview>('/uploads/preview', { method: 'POST', body: formData })
export const confirmUpload = (formData: FormData) =>
  req<Upload>('/uploads/confirm', { method: 'POST', body: formData })
export const deleteUpload = (id: number) =>
  req<void>(`/uploads/${id}`, { method: 'DELETE' })

// Compare
export const getCompare = (weekDate?: string) =>
  req<CompareResponse>(`/compare${weekDate ? `?week_date=${weekDate}` : ''}`)
export const getAvailableWeeks = () => req<string[]>('/compare/weeks')

// Items
export const getCanonicalItems = () => req<CanonicalItem[]>('/items/canonical')
export const createCanonicalItem = (data: Partial<CanonicalItem>) =>
  req<CanonicalItem>('/items/canonical', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateCanonicalItem = (id: number, data: Partial<CanonicalItem>) =>
  req<CanonicalItem>(`/items/canonical/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteCanonicalItem = (id: number) =>
  req<void>(`/items/canonical/${id}`, { method: 'DELETE' })
export const getUnlinkedItems = () => req<UnlinkedItem[]>('/items/unlinked')
export const linkItem = (upload_item_id: number, canonical_id: number) =>
  req('/items/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ upload_item_id, canonical_id }) })
export const unlinkItem = (upload_item_id: number) =>
  req(`/items/unlink/${upload_item_id}`, { method: 'POST' })
export const autoLink = () => req<{ linked: number }>('/items/auto-link', { method: 'POST' })
export const createAndLink = (upload_item_id: number, data: Partial<CanonicalItem>) =>
  req<CanonicalItem>(`/items/create-and-link/${upload_item_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

// Orders
export const getOrders = () => req<OrderSession[]>('/orders')
export const getOrder = (id: number) => req<OrderSession>(`/orders/${id}`)
export const createOrder = (data: CreateOrderPayload) =>
  req<OrderSession>('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteOrder = (id: number) =>
  req<void>(`/orders/${id}`, { method: 'DELETE' })
export const updateOrderLine = (sessionId: number, lineId: number, quantity: number) =>
  req(`/orders/${sessionId}/lines/${lineId}?quantity=${quantity}`, { method: 'PUT' })
export const removeOrderLine = (sessionId: number, lineId: number) =>
  req<void>(`/orders/${sessionId}/lines/${lineId}`, { method: 'DELETE' })

// Types
export interface Distributor {
  id: number
  name: string
  color: string
  contact_name?: string
  contact_email?: string
  created_at: string
  has_mapping: boolean
  latest_upload?: string
}

export interface Upload {
  id: number
  distributor_id: number
  distributor_name: string
  distributor_color: string
  filename: string
  week_date: string
  created_at: string
  item_count: number
}

export interface ColumnMapping {
  id: number
  distributor_id: number
  header_row: number
  sheet_name?: string
  sku_column?: string
  name_column: string
  pack_size_column?: string
  unit_column?: string
  price_column: string
  notes_column?: string
}

export interface ExcelPreview {
  sheets: string[]
  columns: string[]
  rows: Record<string, string>[]
  existing_mapping?: ColumnMapping
}

export interface CanonicalItem {
  id: number
  name: string
  category?: string
  menu_price?: number
  linked_count: number
}

export interface UnlinkedItem {
  id: number
  upload_item_id: number
  name: string
  sku?: string
  pack_size?: string
  unit?: string
  price: number
  distributor_id: number
  distributor_name: string
  distributor_color: string
  week_date: string
  suggestions: { id: number; name: string; score: number }[]
}

export interface PriceEntry {
  upload_item_id: number
  price: number
  pack_size?: string
  unit?: string
  prev_price?: number
  change_pct?: number
  sku?: string
}

export interface CompareItem {
  canonical_id: number
  canonical_name: string
  category?: string
  menu_price?: number
  prices: Record<number, PriceEntry>
  best_distributor_id?: number
}

export interface CompareResponse {
  week_date: string
  distributors: { id: number; name: string; color: string; upload_id?: number }[]
  items: CompareItem[]
  available_weeks: string[]
}

export interface OrderLine {
  id: number
  upload_item_id: number
  item_name: string
  item_sku?: string
  item_pack_size?: string
  item_unit?: string
  price: number
  distributor_id: number
  distributor_name: string
  distributor_color: string
  quantity: number
  unit_override?: string
  notes?: string
  line_total: number
}

export interface OrderSession {
  id: number
  name?: string
  week_date: string
  created_at: string
  notes?: string
  lines: OrderLine[]
  grand_total: number
}

export interface CreateOrderPayload {
  name?: string
  week_date: string
  notes?: string
  lines: { upload_item_id: number; quantity: number }[]
}
