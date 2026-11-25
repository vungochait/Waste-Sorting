const nf = new Intl.NumberFormat('vi-VN')

export const fmtNumber = (n: number | null | undefined) => (n == null ? '—' : nf.format(n))

export const fmtPercent = (ratio: number | null | undefined, digits = 1) =>
  ratio == null ? '—' : `${(ratio * 100).toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`

export const fmtMs = (ms: number | null | undefined) =>
  ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} s` : `${Math.round(ms)} ms`

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtDay = (isoDate: string) => {
  const [, m, d] = isoDate.split('-')
  return `${d}/${m}`
}

export const fmtBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB` : `${Math.round(n / 1024)} KB`
