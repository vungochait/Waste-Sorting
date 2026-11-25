import { CheckCircle2, Cpu, RefreshCw, RotateCcw, Save, Server } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ErrorPanel } from '../components/ErrorPanel'
import { Page, PageHeader, Spinner, Toggle } from '../components/ui'
import { useSystemStatus } from '../hooks/useSystemStatus'
import { ApiError, api } from '../services/api'
import type { ModelSlotStatus, RuntimeSettings } from '../services/types'

const STATE_TEXT: Record<ModelSlotStatus['state'], { text: string; cls: string }> = {
  ready: { text: 'Sẵn sàng', cls: 'bg-eco-100 text-eco-900' },
  loading: { text: 'Đang nạp…', cls: 'bg-sky-100 text-sky-700' },
  not_loaded: { text: 'Đang nạp…', cls: 'bg-sky-100 text-sky-700' },
  error: { text: 'Chưa sẵn sàng', cls: 'bg-amber-100 text-amber-900' },
  disabled: { text: 'Đang tắt', cls: 'bg-slate-100 text-slate-700' },
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-2.5 last:border-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="min-w-0 break-all text-right font-mono text-[13px] text-slate-900">{children}</dd>
    </div>
  )
}

function ModelCard({ title, subtitle, slot, extra }: { title: string; subtitle: string; slot: ModelSlotStatus; extra?: ReactNode }) {
  const st = STATE_TEXT[slot.state]
  const classes = slot.classes ? Object.values(slot.classes) : []
  return (
    <section className="card flex flex-col gap-4 p-5" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <span className={`chip ${st.cls}`}>{slot.state === 'ready' && <CheckCircle2 size={14} aria-hidden="true" />}{st.text}</span>
      </div>
      <dl>
        <Row label="Weights">backend/{slot.weights}</Row>
        <Row label="File tồn tại">{slot.weights_exists ? 'có' : 'không'}</Row>
        {slot.backend && <Row label="Backend">{slot.backend}</Row>}
        {slot.task && <Row label="Task">{slot.task}</Row>}
        {classes.length > 0 && <Row label="Số lớp">{classes.length}</Row>}
      </dl>
      {classes.length > 0 && (
        <details className="rounded-xl bg-surface p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Danh sách lớp của model</summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {classes.map((c) => <li key={c} className="chip bg-white font-mono font-medium text-slate-700">{c}</li>)}
          </ul>
        </details>
      )}
      {slot.error && slot.state === 'error' && <ErrorPanel error={new ApiError(503, slot.error)} />}
      {extra}
    </section>
  )
}

