import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/admin',             label: '概览',     icon: '◈', end: true },
  { to: '/admin/knowledge',   label: '知识库',   icon: '◎' },
  { to: '/admin/categories',  label: '分类管理', icon: '≡' },
  { to: '/admin/warnings',    label: '避雷指南', icon: '⚠' },
  { to: '/admin/users',       label: '用户数据', icon: '◉' },
]

export default function AdminLayout({ children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-[11px] text-slate-400 tracking-widest uppercase font-sans mb-0.5">Admin</p>
          <h1 className="text-xl text-slate-800 font-semibold tracking-wide">颜迹后台</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="text-base w-5 text-center">←</span>
            回到用户端
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
          >
            <span className="text-base w-5 text-center">⏻</span>
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
