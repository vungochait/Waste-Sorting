import { motion } from 'framer-motion'
import { Camera, Columns2, Image as ImageIcon, Minus, Plus, RefreshCw, ScanSearch, Upload, Video, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorPanel } from '../components/ErrorPanel'
import { ObjectCard } from '../components/ObjectCard'
import { ResultViewer, type ViewMode } from '../components/ResultViewer'
import { StageProgress, initialStages, type StageState } from '../components/StageProgress'
import { CategoryBadge, EmptyState, Page, PageHeader, Toggle } from '../components/ui'
import { WebcamCaptureDialog } from '../components/WebcamCaptureDialog'
import { takePendingImage } from '../hooks/pendingImage'
import { useSystemStatus } from '../hooks/useSystemStatus'
import { ApiError, api } from '../services/api'
import { categoryMeta } from '../services/categories'
import { fmtBytes, fmtMs } from '../services/format'
import type { AnalyzeResult, DetectedObject, StageName } from '../services/types'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'webp']

type Phase = 'idle' | 'running' | 'done' | 'error'

export default function DetectPage() {
  const { status } = useSystemStatus()
  const maxMb = status?.config.max_upload_mb ?? 10

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [stages, setStages] = useState<Record<StageName, StageState>>(initialStages)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [partial, setPartial] = useState<DetectedObject[]>([])
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [webcamOpen, setWebcamOpen] = useState(false)

  const [mode, setMode] = useState<ViewMode>('result')
  const [showBoxes, setShowBoxes] = useState(true)
  const [showMasks, setShowMasks] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const objects = result?.objects ?? partial

  const run = useCallback(async (f: File) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPhase('running')
    setError(null)
    setResult(null)
    setPartial([])
    setSelectedId(null)
    setStages({ ...initialStages(), upload: { status: 'running' } })
    try {
      const res = await api.analyzeStream(
        f,
        (e) => {
          if (e.type === 'stage') {
            setStages((s) => ({ ...s, [e.stage]: { status: e.status, ms: e.ms, note: e.count != null ? `${e.count} vật thể` : e.reason } }))
            if (e.stage === 'upload' && e.width && e.height) setDims({ width: e.width, height: e.height })
          } else if (e.type === 'detections') {
            setPartial(e.objects)
          }
        },
        { signal: ctrl.signal, source: 'upload' },
      )
      setResult(res)
      setDims({ width: res.width, height: res.height })
      setPhase('done')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStages((s) => {
        const next = { ...s }
        ;(Object.keys(next) as StageName[]).forEach((k) => {
          if (next[k].status === 'running') next[k] = { status: 'error' }
        })
        return next
      })
      setError(err as Error)
      setPhase('error')
    }
  }, [])

  const accept = useCallback(
    (f: File | null | undefined) => {
      if (!f) return
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ACCEPT.includes(f.type) && !ACCEPT_EXT.includes(ext)) {
        setError(new ApiError(415, { code: 'UNSUPPORTED_IMAGE_TYPE', message: 'Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.' }))
        setPhase('error')
        return
      }
      if (f.size > maxMb * 1024 * 1024) {
        setError(new ApiError(413, { code: 'IMAGE_TOO_LARGE', message: `Ảnh ${fmtBytes(f.size)} vượt giới hạn ${maxMb} MB.` }))
        setPhase('error')
        return
      }
      setFile(f)
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(f)
      })
      setDims(null)
      setZoom(1)
      setMode('result')
      run(f)
    },
    [maxMb, run],
  )

  const clear = () => {
    abortRef.current?.abort()
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setPartial([])
    setError(null)
    setPhase('idle')
    setStages(initialStages())
    setDims(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Ảnh chụp chuyển từ trang Camera (setTimeout để an toàn với StrictMode mount-unmount-mount).
  useEffect(() => {
    const t = window.setTimeout(() => {
      const pending = takePendingImage()
      if (pending) accept(pending)
    }, 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => () => abortRef.current?.abort(), [])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    accept(e.dataTransfer.files?.[0])
  }

  const summary = useMemo(() => {
    const counts = new Map<string, number>()
    objects.forEach((o) => counts.set(o.category, (counts.get(o.category) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [objects])

  const selected = objects.find((o) => o.id === selectedId) ?? null
  const hasImage = !!preview

  return (
    <Page>
      <PageHeader
        eyebrow="AI Detection"
        title="Phân loại rác AI"
        description="Tải ảnh lên để YOLO phát hiện từng vật thể rác và SAM tách chúng khỏi nền. Kết quả kèm nhóm rác, độ tin cậy và hướng dẫn xử lý."
      />

      {/* Khu vực đầu vào */}
      <section className="card p-4 sm:p-5" aria-label="Ảnh đầu vào">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="sr-only"
          id="file-input"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
            <Upload size={18} aria-hidden="true" /> {hasImage ? 'Chọn ảnh mới' : 'Tải ảnh lên'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setWebcamOpen(true)}>
            <Camera size={18} aria-hidden="true" /> Chụp từ webcam
          </button>
          <Link to="/camera" className="btn-secondary">
            <Video size={18} aria-hidden="true" /> Nhận diện trực tiếp
          </Link>
          {hasImage && (
            <>
              <button type="button" className="btn-ghost" onClick={() => file && run(file)} disabled={phase === 'running'}>
                <RefreshCw size={18} aria-hidden="true" /> Phân tích lại
              </button>
              <button type="button" className="btn-ghost" onClick={clear}>
                <X size={18} aria-hidden="true" /> Xóa ảnh
              </button>
            </>
          )}
          <span className="ml-auto text-sm text-slate-600">
            {file ? (
              <span className="font-mono text-xs">{file.name} · {fmtBytes(file.size)}{dims ? ` · ${dims.width}×${dims.height}` : ''}</span>
            ) : (
              <>JPG, JPEG, PNG, WEBP · tối đa {maxMb} MB</>
            )}
          </span>
        </div>

        {!hasImage && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
              dragOver ? 'border-eco-600 bg-eco-50' : 'border-slate-300 bg-surface'
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-eco-700 shadow-card">
              <ImageIcon size={26} aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-slate-900">Kéo thả ảnh vào đây</p>
            <p className="max-w-md text-[15px] text-slate-600">
              hoặc <label htmlFor="file-input" className="cursor-pointer font-semibold text-eco-700 underline underline-offset-2">chọn ảnh từ máy</label>.
              Ảnh rõ nét, đủ sáng, vật thể không bị che khuất cho kết quả tốt nhất.
            </p>
          </div>
        )}

        {phase !== 'idle' && (
          <div className="mt-4">
            <StageProgress stages={stages} />
          </div>
        )}
      </section>

      {error && <ErrorPanel error={error} onRetry={file ? () => run(file) : undefined} />}

      {hasImage && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Khu vực hiển thị kết quả */}
          <section className="card flex flex-col gap-4 p-4 sm:p-5 lg:col-span-8" aria-label="Kết quả trên ảnh">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-surface p-1" role="group" aria-label="Chế độ xem">
                {([
                  ['result', 'Kết quả', ScanSearch],
                  ['original', 'Ảnh gốc', ImageIcon],
                  ['compare', 'So sánh', Columns2],
                ] as const).map(([m, label, Icon]) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                      mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
              <Toggle checked={showBoxes} onChange={setShowBoxes} label="Bounding Box" />
              <Toggle checked={showMasks} onChange={setShowMasks} label="Mask" disabled={!result?.segmented} />
              <div className="ml-auto inline-flex items-center gap-1" role="group" aria-label="Phóng to">
                <button type="button" className="btn-ghost px-2.5" aria-label="Thu nhỏ" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1}>
                  <Minus size={18} />
                </button>
                <button type="button" className="min-h-[40px] w-14 rounded-lg font-mono text-sm text-slate-700 hover:bg-slate-100" onClick={() => setZoom(1)} aria-label="Đặt lại thu phóng">
                  {Math.round(zoom * 100)}%
                </button>
                <button type="button" className="btn-ghost px-2.5" aria-label="Phóng to" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} disabled={zoom >= 4}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {dims ? (
              <ResultViewer
                src={preview!}
                width={dims.width}
                height={dims.height}
                objects={objects}
                selectedId={selectedId}
                onSelect={setSelectedId}
                showBoxes={showBoxes}
                showMasks={showMasks && !!result?.segmented}
                mode={mode}
                zoom={zoom}
              />
            ) : (
              <img src={preview!} alt="Ảnh đã chọn" className="max-h-[72vh] w-full rounded-xl object-contain opacity-70" />
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span><strong className="text-slate-900">{objects.length}</strong> vật thể</span>
              {result && (
                <>
                  <span className="font-mono text-xs">YOLO {fmtMs(result.timings.detect_ms)}</span>
                  {result.segmented && <span className="font-mono text-xs">SAM {fmtMs(result.timings.segment_ms)}</span>}
                  <span className="font-mono text-xs">{result.model.yolo}{result.model.sam ? ` + ${result.model.sam}` : ''} · {result.model.device}</span>
                </>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4 lg:col-span-4" aria-label="Danh sách vật thể">
            <div className="card p-5">
              <h2 className="text-lg font-semibold">Vật thể phát hiện ({objects.length})</h2>
              {summary.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.map(([c, n]) => (
                    <span key={c} className="chip" style={{ background: categoryMeta(c).soft, color: categoryMeta(c).ink }}>
                      {categoryMeta(c).short} · {n}
                    </span>
                  ))}
                </div>
              )}
              {phase === 'running' && objects.length === 0 && <p className="mt-3 text-sm text-slate-600">AI đang xử lý ảnh…</p>}
              {phase === 'done' && objects.length === 0 && (
                <EmptyState icon={<ScanSearch size={26} />} title="Không tìm thấy vật thể rác">
                  {result?.message}
                </EmptyState>
              )}
              <ul className="mt-4 flex flex-col gap-2">
                {objects.map((o) => {
                  const meta = categoryMeta(o.category)
                  const active = o.id === selectedId
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(active ? null : o.id)}
                        aria-pressed={active}
                        className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        style={{ borderColor: active ? meta.color : '#E2E8F0', background: active ? meta.soft : undefined }}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-slate-900">{o.name}</span>
                          <span className="block truncate text-xs" style={{ color: meta.ink }}>{meta.name}</span>
                        </span>
                        <span className="font-mono text-sm text-slate-700">{(o.confidence * 100).toFixed(1)}%</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <ObjectCard obj={selected} selected />
              </motion.div>
            )}
            {!selected && objects.length > 0 && (
              <p className="px-1 text-sm text-slate-600">Chọn một vật thể trên ảnh hoặc trong danh sách để xem chi tiết.</p>
            )}
          </aside>
        </div>
      )}

      {/* Khu vực kết quả phân loại */}
      {result && result.objects.length > 0 && (
        <section aria-labelledby="cards-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="cards-title" className="text-xl font-semibold">Kết quả phân loại</h2>
            <div className="flex flex-wrap gap-2">
              {result.summary.map((s) => <CategoryBadge key={s.category} category={s.category} />)}
              {result.history_id && (
                <Link to="/history" className="chip bg-slate-100 text-slate-700 hover:bg-slate-200">Đã lưu vào lịch sử #{result.history_id}</Link>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.objects.map((o, i) => (
              <ObjectCard key={o.id} obj={o} index={i} selected={o.id === selectedId} onSelect={() => { setSelectedId(o.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            ))}
          </div>
        </section>
      )}

      <WebcamCaptureDialog open={webcamOpen} onClose={() => setWebcamOpen(false)} onCapture={accept} />
    </Page>
  )
}
