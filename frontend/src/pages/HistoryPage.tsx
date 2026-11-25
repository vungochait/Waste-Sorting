import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Eye, History as HistoryIcon, Search, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorPanel } from '../components/ErrorPanel'
import { ObjectCard } from '../components/ObjectCard'
import { ResultViewer, type ViewMode } from '../components/ResultViewer'
import { CategoryBadge, ConfirmDialog, EmptyState, Page, PageHeader, Spinner, Toggle } from '../components/ui'
import { useDebounce } from '../hooks/useDebounce'
import { ApiError, api, assetUrl } from '../services/api'
import { CATEGORY_META, CATEGORY_ORDER, categoryMeta } from '../services/categories'
import { fmtDateTime, fmtMs, fmtPercent } from '../services/format'
import type { CategoryId, HistoryItem, HistoryList } from '../services/types'

const PAGE_SIZE = 12

function Detail({ item, onClose, onDelete }: { item: HistoryItem; onClose: () => void; onDelete: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<ViewMode>('result')
  const [boxes, setBoxes] = useState(true)
  const [masks, setMasks] = useState(true)
  const selected = item.detected_objects.find((o) => o.id === selectedId) ?? null
  const hasMasks = item.detected_objects.some((o) => o.polygons && o.polygons.length > 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className="flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-surface shadow-lift"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <h2 id="detail-title" className="truncate text-lg font-semibold">{item.original_filename ?? `Ảnh #${item.id}`}</h2>
            <p className="text-sm text-slate-600">{fmtDateTime(item.created_at)} · {item.object_count} vật thể</p>
          </div>
          <div className="flex gap-1">
            <button type="button" className="btn-danger px-3" onClick={onDelete} aria-label="Xóa bản ghi này"><Trash2 size={18} /></button>
            <button type="button" className="btn-ghost px-3" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {(['result', 'original', 'compare'] as ViewMode[]).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
                className={`min-h-[40px] rounded-lg px-3 text-sm font-semibold ${mode === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                {m === 'result' ? 'Kết quả' : m === 'original' ? 'Ảnh gốc' : 'So sánh'}
              </button>
            ))}
            <Toggle checked={boxes} onChange={setBoxes} label="Box" />
            <Toggle checked={masks} onChange={setMasks} label="Mask" disabled={!hasMasks} />
          </div>
          {item.image_url ? (
            <ResultViewer src={assetUrl(item.image_url)} width={item.width} height={item.height} objects={item.detected_objects}
              selectedId={selectedId} onSelect={setSelectedId} showBoxes={boxes} showMasks={masks && hasMasks} mode={mode} zoom={1} />
          ) : (
            <p className="text-sm text-slate-600">Không còn ảnh gốc.</p>
          )}
          <p className="font-mono text-xs text-slate-500">
            {item.model_info.yolo}{item.model_info.sam ? ` + ${item.model_info.sam}` : ''} · {item.model_info.device} · YOLO {fmtMs(item.timings.detect_ms)}
            {item.timings.segment_ms != null ? ` · SAM ${fmtMs(item.timings.segment_ms)}` : ' · không phân đoạn'}
          </p>
          {selected ? (
            <ObjectCard obj={selected} selected />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.detected_objects.map((o, i) => <ObjectCard key={o.id} obj={o} index={i} onSelect={() => setSelectedId(o.id)} />)}
            </div>
          )}
          {selected && <button type="button" className="btn-secondary self-start" onClick={() => setSelectedId(null)}>Xem tất cả vật thể</button>}
        </div>
      </motion.aside>
    </motion.div>
  )
}

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<HistoryList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [detail, setDetail] = useState<HistoryItem | null>(null)
  const [toDelete, setToDelete] = useState<HistoryItem | 'all' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const q = useDebounce(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.history({ search: q, category, date_from: dateFrom, date_to: dateTo, page, page_size: PAGE_SIZE }))
      setError(null)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [q, category, dateFrom, dateTo, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [q, category, dateFrom, dateTo])

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      if (toDelete === 'all') await api.clearHistory()
      else await api.deleteHistory(toDelete.id)
      if (toDelete !== 'all' && detail?.id === toDelete.id) setDetail(null)
      if (toDelete === 'all') setDetail(null)
      setToDelete(null)
      await load()
    } catch (err) {
      setError(err as ApiError)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const filtered = !!(q || category || dateFrom || dateTo)

  return (
    <Page>
      <PageHeader
        eyebrow="History"
        title="Lịch sử nhận diện"
        description="Ảnh đã phân tích, vật thể, nhóm rác, độ tin cậy và kết quả phân đoạn được lưu tại máy chủ của bạn."
        actions={data && data.total > 0 && !filtered ? (
          <button type="button" className="btn-danger" onClick={() => setToDelete('all')}><Trash2 size={18} aria-hidden="true" /> Xóa toàn bộ</button>
        ) : undefined}
      />

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="label">Tìm kiếm</span>
          <span className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input className="input pl-10" placeholder="Tên vật thể hoặc tên file…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Nhóm rác</span>
          <select className="input w-auto min-w-[170px]" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | '')}>
            <option value="">Tất cả nhóm</option>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_META[c].name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Từ ngày</span>
          <input type="date" className="input w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Đến ngày</span>
          <input type="date" className="input w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {filtered && (
          <button type="button" className="btn-ghost" onClick={() => { setSearch(''); setCategory(''); setDateFrom(''); setDateTo('') }}>
            <X size={18} aria-hidden="true" /> Bỏ lọc
          </button>
        )}
      </div>

      {error && <ErrorPanel error={error} onRetry={load} />}

      {loading && !data && <div className="card flex items-center justify-center gap-2 p-12 text-slate-600"><Spinner /> Đang tải lịch sử…</div>}

      {data && data.items.length === 0 && (
        <div className="card">
          <EmptyState icon={<HistoryIcon size={26} />} title={filtered ? 'Không có kết quả phù hợp' : 'Chưa có lịch sử'}
            action={!filtered ? <Link to="/detect" className="btn-primary">Phân loại ảnh</Link> : undefined}>
            {filtered ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.' : 'Mỗi lần phân tích ảnh, kết quả sẽ được lưu ở đây.'}
          </EmptyState>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-sm text-slate-600">{data.total} bản ghi{loading && <Spinner size={14} className="ml-2 inline" />}</p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((item) => {
              const counts = new Map<string, number>()
              item.detected_objects.forEach((o) => counts.set(o.category, (counts.get(o.category) ?? 0) + 1))
              const names = [...new Set(item.detected_objects.map((o) => o.name))]
              return (
                <motion.li key={item.id} layout className="card flex flex-col overflow-hidden">
                  <button type="button" onClick={() => setDetail(item)} className="group relative block aspect-[4/3] bg-slate-100 text-left" aria-label={`Xem chi tiết ${item.original_filename ?? `ảnh #${item.id}`}`}>
                    {item.image_url && <img src={assetUrl(item.image_url)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />}
                    <span className="absolute left-3 top-3 chip bg-white/90 text-slate-800">
                      {item.source === 'camera' ? <Camera size={13} aria-hidden="true" /> : <Upload size={13} aria-hidden="true" />}
                      {item.source === 'camera' ? 'Camera' : 'Tải lên'}
                    </span>
                    <span className="absolute bottom-3 right-3 chip bg-slate-900/80 text-white">{item.object_count} vật thể</span>
                  </button>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.original_filename ?? `Ảnh #${item.id}`}</p>
                        <p className="text-sm text-slate-600">{fmtDateTime(item.created_at)}</p>
                      </div>
                      {item.confidence != null && <span className="shrink-0 font-mono text-sm text-slate-700">{fmtPercent(item.confidence)}</span>}
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-700">{names.length ? names.join(', ') : 'Không phát hiện vật thể'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...counts.entries()].map(([c, n]) => (
                        <span key={c} className="chip" style={{ background: categoryMeta(c).soft, color: categoryMeta(c).ink }}>{categoryMeta(c).short} · {n}</span>
                      ))}
                      {item.detected_objects.some((o) => o.polygons?.length) && <span className="chip bg-slate-100 text-slate-700">Có mask SAM</span>}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      {item.category ? <CategoryBadge category={item.category} /> : <span />}
                      <div className="flex gap-1">
                        <button type="button" className="btn-ghost min-h-[40px] px-3" onClick={() => setDetail(item)} aria-label="Xem chi tiết"><Eye size={18} /></button>
                        <button type="button" className="btn-ghost min-h-[40px] px-3 text-red-700 hover:bg-red-50" onClick={() => setToDelete(item)} aria-label="Xóa"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
          {pages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="Phân trang">
              <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
              <span className="px-2 text-sm text-slate-700">Trang {page} / {pages}</span>
              <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Sau</button>
            </nav>
          )}
        </>
      )}

      <AnimatePresence>
        {detail && <Detail item={detail} onClose={() => setDetail(null)} onDelete={() => setToDelete(detail)} />}
      </AnimatePresence>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete === 'all' ? 'Xóa toàn bộ lịch sử?' : 'Xóa bản ghi này?'}
        confirmLabel={toDelete === 'all' ? 'Xóa toàn bộ' : 'Xóa'}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      >
        {toDelete === 'all'
          ? 'Mọi ảnh và kết quả đã lưu sẽ bị xóa vĩnh viễn, số liệu thống kê cũng được đặt lại. Không thể hoàn tác.'
          : 'Ảnh và kết quả nhận diện sẽ bị xóa vĩnh viễn, số liệu thống kê được trừ tương ứng. Không thể hoàn tác.'}
      </ConfirmDialog>
    </Page>
  )
}
