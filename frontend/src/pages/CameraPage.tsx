import { Aperture, Camera, CameraOff, Pause, Play, Video } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorPanel } from '../components/ErrorPanel'
import { DetectionOverlay } from '../components/ResultViewer'
import { CategoryBadge, EmptyState, Page, PageHeader, Spinner, Toggle } from '../components/ui'
import { setPendingImage } from '../hooks/pendingImage'
import { useWebcam } from '../hooks/useWebcam'
import { ApiError, api } from '../services/api'
import { categoryMeta } from '../services/categories'
import type { DetectedObject, Polygon } from '../services/types'

interface Frame {
  objects: DetectedObject[]
  width: number
  height: number
}

const iou = (a: number[], b: number[]) => {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1])
  const x2 = Math.min(a[2], b[2]), y2 = Math.min(a[3], b[3])
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
  return ua > 0 ? inter / ua : 0
}

/** Theo dõi vật thể đã chọn giữa các khung hình: cùng nhãn và chồng lấn lớn nhất. */
function matchTrack(track: { label: string; bbox: number[] }, objects: DetectedObject[]) {
  let best: DetectedObject | null = null
  let bestScore = 0
  for (const o of objects) {
    const s = iou(track.bbox, o.bbox) + (o.label === track.label ? 0.25 : 0)
    if (s > bestScore) { bestScore = s; best = o }
  }
  return bestScore >= 0.4 ? best : null
}

