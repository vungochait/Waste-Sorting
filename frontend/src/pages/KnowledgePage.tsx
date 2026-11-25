import { motion } from 'framer-motion'
import { Ban, Check, Droplets, Factory, Flame, Fish, Leaf, Package, Recycle, ShoppingBag, Sparkles, Truck, Waves } from 'lucide-react'
import { Page, PageHeader } from '../components/ui'
import { CATEGORY_META, CATEGORY_ORDER } from '../services/categories'

const SECTIONS = [
  ['source', 'Phân loại tại nguồn'],
  ['plastic', 'Tác hại của rác nhựa'],
  ['recycle', 'Quy trình tái chế'],
  ['hazardous', 'Rác nguy hại'],
  ['tips', 'Mẹo sống xanh'],
] as const

const fade = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.4 } }

const SOURCE_NOTES: Record<string, string> = {
  organic: 'Để ráo nước, không lẫn túi nilon. Có thể ủ compost tại nhà.',
  recyclable: 'Làm sạch, để khô, ép gọn. Giấy dính dầu mỡ không còn tái chế được.',
  nonrecyclable: 'Gói kín mảnh sành sứ, thủy tinh vỡ để bảo vệ người thu gom.',
  hazardous: 'Không bỏ chung rác sinh hoạt; mang đến điểm thu gom riêng.',
  ewaste: 'Xóa dữ liệu, tháo pin, mang đến điểm thu hồi hoặc đổi cũ lấy mới.',
  other: 'Khi không chắc chắn, đối chiếu hướng dẫn hoặc hỏi đơn vị thu gom tại địa phương.',
}

