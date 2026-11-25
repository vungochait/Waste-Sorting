import { motion } from 'framer-motion'
import { CheckCircle2, Lightbulb, Trash } from 'lucide-react'
import { categoryMeta } from '../services/categories'
import { fmtNumber, fmtPercent } from '../services/format'
import type { DetectedObject } from '../services/types'
import { CategoryBadge, ConfidenceBar } from './ui'

export function ObjectCard({ obj, selected, onSelect, index = 0 }: { obj: DetectedObject; selected?: boolean; onSelect?: () => void; index?: number }) {
  const meta = categoryMeta(obj.category)
  const Icon = meta.icon
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="card flex flex-col gap-4 p-5 transition-shadow"
      style={selected ? { boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 4px ${meta.color}` } : undefined}
    >
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.ink }}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold">{obj.name}</h3>
          <p className="truncate font-mono text-xs text-slate-500">#{obj.id + 1} · lớp YOLO: {obj.label}</p>
        </div>
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={obj.category} />
        {obj.area_ratio != null && (
          <span className="chip bg-slate-100 text-slate-700">Diện tích {fmtPercent(obj.area_ratio)}</span>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Độ tin cậy</p>
        <ConfidenceBar value={obj.confidence} color={meta.color} />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <CheckCircle2 size={16} aria-hidden="true" style={{ color: meta.ink }} /> Hướng dẫn xử lý
        </p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-relaxed text-slate-700">
          {obj.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl bg-surface p-3">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <span><span className="font-semibold text-slate-800">Khuyến nghị tái chế: </span>{obj.recommendation}</span>
        </p>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: meta.ink }}>
          <Trash size={15} aria-hidden="true" /> {obj.bin}
        </span>
        {onSelect && (
          <button type="button" className="btn-ghost min-h-[40px] px-3 text-sm" onClick={onSelect} aria-pressed={selected}>
            {selected ? 'Đang xem' : 'Xem trên ảnh'}
          </button>
        )}
      </footer>
      {obj.mask_area_px != null && (
        <p className="-mt-2 font-mono text-[11px] text-slate-500">
          mask {fmtNumber(obj.mask_area_px)} px · bbox [{obj.bbox.map((v) => Math.round(v)).join(', ')}]
        </p>
      )}
    </motion.article>
  )
}
