import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X } from 'lucide-react'
import { useEffect } from 'react'
import { useWebcam } from '../hooks/useWebcam'
import { Spinner } from './ui'

export function WebcamCaptureDialog({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (file: File) => void }) {
  const cam = useWebcam()

  useEffect(() => {
    if (open) cam.start()
    else cam.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const snap = async () => {
    const blob = await cam.capture(1920, 0.92)
    if (!blob) return
    onCapture(new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' }))
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="webcam-title" className="card w-full max-w-3xl overflow-hidden" initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 id="webcam-title" className="text-lg font-semibold">Chụp ảnh bằng webcam</h2>
              <button type="button" className="btn-ghost px-3" aria-label="Đóng" onClick={onClose}><X size={20} /></button>
            </div>
            <div className="relative aspect-video bg-slate-900">
              <video ref={cam.videoRef} className="h-full w-full object-contain" playsInline muted />
              {cam.state === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-200"><Spinner /> Đang mở camera…</div>
              )}
              {cam.state === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-200">{cam.error}</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              {cam.devices.length > 1 ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="label">Camera</span>
                  <select className="input w-auto" value={cam.deviceId} onChange={(e) => { cam.setDeviceId(e.target.value); cam.start(e.target.value) }}>
                    {cam.devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                  </select>
                </label>
              ) : <span />}
              <button type="button" className="btn-primary" onClick={snap} disabled={cam.state !== 'live'}>
                <Camera size={18} aria-hidden="true" /> Chụp và phân tích
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
