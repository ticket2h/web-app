import { useEffect, useRef, useState, type RefObject } from 'react'

/** BarcodeDetector (Shape Detection API) chưa có trong lib DOM của TypeScript: khai báo phần dùng tới. */
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance

function barcodeDetector(): BarcodeDetectorConstructor | null {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
    ? (window as unknown as { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector
    : null
}

/**
 * Trình duyệt tự đọc được QR (Chrome trên Android, macOS, ChromeOS; Safari iOS 17+...). Không có thì trang soát vé chỉ
 * cho nhập mã bằng tay. Không dùng thư viện đọc QR để khỏi thêm dependency.
 */
export function canScanQr(): boolean {
  return barcodeDetector() !== null && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
}

const SCAN_INTERVAL_MS = 250

/** Bật camera sau, đọc QR liên tục khi `active`; tắt camera khi `active` về false hoặc rời trang. */
export function useQrScanner(active: boolean, onDetect: (value: string) => void): {
  videoRef: RefObject<HTMLVideoElement | null>
  error: string | null
} {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectRef = useRef(onDetect)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  useEffect(() => {
    const Detector = barcodeDetector()
    if (!active || !Detector) return
    let stopped = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const detector = new Detector({ formats: ['qr_code'] })
    setError(null)

    const scan = async () => {
      const video = videoRef.current
      if (stopped || !video) return
      try {
        if (video.readyState >= 2) {
          const [code] = await detector.detect(video)
          if (code?.rawValue && !stopped) onDetectRef.current(code.rawValue)
        }
      } catch {
        // Khung hình lỗi thì bỏ qua, quét khung sau
      }
      timer = setTimeout(scan, SCAN_INTERVAL_MS)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (media) => {
        if (stopped) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        stream = media
        const video = videoRef.current
        if (!video) return
        video.srcObject = media
        await video.play()
        scan()
      })
      .catch((cause: unknown) => {
        const denied = cause instanceof DOMException && cause.name === 'NotAllowedError'
        setError(denied ? 'Chưa được phép dùng camera. Cho phép trong cài đặt trình duyệt rồi thử lại.' : 'Không mở được camera.')
      })

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [active])

  return { videoRef, error }
}
