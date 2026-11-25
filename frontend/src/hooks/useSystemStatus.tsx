import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError, api } from '../services/api'
import type { SystemStatus } from '../services/types'

interface Ctx {
  status: SystemStatus | null
  error: ApiError | null
  loading: boolean
  refresh: () => Promise<void>
}

const SystemStatusContext = createContext<Ctx | null>(null)

export function SystemStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number>()

  const refresh = useCallback(async () => {
    try {
      const s = await api.systemStatus()
      setStatus(s)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, { code: 'UNKNOWN', message: String(err) }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      await refresh()
      if (cancelled) return
      // Poll nhanh khi model đang nạp hoặc backend chưa lên, chậm khi mọi thứ ổn định.
      const busy = !status || [status.models.yolo.state, status.models.sam.state].some((s) => s === 'loading' || s === 'not_loaded')
      timer.current = window.setTimeout(tick, busy ? 3000 : 20000)
    }
    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, status?.models.yolo.state, status?.models.sam.state])

  return <SystemStatusContext.Provider value={{ status, error, loading, refresh }}>{children}</SystemStatusContext.Provider>
}

export function useSystemStatus() {
  const ctx = useContext(SystemStatusContext)
  if (!ctx) throw new Error('useSystemStatus phải nằm trong SystemStatusProvider')
  return ctx
}