export default function CameraPage() {
  const cam = useWebcam()
  const { capture } = cam
  const navigate = useNavigate()

  const [detecting, setDetecting] = useState(false)
  const [frame, setFrame] = useState<Frame | null>(null)
  const [mask, setMask] = useState<{ id: number; polygons: Polygon[] } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState<{ yolo?: number; sam?: number; total?: number }>({})

  const [targetFps, setTargetFps] = useState(6)
  const [sendSide, setSendSide] = useState(640)
  const [samOn, setSamOn] = useState(true)
  const [showBoxes, setShowBoxes] = useState(true)
  const [showMasks, setShowMasks] = useState(true)
  const [capturing, setCapturing] = useState(false)

  const runningRef = useRef(false)
  const timerRef = useRef<number>()
  const abortRef = useRef<AbortController | null>(null)
  const trackRef = useRef<{ label: string; bbox: number[] } | null>(null)
  const optsRef = useRef({ targetFps, sendSide, samOn })
  optsRef.current = { targetFps, sendSide, samOn }

  const stopDetect = useCallback(() => {
    runningRef.current = false
    window.clearTimeout(timerRef.current)
    abortRef.current?.abort()
    setDetecting(false)
  }, [])

  const loop = useCallback(async () => {
    if (!runningRef.current) return
    const { targetFps, sendSide, samOn } = optsRef.current
    const t0 = performance.now()
    const blob = await capture(sendSide, 0.7)
    if (blob && runningRef.current) {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        // Chỉ một request tại một thời điểm: khung mới chỉ được gửi khi khung cũ đã xong -> không dồn hàng đợi, không trễ.
        const det = await api.detect(blob, ctrl.signal)
        if (!runningRef.current) return
        setFrame({ objects: det.objects, width: det.width, height: det.height })
        let samMs: number | undefined
        const track = trackRef.current
        if (track) {
          const m = matchTrack(track, det.objects)
          if (m) {
            trackRef.current = { label: m.label, bbox: m.bbox }
            setSelectedId(m.id)
            if (samOn) {
              const seg = await api.segment(det.image_id, [m.bbox], ctrl.signal)
              samMs = seg.timings.segment_ms
              if (runningRef.current) setMask({ id: m.id, polygons: seg.masks[0]?.polygons ?? [] })
            } else setMask(null)
          } else {
            setSelectedId(null)
            setMask(null)
          }
        }
        const total = performance.now() - t0
        setLatency({ yolo: det.timings.detect_ms, sam: samMs, total })
        setFps((prev) => (prev ? prev * 0.7 + (1000 / Math.max(total, 1000 / targetFps)) * 0.3 : 1000 / Math.max(total, 1000 / targetFps)))
        setError(null)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const apiErr = err instanceof ApiError ? err : new ApiError(500, { code: 'UNKNOWN', message: String(err) })
        // Lỗi model (thiếu weights SAM) khi đang phân đoạn: tắt SAM, vẫn chạy YOLO.
        if (apiErr.isModelError && apiErr.body.model === 'sam') {
          setSamOn(false)
          setError(apiErr)
        } else {
          setError(apiErr)
          stopDetect()
          return
        }
      }
    }
    const elapsed = performance.now() - t0
    timerRef.current = window.setTimeout(loop, Math.max(0, 1000 / targetFps - elapsed))
  }, [capture, stopDetect])

  const startDetect = () => {
    if (cam.state !== 'live') return
    runningRef.current = true
    setDetecting(true)
    setError(null)
    loop()
  }

  useEffect(() => () => stopDetect(), [stopDetect])

  const select = (id: number | null) => {
    const o = frame?.objects.find((x) => x.id === id)
    trackRef.current = o ? { label: o.label, bbox: o.bbox } : null
    setSelectedId(o ? o.id : null)
    setMask(null)
  }

  const captureAndAnalyze = async () => {
    setCapturing(true)
    const blob = await cam.capture(1920, 0.92)
    setCapturing(false)
    if (!blob) return
    stopDetect()
    setPendingImage(new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' }))
    navigate('/detect')
  }

  const overlayObjects = useMemo(
    () => (frame?.objects ?? []).map((o) => (mask && o.id === mask.id ? { ...o, polygons: mask.polygons } : { ...o, polygons: null })),
    [frame, mask],
  )

  const live = cam.state === 'live'
  const video = cam.videoRef.current
  const aspect = video?.videoWidth ? `${video.videoWidth} / ${video.videoHeight}` : '16 / 9'

  return (
    <Page>
      <PageHeader
        eyebrow="Real-time"
        title="Camera AI"
        description="YOLO nhận diện theo từng khung hình. Chọn một vật thể trên video để SAM phân đoạn riêng nó, giúp luồng chạy mượt."
      />

      {error && <ErrorPanel error={error} onRetry={live ? startDetect : undefined} />}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="card flex flex-col gap-4 p-4 sm:p-5 lg:col-span-8" aria-label="Video trực tiếp">
          <div className="relative overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: aspect }}>
            <video ref={cam.videoRef} className="absolute inset-0 h-full w-full object-fill" playsInline muted />
            {live && frame && (
              <DetectionOverlay
                width={frame.width}
                height={frame.height}
                objects={overlayObjects}
                selectedId={selectedId}
                onSelect={select}
                showBoxes={showBoxes}
                showMasks={showMasks}
              />
            )}
            {!live && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
                {cam.state === 'starting' ? (
                  <><Spinner size={28} /> Đang mở camera…</>
                ) : cam.state === 'error' ? (
                  <><CameraOff size={32} aria-hidden="true" /><p className="max-w-md text-sm">{cam.error}</p></>
                ) : (
                  <><Video size={32} aria-hidden="true" /><p className="text-sm">Camera đang tắt. Nhấn “Bật camera” để bắt đầu.</p></>
                )}
              </div>
            )}
            {live && (
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                <span className={`chip ${detecting ? 'bg-red-700 text-white' : 'bg-slate-900/75 text-white'}`}>
                  <span className={`h-2 w-2 rounded-full ${detecting ? 'animate-pulse bg-white' : 'bg-slate-400'}`} />
                  {detecting ? 'Đang nhận diện' : 'Tạm dừng'}
                </span>
                {detecting && (
                  <span className="chip bg-slate-900/75 font-mono text-white">
                    {fps.toFixed(1)} FPS · YOLO {Math.round(latency.yolo ?? 0)} ms{latency.sam != null ? ` · SAM ${Math.round(latency.sam)} ms` : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!live ? (
              <button type="button" className="btn-primary" onClick={() => cam.start()} disabled={cam.state === 'starting'}>
                <Camera size={18} aria-hidden="true" /> Bật camera
              </button>
            ) : detecting ? (
              <button type="button" className="btn-secondary" onClick={stopDetect}>
                <Pause size={18} aria-hidden="true" /> Dừng nhận diện
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={startDetect}>
                <Play size={18} aria-hidden="true" /> Bắt đầu nhận diện
              </button>
            )}
            {live && (
              <>
                <button type="button" className="btn-secondary" onClick={captureAndAnalyze} disabled={capturing}>
                  <Aperture size={18} aria-hidden="true" /> Chụp &amp; phân tích đầy đủ
                </button>
                <button type="button" className="btn-ghost" onClick={() => { stopDetect(); cam.stop(); setFrame(null) }}>
                  <CameraOff size={18} aria-hidden="true" /> Tắt camera
                </button>
              </>
            )}
            <div className="ml-auto flex flex-wrap">
              <Toggle checked={showBoxes} onChange={setShowBoxes} label="Box" />
              <Toggle checked={showMasks} onChange={setShowMasks} label="Mask" />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className="card flex flex-col gap-4 p-5">
            <h2 className="text-lg font-semibold">Cấu hình luồng</h2>
            {cam.devices.length > 1 && (
              <label className="flex flex-col gap-1.5">
                <span className="label">Camera</span>
                <select className="input" value={cam.deviceId} onChange={(e) => { cam.setDeviceId(e.target.value); cam.start(e.target.value) }}>
                  {cam.devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="label">Tần suất gửi khung hình tối đa</span>
              <select className="input" value={targetFps} onChange={(e) => setTargetFps(Number(e.target.value))}>
                {[2, 4, 6, 10, 15].map((v) => <option key={v} value={v}>{v} khung/giây</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Kích thước khung gửi lên</span>
              <select className="input" value={sendSide} onChange={(e) => setSendSide(Number(e.target.value))}>
                <option value={480}>480 px – nhanh (CPU)</option>
                <option value={640}>640 px – cân bằng</option>
                <option value={960}>960 px – chi tiết (GPU)</option>
              </select>
            </label>
            <div>
              <Toggle checked={samOn} onChange={setSamOn} label="SAM phân đoạn vật thể được chọn" />
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                SAM chỉ chạy cho vật thể bạn chọn trên video thay vì mọi vật thể. Khung hình được gửi tuần tự: khung mới chỉ gửi khi khung trước đã có kết quả, nên video không bị trễ dồn.
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold">Trong khung hình ({frame?.objects.length ?? 0})</h2>
            {!frame || frame.objects.length === 0 ? (
              <EmptyState icon={<Video size={24} />} title={detecting ? 'Chưa thấy vật thể' : 'Chưa nhận diện'}>
                {detecting ? 'Đưa vật thể rác vào giữa khung hình, đủ ánh sáng.' : 'Bật camera và bấm “Bắt đầu nhận diện”.'}
              </EmptyState>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {frame.objects.map((o) => {
                  const meta = categoryMeta(o.category)
                  const active = o.id === selectedId
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => select(active ? null : o.id)}
                        className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left hover:bg-slate-50"
                        style={{ borderColor: active ? meta.color : '#E2E8F0', background: active ? meta.soft : undefined }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900">{o.name}</span>
                          <CategoryBadge category={o.category} />
                        </span>
                        <span className="font-mono text-sm text-slate-700">{(o.confidence * 100).toFixed(1)}%</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </Page>
  )
}
