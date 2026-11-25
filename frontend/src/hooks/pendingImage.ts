/** Chuyển ảnh chụp từ trang Camera sang trang Phân loại mà không cần serialize vào history. */
let pending: File | null = null

export const setPendingImage = (file: File) => {
  pending = file
}

export const takePendingImage = (): File | null => {
  const f = pending
  pending = null
  return f
}
