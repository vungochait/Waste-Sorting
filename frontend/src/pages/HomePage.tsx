import { motion } from 'framer-motion'
import { ArrowRight, Camera, CheckCircle2, Layers, ScanLine, SquareDashed, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { CATEGORY_META, CATEGORY_ORDER, categoryMeta } from '../services/categories'
import { fmtNumber, fmtPercent } from '../services/format'
import type { Statistics } from '../services/types'

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.45 } }

/** Hình minh họa vẽ tay (không phải kết quả AI): khung = YOLO, vùng tô = SAM. */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 800 560" className="block h-auto w-full" role="img" aria-label="Hình minh họa: khung YOLO và vùng mask SAM trên chai nhựa, lon, vỏ chuối và pin">
      <rect width="800" height="560" fill="#E9E4DA" />
      <path d="M0 130 L800 96 M0 310 L800 276 M0 480 L800 446" stroke="#DDD5C6" strokeWidth="2" />
      <g transform="translate(110 150) rotate(-18)">
        <rect width="250" height="86" rx="30" fill="#CFEAF5" stroke="#8CC3D9" strokeWidth="2" />
        <rect x="70" y="1" width="90" height="84" fill="#3B82C4" opacity="0.85" />
        <rect x="248" y="24" width="42" height="38" rx="6" fill="#CFEAF5" stroke="#8CC3D9" strokeWidth="2" />
        <rect x="288" y="18" width="26" height="50" rx="5" fill="#1D4ED8" />
      </g>
      <rect x="545" y="100" width="110" height="185" rx="14" fill="#D6DADF" stroke="#A3AAB3" strokeWidth="2" />
      <ellipse cx="600" cy="102" rx="55" ry="12" fill="#C3C8CF" stroke="#A3AAB3" strokeWidth="2" />
      <rect x="546" y="145" width="108" height="85" fill="#DC2626" />
      <path d="M150 430 C190 360 300 350 350 400 C320 390 270 400 250 430 C290 420 330 440 340 480 C300 455 250 455 220 470 C200 480 170 470 150 430 Z" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
      <g transform="translate(520 400) rotate(12)">
        <rect width="170" height="52" rx="8" fill="#1F2937" />
        <rect x="120" width="50" height="52" fill="#B45309" />
        <rect x="168" y="15" width="12" height="22" rx="3" fill="#9CA3AF" />
      </g>
      <g opacity="0.42">
        <g transform="translate(110 150) rotate(-18)"><rect width="250" height="86" rx="30" fill="#0EA5E9" /><rect x="246" y="24" width="44" height="38" fill="#0EA5E9" /><rect x="288" y="18" width="26" height="50" rx="5" fill="#0EA5E9" /></g>
        <rect x="545" y="90" width="110" height="195" rx="14" fill="#0EA5E9" />
        <path d="M150 430 C190 360 300 350 350 400 C320 390 270 400 250 430 C290 420 330 440 340 480 C300 455 250 455 220 470 C200 480 170 470 150 430 Z" fill="#22C55E" />
        <g transform="translate(520 400) rotate(12)"><rect width="180" height="52" rx="8" fill="#EF4444" /></g>
      </g>
      <g fill="none" strokeWidth="3">
        <rect x="104" y="48" width="338" height="190" rx="6" stroke="#0EA5E9" />
        <rect x="538" y="85" width="124" height="208" rx="6" stroke="#0EA5E9" />
        <rect x="140" y="355" width="215" height="130" rx="6" stroke="#22C55E" />
        <rect x="500" y="392" width="206" height="106" rx="6" stroke="#EF4444" />
      </g>
      <g fontFamily="Be Vietnam Pro, sans-serif" fontSize="14" fontWeight="600" fill="#FFFFFF">
        <rect x="104" y="20" width="96" height="26" rx="6" fill="#0369A1" /><text x="113" y="38">Chai nhựa</text>
        <rect x="538" y="57" width="90" height="26" rx="6" fill="#0369A1" /><text x="547" y="75">Lon nhôm</text>
        <rect x="140" y="327" width="88" height="26" rx="6" fill="#15803D" /><text x="149" y="345">Vỏ chuối</text>
        <rect x="500" y="364" width="44" height="26" rx="6" fill="#B91C1C" /><text x="509" y="382">Pin</text>
      </g>
    </svg>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  useEffect(() => {
    api.statistics(0).then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <div className="flex flex-col">
      <section className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-6">
          <span className="chip self-start bg-eco-100 px-3 py-1.5 text-[13px] text-eco-900">
            <span className="h-2 w-2 rounded-full bg-eco-600" /> YOLO + SAM · chạy trên máy của bạn
          </span>
          <h1 className="text-[40px] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px]">
            Phân loại rác thông minh – <span className="text-eco-700">Vì một tương lai xanh</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            Chụp hoặc tải ảnh lên, EcoAI phát hiện từng vật thể rác, tách chúng khỏi nền và cho bạn biết bỏ vào thùng nào, kèm hướng dẫn xử lý và tái chế.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/detect" className="btn-primary min-h-[52px] px-6 text-base">
              <ScanLine size={20} aria-hidden="true" /> Bắt đầu phân loại
            </Link>
            <Link to="/camera" className="btn-secondary min-h-[52px] px-6 text-base">
              <Camera size={20} aria-hidden="true" /> Mở Camera AI
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-slate-600">
            {CATEGORY_ORDER.map((id) => (
              <li key={id} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_META[id].color }} aria-hidden="true" />
                {CATEGORY_META[id].short}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.figure initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="card m-0 p-3 shadow-lift">
          <div className="overflow-hidden rounded-xl"><HeroIllustration /></div>
          <figcaption className="flex flex-wrap justify-between gap-2 px-1.5 pb-0.5 pt-3 text-[13px] text-slate-600">
            <span>Hình minh họa · Khung = YOLO phát hiện · Vùng tô = mask từ SAM</span>
          </figcaption>
        </motion.figure>
      </section>

      <section className="border-y border-slate-200 bg-white" aria-labelledby="tech">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow text-sky-700">Công nghệ YOLO + SAM</p>
            <h2 id="tech" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Hai mô hình, hai nhiệm vụ rõ ràng</h2>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">
              YOLO phát hiện và phân loại. SAM nhận bounding box từ YOLO làm prompt và chỉ phân đoạn, không thay thế mô hình phân loại rác.
            </p>
          </motion.div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Upload, tone: 'bg-eco-100 text-eco-700', title: 'Tải ảnh hoặc bật camera', text: 'Ảnh JPG, PNG, WEBP hoặc khung hình webcam được gửi tới FastAPI.' },
              { icon: SquareDashed, tone: 'bg-sky-100 text-sky-700', title: 'YOLO phát hiện', text: 'Bounding box, nhãn và độ tin cậy cho nhiều vật thể cùng lúc.' },
              { icon: Layers, tone: 'bg-purple-100 text-purple-700', title: 'SAM phân đoạn', text: 'Mỗi box thành một prompt; SAM tạo mask, tách vật thể khỏi nền, tính diện tích.' },
              { icon: CheckCircle2, tone: 'bg-eco-100 text-eco-700', title: 'Phân loại & hướng dẫn', text: 'Nhãn được ánh xạ vào 6 nhóm rác kèm cách xử lý, tái chế.' },
            ].map((s, i) => (
              <motion.li key={s.title} {...fadeUp} transition={{ duration: 0.45, delay: i * 0.06 }} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-surface p-6">
                <span className="font-mono text-[13px] text-slate-500">0{i + 1}</span>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}><s.icon size={22} aria-hidden="true" /></span>
                <strong className="text-[17px] text-slate-900">{s.title}</strong>
                <span className="text-[15px] leading-relaxed text-slate-600">{s.text}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="cats">
        <motion.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-eco-700">6 nhóm phân loại</p>
            <h2 id="cats" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Mỗi nhóm một màu, một thùng, một cách xử lý</h2>
          </div>
          <Link to="/knowledge" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-eco-700 hover:text-eco-900">
            Hướng dẫn chi tiết <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ORDER.map((id, i) => {
            const m = CATEGORY_META[id]
            return (
              <motion.div key={id} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.05 }} className="card flex flex-col gap-3 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: m.soft, color: m.ink }}><m.icon size={22} aria-hidden="true" /></span>
                  <div><strong className="block text-[17px] text-slate-900">{m.name}</strong><span className="text-[13px] text-slate-600">{m.nameEn}</span></div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{m.examples.join(', ')}.</p>
                <span className="mt-auto h-1 rounded-full" style={{ background: m.color }} aria-hidden="true" />
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="border-y border-eco-100 bg-eco-50" aria-labelledby="why">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          <motion.div {...fadeUp}>
            <p className="eyebrow text-eco-700">Lợi ích</p>
            <h2 id="why" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Phân loại đúng ngay từ nguồn</h2>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">Rác được tách đúng nhóm thì tái chế được nhiều hơn, chôn lấp ít hơn và an toàn hơn cho người thu gom.</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              ['Giảm rác chôn lấp', 'Rác hữu cơ được ủ phân, rác tái chế quay lại sản xuất thay vì ra bãi rác.'],
              ['Tái chế hiệu quả hơn', 'Vật liệu sạch, không lẫn tạp chất giữ được giá trị tái chế.'],
              ['An toàn với rác nguy hại', 'Pin, hóa chất được nhận diện và tách riêng trước khi gây cháy hoặc rò rỉ.'],
              ['Học qua từng lần quét', 'Mỗi kết quả kèm hướng dẫn, giúp cả gia đình hình thành thói quen phân loại.'],
            ].map(([t, d]) => (
              <motion.div key={t} {...fadeUp} className="rounded-2xl border border-eco-100 bg-white p-6">
                <strong className="text-base text-slate-900">{t}</strong>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="stats">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-sky-700">Thống kê</p>
            <h2 id="stats" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Đã nhận diện trên hệ thống của bạn</h2>
          </div>
          <Link to="/statistics" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-eco-700 hover:text-eco-900">
            Mở dashboard <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {!stats ? (
          <div className="card p-6 text-[15px] text-slate-600">Số liệu sẽ hiển thị khi backend đang chạy.</div>
        ) : stats.total_images === 0 ? (
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <span className="text-[15px] text-slate-600">Chưa có ảnh nào được phân tích. Hãy thử ảnh đầu tiên!</span>
            <Link to="/detect" className="btn-primary">Bắt đầu phân loại</Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Vật thể đã nhận diện', fmtNumber(stats.total_objects)],
                ['Ảnh đã phân tích', fmtNumber(stats.total_images)],
                ['Nhóm phổ biến nhất', stats.top_category ? categoryMeta(stats.top_category).name : '—'],
                ['Độ tin cậy trung bình', fmtPercent(stats.avg_confidence)],
              ].map(([label, value]) => (
                <div key={label} className="card flex flex-col gap-1.5 p-5">
                  <span className="text-sm text-slate-600">{label}</span>
                  <strong className="text-[28px] leading-tight tracking-tight text-slate-900 tabular-nums">{value}</strong>
                </div>
              ))}
            </div>
            {stats.total_objects > 0 && (
              <div className="card flex flex-col gap-4 p-5">
                <div className="flex h-3.5 gap-0.5 overflow-hidden rounded" role="img" aria-label={stats.categories.filter((c) => c.count).map((c) => `${c.name} ${c.percentage}%`).join(', ')}>
                  {stats.categories.filter((c) => c.count > 0).map((c) => <span key={c.id} style={{ flex: c.percentage, background: c.color }} />)}
                </div>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                  {stats.categories.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
                      {categoryMeta(c.id).short} <strong className="tabular-nums">{c.percentage.toLocaleString('vi-VN')}%</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-eco-900 p-8 sm:p-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Thử với một bức ảnh rác trong nhà bạn</h2>
            <p className="mt-2 text-base text-eco-200">Ảnh được xử lý trên máy chủ cục bộ của bạn, không gửi ra ngoài.</p>
          </div>
          <Link to="/detect" className="btn min-h-[52px] bg-white px-6 text-base text-eco-900 hover:bg-eco-50">
            Bắt đầu phân loại <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 px-4 py-6 text-sm text-slate-600 sm:px-6 lg:px-8">
          <span><strong className="text-slate-900">EcoAI</strong> – Phân loại rác thông minh – Vì một tương lai xanh</span>
          <span className="font-mono text-xs">FastAPI · YOLO · SAM 2 · React</span>
        </div>
      </footer>
    </div>
  )
}
