export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="#15803D" />
      <path
        d="M9 13V10a1 1 0 0 1 1-1h3M23 9h3a1 1 0 0 1 1 1v3M27 23v3a1 1 0 0 1-1 1h-3M13 27h-3a1 1 0 0 1-1-1v-3"
        stroke="#BBF7D0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M13 23c0-6 4-10 10-10 0 6-4 10-10 10z" fill="#FFFFFF" />
      <path d="M13 23l5-5" stroke="#15803D" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight text-slate-900">EcoAI</span>
        {subtitle && <span className="text-xs text-slate-500">Smart Waste Classification</span>}
      </span>
    </span>
  )
}
