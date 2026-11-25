import { useCallback, useEffect, useRef, useState } from 'react'

export type WebcamState = 'idle' | 'starting' | 'live' | 'error'

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<WebcamState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setState('idle')
  }, [])

  const start = useCallback(async (id?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ camera, hoặc trang không chạy trên localhost/HTTPS.')
      setState('error')
      return
    }
    setState('starting')
    setError(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const chosen = id ?? deviceId
      const stream = await navigator.mediaDevices.getUserMedia({
        video: chosen
          ? { deviceId: { exact: chosen }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === 'videoinput'))
      const track = stream.getVideoTracks()[0]
      const settingsId = track?.getSettings().deviceId
      if (settingsId) setDeviceId(settingsId)
      setState('live')
    } catch (err) {
      const e = err as DOMException
      setError(
        e.name === 'NotAllowedError'
          ? 'Bạn đã từ chối quyền camera. Hãy cho phép camera trong thanh địa chỉ trình duyệt rồi thử lại.'
          : e.name === 'NotFoundError'
            ? 'Không tìm thấy camera nào trên thiết bị.'
            : `Không mở được camera: ${e.message || e.name}`,
      )
      setState('error')
    }
  }, [deviceId])

  /** Chụp khung hình hiện tại thành JPEG, thu nhỏ để cạnh dài không quá maxSide. */
  const capture = useCallback(async (maxSide = 1280, quality = 0.85): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
  }, [])

  useEffect(() => stop, [stop])

  return { videoRef, state, error, devices, deviceId, setDeviceId, start, stop, capture }
}
