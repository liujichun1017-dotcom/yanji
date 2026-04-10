import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div
        className="w-full max-w-[420px] bg-white rounded-[24px] px-10 py-12"
        style={{ boxShadow: '0 4px 40px rgba(28,25,23,0.08)' }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <h1
            className="text-[56px] text-ink leading-none"
            style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}
          >
            颜迹
          </h1>
          <p
            className="text-gold text-[14px] italic tracking-[0.4em] mt-1"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
          >
            Yán Jì
          </p>
          <div className="w-10 h-px bg-sand mt-5" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="form-label">密码</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? '登录中…' : '登 录'}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-[12px] text-ink-muted mt-6">
          还没有账号？{' '}
          <Link to="/register" className="text-gold hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}
