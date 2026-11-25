import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Spinner } from './components/ui'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'

// Mỗi trang là một chunk riêng: trang chủ tải nhanh, Recharts chỉ tải khi mở Thống kê.
const DetectPage = lazy(() => import('./pages/DetectPage'))
const CameraPage = lazy(() => import('./pages/CameraPage'))
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 p-16 text-slate-600">
      <Spinner /> Đang tải…
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="detect" element={<DetectPage />} />
          <Route path="camera" element={<CameraPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
