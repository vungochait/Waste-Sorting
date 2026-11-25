/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Để trống khi dùng proxy của Vite; đặt ví dụ http://192.168.1.10:8000 khi deploy tách rời. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
