import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FullScreenLoading() {
  return (
    <div className="fixed inset-0 bg-cream flex flex-col items-center justify-center">
      <span
        className="text-ink text-[48px]"
        style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}
      >
        颜迹
      </span>
      <span
        className="text-gold text-[13px] italic tracking-[0.4em] mt-2"
        style={{ fontFamily: '"Cormorant Garamond", serif' }}
      >
        Yán Jì
      </span>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}
