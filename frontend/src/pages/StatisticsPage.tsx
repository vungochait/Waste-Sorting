import { BarChart3, Boxes, Gauge, Images, RefreshCw, Table2 } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ErrorPanel } from '../components/ErrorPanel'
import { CategoryBadge, EmptyState, Page, PageHeader, Spinner } from '../components/ui'
import { ApiError, api } from '../services/api'
import { CATEGORY_META, CATEGORY_ORDER, categoryMeta } from '../services/categories'
import { fmtDay, fmtNumber, fmtPercent } from '../services/format'
import type { Statistics } from '../services/types'

const RANGES = [
  { days: 7, label: '7 ngày' },
  { days: 14, label: '14 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
  { days: 0, label: 'Tất cả' },
]

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0 8px 24px -12px rgba(15,23,42,0.25)',
  fontFamily: 'Be Vietnam Pro, sans-serif',
  fontSize: 13,
}

function Kpi({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="card flex flex-col gap-2 p-5">
      <span className="flex items-center gap-2 text-sm text-slate-600">{icon}{label}</span>
      <span className="text-[32px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">{value}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  )
}

export default function StatisticsPage() {
  const [days, setDays] = useState(14)
  const [data, setData] = useState<Statistics | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [asTable, setAsTable] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.statistics(days))
      setError(null)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const pieData = data?.categories.filter((c) => c.count > 0) ?? []
  const empty = data && data.total_images === 0

  return (
    <Page>
      <PageHeader
        eyebrow="Dashboard"
        title="Thống kê"
        description="Tổng hợp từ lịch sử nhận diện lưu trong cơ sở dữ liệu của bạn."
        actions={
          <>
            <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Khoảng thời gian">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  aria-pressed={days === r.days}
                  onClick={() => setDays(r.days)}
                  className={`min-h-[40px] rounded-lg px-3 text-sm font-semibold ${days === r.days ? 'bg-eco-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost" onClick={load} aria-label="Tải lại số liệu">
              {loading ? <Spinner /> : <RefreshCw size={18} />}
            </button>
          </>
        }
      />

      {error && <ErrorPanel error={error} onRetry={load} />}

      {data && empty && (
        <div className="card">
          <EmptyState icon={<BarChart3 size={26} />} title="Chưa có dữ liệu trong khoảng này" action={<Link to="/detect" className="btn-primary">Phân loại ảnh đầu tiên</Link>}>
            Số liệu xuất hiện sau khi bạn phân tích ảnh ở trang Phân loại rác AI.
          </EmptyState>
        </div>
      )}

      {data && !empty && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<Boxes size={16} aria-hidden="true" />} label="Tổng vật thể đã nhận diện" value={fmtNumber(data.total_objects)} />
            <Kpi icon={<Images size={16} aria-hidden="true" />} label="Tổng ảnh đã phân tích" value={fmtNumber(data.total_images)} hint={`${fmtNumber(data.images_with_objects)} ảnh có vật thể`} />
            <Kpi icon={<Gauge size={16} aria-hidden="true" />} label="Độ tin cậy trung bình" value={fmtPercent(data.avg_confidence)} />
            <Kpi icon={<BarChart3 size={16} aria-hidden="true" />} label="Vật thể / ảnh" value={data.avg_objects_per_image?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '—'} hint={data.top_category ? `Nhiều nhất: ${categoryMeta(data.top_category).name}` : undefined} />
          </div>

          <div className="flex justify-end">
            <button type="button" className="btn-ghost text-sm" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
              <Table2 size={18} aria-hidden="true" /> {asTable ? 'Xem dạng biểu đồ' : 'Xem dạng bảng'}
            </button>
          </div>

          {asTable ? (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-600">
                  <tr><th className="px-5 py-3 font-semibold">Nhóm rác</th><th className="px-5 py-3 text-right font-semibold">Số lượng</th><th className="px-5 py-3 text-right font-semibold">Tỷ lệ</th></tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3"><CategoryBadge category={c.id} /></td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">{fmtNumber(c.count)}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">{c.percentage.toLocaleString('vi-VN')}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              <section className="card p-5 lg:col-span-5" aria-labelledby="pie-title">
                <h2 id="pie-title" className="text-lg font-semibold">Tỷ lệ các nhóm rác</h2>
                <div className="relative h-[260px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} stroke="#FFFFFF" strokeWidth={2} isAnimationActive>
                        {pieData.map((c) => <Cell key={c.id} fill={c.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${fmtNumber(Number(v))} vật thể`, String(n)]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">{fmtNumber(data.total_objects)}</span>
                    <span className="text-xs text-slate-600">vật thể</span>
                  </div>
                </div>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {data.categories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
                        <span className="truncate text-slate-700">{categoryMeta(c.id).short}</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-900">{c.percentage.toLocaleString('vi-VN')}%</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-5 lg:col-span-7" aria-labelledby="bar-title">
                <h2 id="bar-title" className="text-lg font-semibold">Số lượng theo nhóm</h2>
                <div className="mt-3 h-[300px]">
                  <ResponsiveContainer>
                    <BarChart data={data.categories.map((c) => ({ ...c, short: categoryMeta(c.id).short }))} layout="vertical" margin={{ left: 8, right: 48 }}>
                      <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="short" width={72} tick={{ fill: '#334155', fontSize: 13 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={tooltipStyle} formatter={(v) => [`${fmtNumber(Number(v))} vật thể`, 'Số lượng']} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                        {data.categories.map((c) => <Cell key={c.id} fill={c.color} />)}
                        <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="card p-5 lg:col-span-12" aria-labelledby="daily-title">
                <h2 id="daily-title" className="text-lg font-semibold">Lịch sử phân loại theo ngày</h2>
                <div className="mt-3 h-[300px]">
                  <ResponsiveContainer>
                    <BarChart data={data.daily} margin={{ left: -12, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={12} />
                      <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={tooltipStyle} labelFormatter={(d) => `Ngày ${fmtDay(String(d))}`} />
                      <Legend wrapperStyle={{ fontSize: 13 }} iconType="square" />
                      {CATEGORY_ORDER.map((id, i) => (
                        <Bar key={id} dataKey={id} name={CATEGORY_META[id].short} stackId="day" fill={CATEGORY_META[id].color} stroke="#FFFFFF" strokeWidth={1}
                          radius={i === CATEGORY_ORDER.length - 1 ? [4, 4, 0, 0] : undefined} maxBarSize={36} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          <section className="card p-5" aria-labelledby="top-title">
            <h2 id="top-title" className="text-lg font-semibold">Loại rác được nhận diện nhiều nhất</h2>
            {data.top_labels.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Chưa có vật thể nào.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {data.top_labels.map((l, i) => {
                  const max = data.top_labels[0].count || 1
                  const meta = categoryMeta(l.category)
                  return (
                    <li key={l.name} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[28px_200px_minmax(0,1fr)_auto]">
                      <span className="font-mono text-sm text-slate-500">{i + 1}</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-slate-900">{l.name}</span>
                        <span className="truncate text-xs" style={{ color: meta.ink }}>{meta.name}</span>
                      </span>
                      <span className="hidden h-2 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: `${(l.count / max) * 100}%`, background: meta.color }} />
                      </span>
                      <span className="text-right font-mono text-sm tabular-nums text-slate-900">{fmtNumber(l.count)}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </>
      )}

      {!data && loading && !error && (
        <div className="card flex items-center justify-center gap-2 p-12 text-slate-600"><Spinner /> Đang tải số liệu…</div>
      )}
    </Page>
  )
}
