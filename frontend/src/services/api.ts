import type {
  AnalyzeEvent,
  AnalyzeResult,
  ApiErrorBody,
  Category,
  DetectResponse,
  HistoryItem,
  HistoryList,
  RuntimeSettings,
  SegmentResponse,
  Statistics,
  SystemStatus,
} from './types'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const apiUrl = (path: string) => `${BASE}${path}`
export const assetUrl = (path: string | null | undefined) => (path ? `${BASE}${path}` : '')

export class ApiError extends Error {
  status: number
  body: ApiErrorBody
  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.status = status
    this.body = body
  }
  get code() {
    return this.body.code
  }
  get isModelError() {
    return this.body.code?.startsWith('MODEL_')
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody = { code: `HTTP_${res.status}`, message: `Lỗi máy chủ (${res.status})` }
  try {
    const json = await res.json()
    if (json?.error) body = json.error
    else if (json?.detail) body = { code: `HTTP_${res.status}`, message: typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail) }
  } catch {
    /* body không phải JSON */
  }
  return new ApiError(res.status, body)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), init)
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(0, {
      code: 'BACKEND_UNREACHABLE',
      message: 'Không kết nối được backend. Hãy chắc chắn FastAPI đang chạy (mặc định http://127.0.0.1:8000).',
    })
  }
  if (!res.ok) throw await parseError(res)
  return (await res.json()) as T
}

const fileForm = (file: Blob, name = 'image.jpg', extra: Record<string, string> = {}) => {
  const form = new FormData()
  form.append('file', file, file instanceof File ? file.name : name)
  Object.entries(extra).forEach(([k, v]) => form.append(k, v))
  return form
}

export const api = {
  health: () => request<{ status: string; yolo_ready: boolean; sam_ready: boolean; device: string }>('/api/health'),

  detect: (image: Blob, signal?: AbortSignal) =>
    request<DetectResponse>('/api/detect', { method: 'POST', body: fileForm(image, 'frame.jpg'), signal }),

  segment: (imageId: string, boxes: number[][], signal?: AbortSignal) => {
    const form = new FormData()
    form.append('image_id', imageId)
    form.append('boxes', JSON.stringify(boxes))
    return request<SegmentResponse>('/api/segment', { method: 'POST', body: form, signal })
  },

  analyze: (image: Blob, opts: { save?: boolean; source?: 'upload' | 'camera'; signal?: AbortSignal } = {}) =>
    request<AnalyzeResult>('/api/analyze', {
      method: 'POST',
      body: fileForm(image, 'capture.jpg', { save: String(opts.save ?? true), source: opts.source ?? 'upload' }),
      signal: opts.signal,
    }),

  /** Chạy pipeline và nhận trạng thái thật của từng giai đoạn qua NDJSON. */
  async analyzeStream(
    image: Blob,
    onEvent: (e: AnalyzeEvent) => void,
    opts: { save?: boolean; source?: 'upload' | 'camera'; signal?: AbortSignal } = {},
  ): Promise<AnalyzeResult> {
    let res: Response
    try {
      res = await fetch(apiUrl('/api/analyze?stream=true'), {
        method: 'POST',
        body: fileForm(image, 'capture.jpg', { save: String(opts.save ?? true), source: opts.source ?? 'upload' }),
        signal: opts.signal,
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      throw new ApiError(0, { code: 'BACKEND_UNREACHABLE', message: 'Không kết nối được backend FastAPI.' })
    }
    if (!res.ok) throw await parseError(res)
    if (!res.body) throw new ApiError(500, { code: 'STREAM_UNSUPPORTED', message: 'Trình duyệt không hỗ trợ đọc luồng.' })

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result: AnalyzeResult | null = null
    for (;;) {
      const { value, done } = await reader.read()
      if (value) buffer += decoder.decode(value, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (!line) continue
        const event = JSON.parse(line) as AnalyzeEvent
        if (event.type === 'error') throw new ApiError(event.status_code, event.error)
        if (event.type === 'result') result = event.data
        onEvent(event)
      }
      if (done) break
    }
    if (!result) throw new ApiError(500, { code: 'STREAM_INCOMPLETE', message: 'Luồng kết quả bị ngắt giữa chừng.' })
    return result
  },

  categories: () => request<{ categories: Category[] }>('/api/categories'),

  statistics: (days: number) => request<Statistics>(`/api/statistics?days=${days}`),

  history: (params: { search?: string; category?: string; date_from?: string; date_to?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
    })
    return request<HistoryList>(`/api/history?${q.toString()}`)
  },
  historyItem: (id: number) => request<HistoryItem>(`/api/history/${id}`),
  deleteHistory: (id: number) => request<{ deleted: number }>(`/api/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request<{ deleted: number }>('/api/history?confirm=true', { method: 'DELETE' }),

  systemStatus: () => request<SystemStatus>('/api/system/status'),
  updateSettings: (patch: Partial<RuntimeSettings>) =>
    request<RuntimeSettings>('/api/system/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  resetSettings: () => request<RuntimeSettings>('/api/system/settings', { method: 'DELETE' }),
  reloadModels: () => request<{ status: string }>('/api/system/reload', { method: 'POST' }),
}
