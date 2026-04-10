import { useState, useRef, useEffect } from 'react'
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
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  // 点外部关闭菜单
  useEffect(() => {
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function handleLogout() {
    setShowMenu(false)
    await logout()
    navigate('/login')
  }

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

      {/* Right avatar + dropdown */}
      <div className="flex-shrink-0 ml-auto relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(v => !v)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-sans text-white font-medium transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg, #D4A5A0 0%, #B89B6E 100%)' }}
        >
          {initials}
        </button>

        {showMenu && (
          <div className="absolute right-0 top-11 bg-white rounded-[14px] shadow-xl overflow-hidden w-36 py-1"
               style={{ boxShadow: '0 8px 24px rgba(28,25,23,0.15)' }}>
            <p className="px-4 pt-2.5 pb-1 text-[10px] text-ink-muted font-sans tracking-widest truncate">
              {user?.email}
            </p>
            <div className="h-px bg-sand mx-3 my-1" />
            <button
              onClick={() => { setShowMenu(false); navigate('/dashboard') }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-ink font-sans hover:bg-cream transition-colors">
              返回主页
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-[13px] text-red-400 font-sans hover:bg-cream transition-colors">
              退出登录
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