export default function SettingsPage() {
  const { status, error, refresh } = useSystemStatus()
  const [form, setForm] = useState<RuntimeSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [actionError, setActionError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (status && !form) setForm(status.runtime)
  }, [status, form])

  const save = async () => {
    if (!form) return
    setSaving(true)
    setActionError(null)
    try {
      setForm(await api.updateSettings(form))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
      refresh()
    } catch (err) {
      setActionError(err as ApiError)
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    try {
      setForm(await api.resetSettings())
      refresh()
    } catch (err) {
      setActionError(err as ApiError)
    }
  }

  const reload = async () => {
    setReloading(true)
    try {
      await api.reloadModels()
      window.setTimeout(() => { refresh(); setReloading(false) }, 1500)
    } catch (err) {
      setActionError(err as ApiError)
      setReloading(false)
    }
  }

  const dev = status?.models.device

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="Cài đặt & Model AI"
        description="Trạng thái YOLO, SAM, thiết bị chạy inference và các ngưỡng nhận diện."
        actions={
          <button type="button" className="btn-secondary" onClick={reload} disabled={reloading || !status}>
            {reloading ? <Spinner /> : <RefreshCw size={18} aria-hidden="true" />} Tải lại model
          </button>
        }
      />

      {error && !status && <ErrorPanel error={error} onRetry={refresh} />}
      {actionError && <ErrorPanel error={actionError} />}

      {status && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-5" aria-label="Backend">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Server size={20} aria-hidden="true" /> Backend</h2>
              <dl className="mt-2">
                <Row label="Ứng dụng">{status.app.name} v{status.app.version}</Row>
                <Row label="Giới hạn upload">{status.config.max_upload_mb} MB</Row>
                <Row label="Định dạng">{status.config.allowed_extensions.join(', ').toUpperCase()}</Row>
                <Row label="Cạnh ảnh tối đa">{status.config.max_image_side} px</Row>
                <Row label="Lưu lịch sử">{status.config.save_history ? 'bật' : 'tắt'}</Row>
                <Row label="Class map">backend/{status.config.class_map}</Row>
              </dl>
            </section>
            <section className="card p-5" aria-label="Thiết bị">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Cpu size={20} aria-hidden="true" /> Thiết bị inference</h2>
              <dl className="mt-2">
                <Row label="Đang dùng">{dev?.device}</Row>
                <Row label="Cấu hình DEVICE">{status.config.device_preference}</Row>
                <Row label="PyTorch">{dev?.torch_installed ? dev.torch_version : 'chưa cài'}</Row>
                <Row label="CUDA">{dev?.cuda_available ? `có (CUDA ${dev.cuda_version})` : 'không – chạy CPU'}</Row>
                {dev?.gpu_name && <Row label="GPU">{dev.gpu_name}</Row>}
                <Row label="FP16 (half)">{status.config.half_precision && dev?.cuda_available ? 'bật' : 'tắt'}</Row>
              </dl>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ModelCard title="YOLO · Object Detection" subtitle="Phát hiện vật thể, bounding box, nhãn, độ tin cậy" slot={status.models.yolo} />
            <ModelCard title="SAM · Segment Anything" subtitle="Phân đoạn từng vật thể từ box của YOLO" slot={status.models.sam} />
          </div>

          {form && (
            <section className="card flex flex-col gap-5 p-5" aria-labelledby="inf-title">
              <div>
                <h2 id="inf-title" className="text-lg font-semibold">Tham số nhận diện</h2>
                <p className="text-sm text-slate-600">Áp dụng ngay cho các lần phân tích tiếp theo; lưu tại backend/runtime_settings.json.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="flex justify-between"><span className="label">Ngưỡng confidence</span><span className="font-mono text-sm">{form.yolo_conf.toFixed(2)}</span></span>
                  <input type="range" min={0.05} max={0.95} step={0.01} value={form.yolo_conf} onChange={(e) => setForm({ ...form, yolo_conf: Number(e.target.value) })} className="accent-eco-700" />
                  <span className="text-xs text-slate-600">Thấp hơn: phát hiện nhiều hơn nhưng dễ nhầm. Cao hơn: ít nhưng chắc chắn hơn.</span>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="flex justify-between"><span className="label">Ngưỡng IoU (NMS)</span><span className="font-mono text-sm">{form.yolo_iou.toFixed(2)}</span></span>
                  <input type="range" min={0.1} max={0.9} step={0.01} value={form.yolo_iou} onChange={(e) => setForm({ ...form, yolo_iou: Number(e.target.value) })} className="accent-eco-700" />
                  <span className="text-xs text-slate-600">Điều chỉnh việc gộp các box chồng lên nhau.</span>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="label">Kích thước ảnh YOLO (imgsz)</span>
                  <select className="input" value={form.yolo_imgsz} onChange={(e) => setForm({ ...form, yolo_imgsz: Number(e.target.value) })}>
                    {[320, 480, 640, 800, 960, 1280].map((v) => <option key={v} value={v}>{v} px{v === 640 ? ' (mặc định)' : ''}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="label">Số vật thể tối đa / ảnh</span>
                  <input type="number" min={1} max={300} className="input" value={form.yolo_max_det} onChange={(e) => setForm({ ...form, yolo_max_det: Math.max(1, Math.min(300, Number(e.target.value) || 1)) })} />
                </label>
              </div>
              <div>
                <Toggle checked={form.sam_enabled} onChange={(v) => setForm({ ...form, sam_enabled: v })} label="Bật phân đoạn SAM" />
                <p className="mt-1 text-xs text-slate-600">Tắt SAM nếu máy yếu: chỉ còn bounding box, không có mask và diện tích.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={save} disabled={saving}>
                  {saving ? <Spinner /> : <Save size={18} aria-hidden="true" />} Lưu cấu hình
                </button>
                <button type="button" className="btn-ghost" onClick={reset}><RotateCcw size={18} aria-hidden="true" /> Khôi phục mặc định (.env)</button>
                {saved && <span className="self-center text-sm font-medium text-eco-700" role="status">Đã lưu</span>}
              </div>
            </section>
          )}

          <section className="card p-5" aria-labelledby="env-title">
            <h2 id="env-title" className="text-lg font-semibold">Cấu hình model qua file .env</h2>
            <p className="mt-1 text-sm text-slate-600">Đường dẫn weights, thiết bị và backend SAM được đặt trong file <code className="font-mono">.env</code> ở thư mục gốc dự án. Sửa xong thì bấm “Tải lại model”.</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
{`YOLO_WEIGHTS=ai/weights/yolo/ecoai-waste.pt
SAM_BACKEND=ultralytics
SAM_WEIGHTS=ai/weights/sam/sam2.1_b.pt
DEVICE=auto            # auto | cuda | cpu
HALF_PRECISION=true    # FP16 khi có GPU
MAX_UPLOAD_MB=10`}
            </pre>
          </section>
        </>
      )}

      {!status && !error && <div className="card flex items-center justify-center gap-2 p-12 text-slate-600"><Spinner /> Đang kiểm tra backend…</div>}
    </Page>
  )
}
