import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: '总览', path: '/dashboard' },
  { label: '我的项目', path: '/treatments' },
  { label: '知识库', path: '/knowledge' },
  { label: '对比相册', path: '/photos' },
  { label: '预算', path: '/budget' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink h-16 flex items-center px-6 md:px-10">
      {/* Logo */}
      <div className="flex-shrink-0">
        <span
          className="text-cream text-[18px] tracking-[0.15em]"
          style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}
        >
          颜迹
        </span>
      </div>

      {/* Center nav links — hidden on mobile */}
      <div className="hidden md:flex flex-1 justify-center items-center gap-8">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `text-[12px] font-sans tracking-[0.1em] transition-colors duration-200 pb-1 ${
                isActive
                  ? 'text-cream border-b-2 border-blush'
                  : 'text-white/40 hover:text-white/70 border-b-2 border-transparent'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Right avatar */}
      <div className="flex-shrink-0 ml-auto">
        <button
          onClick={handleLogout}
          title="退出登录"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-sans text-white font-medium transition-opacity hover:opacity-80"
          style={{
            background: 'linear-gradient(135deg, #D4A5A0 0%, #B89B6E 100%)',
          }}
        >
          {initials}
        </button>
      </div>
    </nav>
  )
}
