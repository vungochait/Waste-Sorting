import { useState } from 'react'
import { categoryMeta } from '../services/categories'
import type { DetectedObject, Polygon } from '../services/types'

export type ViewMode = 'result' | 'original' | 'compare'

export const polygonPath = (polygons: Polygon[] | null | undefined) =>
  (polygons ?? [])
    .filter((p) => p.length >= 3)
    .map((p) => `M${p.map(([x, y]) => `${x} ${y}`).join(' L')} Z`)
    .join(' ')

interface OverlayProps {
  width: number
  height: number
  objects: DetectedObject[]
  selectedId: number | null
  onSelect?: (id: number | null) => void
  showBoxes: boolean
  showMasks: boolean
}

export function DetectionOverlay({ width, height, objects, selectedId, onSelect, showBoxes, showMasks }: OverlayProps) {
  const sw = Math.max(2, width / 380)
  const font = Math.max(12, Math.round(width / 52))
  const pad = font * 0.45
  const hasSel = selectedId !== null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      onClick={() => onSelect?.(null)}
    >
      {showMasks &&
        objects.map((o) => {
          const d = polygonPath(o.polygons)
          if (!d) return null
          const meta = categoryMeta(o.category)
          const active = o.id === selectedId
          return (
            <path
              key={`m${o.id}`}
              d={d}
              fill={meta.color}
              fillOpacity={hasSel ? (active ? 0.5 : 0.16) : 0.4}
              stroke={meta.color}
              strokeWidth={active ? sw * 1.4 : sw}
              strokeLinejoin="round"
              className="cursor-pointer transition-[fill-opacity]"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(o.id)
              }}
            />
          )
        })}
      {showBoxes &&
        objects.map((o) => {
          const meta = categoryMeta(o.category)
          const [x1, y1, x2, y2] = o.bbox
          const active = o.id === selectedId
          const text = `${o.name} ${(o.confidence * 100).toFixed(1)}%`
          const lw = text.length * font * 0.6 + pad * 2
          const lh = font + pad * 1.6
          const ly = y1 - lh >= 0 ? y1 - lh : y1
          const lx = Math.min(x1, width - lw)
          return (
            <g
              key={`b${o.id}`}
              className="cursor-pointer"
              opacity={hasSel && !active ? 0.45 : 1}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(o.id)
              }}
            >
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="transparent" stroke={meta.color} strokeWidth={active ? sw * 1.8 : sw} rx={sw * 2} />
              <rect x={lx} y={ly} width={lw} height={lh} rx={sw * 2} fill={meta.ink} />
              <text x={lx + pad} y={ly + lh - pad * 1.05} fill="#FFFFFF" fontSize={font} fontWeight={600} fontFamily="Be Vietnam Pro, sans-serif">
                {text}
              </text>
            </g>
          )
        })}
    </svg>
  )
}

interface ViewerProps extends OverlayProps {
  src: string
  mode: ViewMode
  zoom: number
  alt?: string
}

export function ResultViewer({ src, mode, zoom, alt = 'Ảnh phân tích', ...overlay }: ViewerProps) {
  const [split, setSplit] = useState(50)
  const aspect = `${overlay.width} / ${overlay.height}`
  const showOverlay = mode !== 'original'

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[72vh] overflow-auto rounded-xl bg-slate-100">
        <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, aspectRatio: aspect }}>
          <img src={src} alt={alt} className="absolute inset-0 h-full w-full select-none object-fill" draggable={false} />
          {mode === 'result' && <DetectionOverlay {...overlay} />}
          {mode === 'compare' && (
            <>
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-fill" draggable={false} />
                <DetectionOverlay {...overlay} />
              </div>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.25)]" style={{ left: `${split}%` }} />
              <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">Kết quả</span>
              <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">Ảnh gốc</span>
            </>
          )}
          {!showOverlay && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">Ảnh gốc</span>
          )}
        </div>
      </div>
      {mode === 'compare' && (
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <span className="shrink-0">So sánh</span>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="w-full accent-eco-700"
            aria-label="Vị trí thanh so sánh ảnh gốc và kết quả"
          />
        </label>
      )}
    </div>
  )
}
