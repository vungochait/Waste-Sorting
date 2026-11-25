import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, Page } from '../components/ui'

export default function NotFoundPage() {
  return (
    <Page>
      <div className="card">
        <EmptyState icon={<Compass size={26} />} title="Không tìm thấy trang" action={<Link to="/" className="btn-primary">Về trang chủ</Link>}>
          Đường dẫn này không tồn tại.
        </EmptyState>
      </div>
    </Page>
  )
}
