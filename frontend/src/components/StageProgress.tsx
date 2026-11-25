import { Check, Circle, Minus, X } from 'lucide-react'
import { fmtMs } from '../services/format'
import type { StageName, StageStatus } from '../services/types'
import { Spinner } from './ui'

export interface StageState {
  status: StageStatus
  ms?: number
  note?: string
}

export const STAGES: { id: StageName; label: string }[] = [
  { id: 'upload', label: 'Tải ảnh' },
  { id: 'detect', label: 'YOLO phát hiện' },
  { id: 'segment', label: 'SAM phân đoạn' },
  { id: 'classify', label: 'Phân loại' },
  { id: 'save', label: 'Lưu lịch sử' },
]

export const initialStages = (): Record<StageName, StageState> => ({
  upload: { status: 'pending' },
  detect: { status: 'pending' },
  segment: { status: 'pending' },
  classify: { status: 'pending' },
  save: { status: 'pending' },
})

/** Trạng thái thật của từng giai đoạn, lấy từ luồng NDJSON của /api/analyze?stream=true. */
export function StageProgress({ stages }: { stages: Record<StageName, StageState> }) {
  const doneCount = STAGES.filter((s) => ['done', 'skipped'].includes(stages[s.id].status)).length
  return (
    <div className="flex flex-col gap-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={STAGES.length} aria-valuenow={doneCount} aria-label="Tiến trình xử lý">
        <div className="h-full rounded-full bg-eco-600 transition-all duration-500" style={{ width: `${(doneCount / STAGES.length) * 100}%` }} />
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAGES.map((s) => {
          const st = stages[s.id]
          return (
            <li key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="shrink-0">
                {st.status === 'done' && <Check size={16} className="text-eco-700" aria-hidden="true" />}
                {st.status === 'running' && <Spinner size={16} className="text-sky-700" />}
                {st.status === 'pending' && <Circle size={16} className="text-slate-300" aria-hidden="true" />}
                {st.status === 'skipped' && <Minus size={16} className="text-slate-500" aria-hidden="true" />}
                {st.status === 'error' && <X size={16} className="text-red-700" aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800">{s.label}</span>
                <span className="block truncate font-mono text-[11px] text-slate-500">
                  {st.status === 'running'
                      ? 'đang chạy…'
                      : st.status === 'done'
                        ? st.ms != null ? fmtMs(st.ms) : st.note ?? 'xong'
                        : st.status === 'skipped'
                          ? 'bỏ qua'
                          : st.status === 'error'
                            ? 'lỗi'
                            : 'chờ'}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
