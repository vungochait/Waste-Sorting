import { AlertTriangle, PackageX, ServerCrash, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'

/** Hiển thị lỗi từ API. Với lỗi thiếu model: hiển thị rõ đường dẫn và từng bước cấu hình. */
export function ErrorPanel({ error, onRetry }: { error: ApiError | Error; onRetry?: () => void }) {
  const api = error instanceof ApiError ? error : null
  const body = api?.body
  const isModel = !!api?.isModelError
  const unreachable = api?.code === 'BACKEND_UNREACHABLE'
  const Icon = isModel ? PackageX : unreachable ? ServerCrash : AlertTriangle

  const title = isModel
    ? body?.code === 'MODEL_WEIGHTS_MISSING'
      ? `Chưa có model weights ${body?.model === 'sam' ? 'SAM' : 'YOLO'}`
      : body?.code === 'MODEL_LOADING'
        ? 'Model đang được nạp'
        : `Model ${body?.model === 'sam' ? 'SAM' : 'YOLO'} chưa sẵn sàng`
    : unreachable
      ? 'Không kết nối được backend'
      : 'Không xử lý được yêu cầu'

  const tone = isModel || unreachable ? 'amber' : 'red'
  const box = tone === 'amber' ? 'border-amber-300 bg-amber-50' : 'border-red-200 bg-red-50'
  const ink = tone === 'amber' ? 'text-amber-900' : 'text-red-800'

  return (
    <div role="alert" className={`rounded-2xl border p-5 ${box}`}>
      <div className="flex gap-3">
        <Icon size={22} className={`mt-0.5 shrink-0 ${ink}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className={`text-base font-semibold ${ink}`}>{title}</h3>
          <p className={`mt-1 text-[15px] leading-relaxed ${ink}`}>{error.message}</p>
          {body?.path && (
            <p className="mt-2 break-all font-mono text-xs text-slate-700">backend/{body.path}</p>
          )}
          {unreachable && (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
{`cd backend
.venv\\Scripts\\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000`}
            </pre>
          )}
          {body?.guide && body.guide.length > 0 && (
            <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-slate-800">
              {body.guide.map((g, i) => (
                <li key={i} className="break-words">{g}</li>
              ))}
            </ol>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Thử lại</button>}
            {isModel && (
              <Link to="/settings" className="btn-secondary">
                <Settings size={18} aria-hidden="true" /> Mở Cài đặt model
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
