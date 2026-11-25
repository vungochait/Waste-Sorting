import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookOpen, Camera, History, Home, Menu, ScanLine, Settings, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ModelStatusCard } from '../components/ModelStatusCard'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/detect', label: 'Phân loại rác AI', icon: ScanLine },
  { to: '/camera', label: 'Camera AI', icon: Camera },
  { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
  { to: '/history', label: 'Lịch sử', icon: History },
  { to: '/knowledge', label: 'Kiến thức môi trường', icon: BookOpen },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
              isActive ? 'bg-eco-100 font-semibold text-eco-900' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar máy tính */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Link to="/" className="px-2">
          <Logo />
        </Link>
        <NavItems />
        <div className="mt-auto">
          <ModelStatusCard />
        </div>
      </aside>

      {/* Thanh trên điện thoại / tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
        <Link to="/" aria-label="EcoAI – Trang chủ">
          <Logo subtitle={false} />
        </Link>
        <button type="button" className="btn-ghost px-3" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-[300px] flex-col gap-6 overflow-y-auto bg-white px-4 py-5 shadow-lift lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              aria-label="Menu"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button type="button" className="btn-ghost px-3" aria-label="Đóng menu" onClick={() => setOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <NavItems onNavigate={() => setOpen(false)} />
              <div className="mt-auto">
                <ModelStatusCard />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
