import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSystemStatus } from '../hooks/useSystemStatus'
import type { ModelState } from '../services/types'

const STATE_LABEL: Record<ModelState, { text: string; dot: string }> = {
  ready: { text: 'sẵn sàng', dot: 'bg-eco-600' },
  loading: { text: 'đang nạp', dot: 'bg-sky-500 animate-pulse' },
  not_loaded: { text: 'đang nạp', dot: 'bg-sky-500 animate-pulse' },
  error: { text: 'chưa cấu hình', dot: 'bg-amber-500' },
  disabled: { text: 'đang tắt', dot: 'bg-slate-400' },
}

export function ModelStatusCard() {
  const { status, error } = useSystemStatus()

  if (error && !status) {
    return (
      <Link to="/settings" className="block rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 hover:bg-red-100">
        <span className="font-semibold">Mất kết nối backend</span>
        <span className="mt-0.5 block text-xs text-red-700">Chạy FastAPI tại cổng 8000</span>
      </Link>
    )
  }

  const rows = status
    ? [
        { name: 'YOLO', file: status.models.yolo.weights.split('/').pop(), state: status.models.yolo.state },
        { name: 'SAM', file: status.models.sam.weights.split('/').pop(), state: status.models.sam.state },
      ]
    : []

  return (
    <Link to="/settings" className="block rounded-xl border border-slate-200 bg-surface p-3.5 hover:border-slate-300">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Trạng thái model</span>
      <span className="mt-2.5 flex flex-col gap-2">
        {!status && <span className="text-sm text-slate-500">Đang kiểm tra…</span>}
        {rows.map((r) => (
          <span key={r.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-800">
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATE_LABEL[r.state].dot}`} aria-hidden="true" />
              <span className="font-medium">{r.name}</span>
              <span className="truncate font-mono text-[11px] text-slate-500">{r.file}</span>
            </span>
            <span className="shrink-0 text-xs text-slate-600">{STATE_LABEL[r.state].text}</span>
          </span>
        ))}
        {status && (
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <Zap size={14} aria-hidden="true" />
            {status.models.device.cuda_available ? `CUDA · ${status.models.device.gpu_name ?? 'GPU'}` : 'CPU'}
          </span>
        )}
      </span>
    </Link>
  )
}
