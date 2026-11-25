export type CategoryId = 'organic' | 'recyclable' | 'nonrecyclable' | 'hazardous' | 'ewaste' | 'other'

export type Polygon = [number, number][]

export interface DetectedObject {
  id: number
  label: string
  name: string
  category: CategoryId
  confidence: number
  bbox: [number, number, number, number]
  area_ratio: number | null
  mask_area_px: number | null
  polygons: Polygon[] | null
  mask_score?: number | null
  instructions: string[]
  recommendation: string
  bin: string
}

export interface ModelInfo {
  yolo: string
  sam: string | null
  sam_backend: string
  device: string
}

export interface DetectResponse {
  image_id: string
  width: number
  height: number
  objects: DetectedObject[]
  timings: Record<string, number>
  model: ModelInfo
}

export interface MaskResult {
  index: number
  bbox: [number, number, number, number]
  polygons: Polygon[]
  area_ratio: number
  mask_area_px: number
  score: number | null
}

export interface SegmentResponse {
  image_id: string
  width: number
  height: number
  masks: MaskResult[]
  timings: Record<string, number>
  model: ModelInfo
}

export interface AnalyzeResult {
  history_id: number | null
  image_id: string
  image_url: string | null
  width: number
  height: number
  objects: DetectedObject[]
  summary: { category: CategoryId; count: number }[]
  segmented: boolean
  timings: Record<string, number>
  model: ModelInfo
  message: string | null
}

export type StageName = 'upload' | 'detect' | 'segment' | 'classify' | 'save'
export type StageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error'

export type AnalyzeEvent =
  | { type: 'stage'; stage: StageName; status: StageStatus; ms?: number; count?: number; reason?: string; width?: number; height?: number; image_id?: string; history_id?: number }
  | { type: 'detections'; objects: DetectedObject[] }
  | { type: 'result'; data: AnalyzeResult }
  | { type: 'error'; status_code: number; error: ApiErrorBody }

export interface ApiErrorBody {
  code: string
  message: string
  model?: string
  reason?: string
  path?: string | null
  guide?: string[]
  detail?: string | null
  [key: string]: unknown
}

export interface Category {
  id: CategoryId
  name: string
  name_en: string
  color: string
  ink: string
  icon: string
  bin: string
  examples: string[]
  instructions: string[]
  recommendation: string
}

export interface HistoryItem {
  id: number
  image_url: string | null
  original_filename: string | null
  width: number
  height: number
  detected_objects: DetectedObject[]
  object_count: number
  category: CategoryId | null
  confidence: number | null
  source: 'upload' | 'camera'
  timings: Record<string, number>
  model_info: Partial<ModelInfo>
  created_at: string
}

export interface HistoryList {
  items: HistoryItem[]
  total: number
  page: number
  page_size: number
}

export interface Statistics {
  range_days: number
  total_objects: number
  total_images: number
  images_with_objects: number
  avg_confidence: number | null
  avg_objects_per_image: number | null
  top_category: CategoryId | null
  categories: { id: CategoryId; name: string; color: string; count: number; percentage: number }[]
  daily: ({ date: string; total: number } & Record<CategoryId, number>)[]
  top_labels: { name: string; label: string; category: CategoryId; count: number }[]
}

export type ModelState = 'not_loaded' | 'loading' | 'ready' | 'error' | 'disabled'

export interface ModelSlotStatus {
  state: ModelState
  ready: boolean
  weights: string
  weights_exists: boolean
  error: ApiErrorBody | null
  classes?: Record<string, string> | null
  task?: string | null
  backend?: string
}

export interface RuntimeSettings {
  yolo_conf: number
  yolo_iou: number
  yolo_imgsz: number
  yolo_max_det: number
  sam_enabled: boolean
}

export interface SystemStatus {
  app: { name: string; version: string }
  models: {
    device: {
      preference: string
      device: string
      torch_installed: boolean
      torch_version: string | null
      cuda_available: boolean
      cuda_version: string | null
      gpu_name: string | null
    }
    yolo: ModelSlotStatus
    sam: ModelSlotStatus
  }
  runtime: RuntimeSettings
  config: {
    max_upload_mb: number
    allowed_extensions: string[]
    max_image_side: number
    sam_backend: string
    half_precision: boolean
    device_preference: string
    save_history: boolean
    class_map: string
  }
}