export default function KnowledgePage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Kiến thức môi trường"
        title="Hiểu đúng để phân loại đúng"
        description="Hướng dẫn phân loại rác tại nguồn, quy trình tái chế và cách xử lý an toàn những loại rác nguy hại."
      />

      <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 no-underline hover:border-eco-600 hover:text-eco-800">
            {label}
          </a>
        ))}
      </nav>

      <section id="source" className="scroll-mt-20" aria-labelledby="source-title">
        <h2 id="source-title" className="text-2xl font-bold">1. Hướng dẫn phân loại rác tại nguồn</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
          Phân loại tại nguồn nghĩa là tách rác ngay tại nhà, trường học, văn phòng, trước khi rác được thu gom. Hãy chuẩn bị ít nhất 3 thùng: hữu cơ, tái chế và rác còn lại. Rác nguy hại và rác điện tử để riêng.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((id) => {
            const m = CATEGORY_META[id]
            return (
              <motion.article key={id} {...fade} className="card flex flex-col gap-3 p-5" style={{ borderTop: `4px solid ${m.color}` }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: m.soft, color: m.ink }}><m.icon size={22} aria-hidden="true" /></span>
                  <div>
                    <h3 className="text-[17px] font-semibold">{m.name}</h3>
                    <p className="text-sm" style={{ color: m.ink }}>{m.bin}</p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {m.examples.map((e) => <li key={e} className="chip bg-slate-100 font-medium text-slate-700">{e}</li>)}
                </ul>
                <p className="text-sm leading-relaxed text-slate-600">{SOURCE_NOTES[id]}</p>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section id="plastic" className="scroll-mt-20" aria-labelledby="plastic-title">
        <h2 id="plastic-title" className="text-2xl font-bold">2. Tác hại của rác thải nhựa</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Package, title: 'Tồn tại hàng trăm năm', text: 'Phần lớn nhựa không phân hủy sinh học; chúng chỉ vỡ thành mảnh nhỏ hơn và tồn tại rất lâu trong môi trường.' },
            { icon: Fish, title: 'Vi nhựa vào chuỗi thức ăn', text: 'Mảnh vi nhựa bị cá, chim và động vật ăn phải, rồi theo hải sản, muối, nước quay lại bữa ăn của con người.' },
            { icon: Flame, title: 'Đốt nhựa sinh khí độc', text: 'Đốt nhựa lộ thiên thải ra khói độc và bụi mịn, ảnh hưởng hô hấp của người dân xung quanh.' },
            { icon: Waves, title: 'Tắc cống, gây ngập', text: 'Túi nilon và chai nhựa làm tắc hệ thống thoát nước, góp phần gây ngập úng khi mưa lớn.' },
          ].map((c) => (
            <motion.div key={c.title} {...fade} className="card flex flex-col gap-3 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><c.icon size={22} aria-hidden="true" /></span>
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{c.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="recycle" className="scroll-mt-20" aria-labelledby="recycle-title">
        <h2 id="recycle-title" className="text-2xl font-bold">3. Quy trình tái chế</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-5">
          {[
            { icon: ShoppingBag, title: 'Phân loại tại nguồn', text: 'Người dân tách rác tái chế sạch, khô.' },
            { icon: Truck, title: 'Thu gom', text: 'Đơn vị thu gom, vựa phế liệu tiếp nhận theo từng loại.' },
            { icon: Droplets, title: 'Làm sạch & phân loại', text: 'Loại bỏ tạp chất, phân theo vật liệu: nhựa, giấy, kim loại, thủy tinh.' },
            { icon: Factory, title: 'Xử lý', text: 'Nghiền, nấu chảy hoặc nghiền bột giấy thành nguyên liệu thô.' },
            { icon: Recycle, title: 'Sản phẩm mới', text: 'Nguyên liệu tái chế quay lại sản xuất bao bì, sợi vải, giấy, lon mới.' },
          ].map((s, i) => (
            <motion.li key={s.title} {...fade} transition={{ duration: 0.4, delay: i * 0.06 }} className="card relative flex flex-col gap-2 p-5">
              <span className="font-mono text-xs text-slate-500">Bước {i + 1}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-100 text-eco-700"><s.icon size={20} aria-hidden="true" /></span>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section id="hazardous" className="scroll-mt-20" aria-labelledby="haz-title">
        <h2 id="haz-title" className="text-2xl font-bold">4. Hướng dẫn xử lý rác nguy hại</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <motion.div {...fade} className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-eco-800"><Check size={20} aria-hidden="true" /> Nên làm</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-[15px] leading-relaxed text-slate-700">
              <li>Dán băng keo hai cực pin, đựng pin cũ trong hộp nhựa hoặc lọ khô.</li>
              <li>Giữ hóa chất trong bình chứa gốc, đậy kín, dán nhãn rõ ràng.</li>
              <li>Bọc bóng đèn huỳnh quang trong hộp hoặc giấy báo để tránh vỡ.</li>
              <li>Mang đến điểm thu gom rác nguy hại, cửa hàng điện máy hoặc chương trình thu hồi pin.</li>
              <li>Để xa tầm tay trẻ em và vật nuôi trong lúc chờ mang đi.</li>
            </ul>
          </motion.div>
          <motion.div {...fade} className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-700"><Ban size={20} aria-hidden="true" /> Không nên</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-[15px] leading-relaxed text-slate-700">
              <li>Bỏ pin, ắc quy chung với rác sinh hoạt: có thể gây chập cháy trong xe rác.</li>
              <li>Đổ dầu nhớt, sơn, thuốc tẩy xuống cống hoặc ra đất.</li>
              <li>Trộn lẫn các loại hóa chất với nhau.</li>
              <li>Đập vỡ bóng đèn huỳnh quang (có thể chứa hơi thủy ngân).</li>
              <li>Đốt bình xịt, bình gas mini, kể cả khi đã hết.</li>
            </ul>
          </motion.div>
        </div>
      </section>

      <section id="tips" className="scroll-mt-20" aria-labelledby="tips-title">
        <h2 id="tips-title" className="text-2xl font-bold">5. Mẹo bảo vệ môi trường</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['Mang theo túi vải', 'Từ chối túi nilon khi đi chợ, siêu thị.'],
            ['Dùng bình nước cá nhân', 'Giảm chai nhựa dùng một lần ở trường và văn phòng.'],
            ['Ủ compost tại nhà', 'Biến vỏ rau, bã cà phê thành phân bón cho cây.'],
            ['Sửa trước khi bỏ', 'Đồ điện tử, quần áo còn sửa được thì sửa hoặc cho tặng.'],
            ['Mua vừa đủ', 'Lên danh sách trước khi mua để tránh lãng phí thực phẩm.'],
            ['Lan tỏa thói quen', 'Hướng dẫn người thân dùng EcoAI để phân loại đúng.'],
          ].map(([t, d]) => (
            <motion.div key={t} {...fade} className="card flex gap-3 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-eco-100 text-eco-700">
                {t === 'Ủ compost tại nhà' ? <Leaf size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
              </span>
              <div>
                <h3 className="text-base font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </Page>
  )
}
