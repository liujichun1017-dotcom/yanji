import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: userCount },
        { count: treatmentCount },
        { count: kbCount },
        { count: categoryCount },
        { count: warningCount },
        { count: aftercareCount },
      ] = await Promise.all([
        supabase.from('treatments').select('*', { count: 'exact', head: true }),
        supabase.from('treatments').select('*', { count: 'exact', head: true }),
        supabase.from('kb_treatments').select('*', { count: 'exact', head: true }),
        supabase.from('kb_categories').select('*', { count: 'exact', head: true }),
        supabase.from('kb_warnings').select('*', { count: 'exact', head: true }),
        supabase.from('kb_aftercare').select('*', { count: 'exact', head: true }),
      ])
      setStats({ userCount, treatmentCount, kbCount, categoryCount, warningCount, aftercareCount })
      setLoading(false)
    }
    load()
  }, [])

  const cards = stats ? [
    { label: '用户治疗记录', value: stats.treatmentCount, sub: '条', to: null, color: 'bg-violet-50 text-violet-700' },
    { label: '知识库项目', value: stats.kbCount, sub: '个', to: '/admin/knowledge', color: 'bg-blue-50 text-blue-700' },
    { label: '知识库分类', value: stats.categoryCount, sub: '个', to: '/admin/categories', color: 'bg-emerald-50 text-emerald-700' },
    { label: '避雷指南', value: stats.warningCount, sub: '条', to: '/admin/warnings', color: 'bg-amber-50 text-amber-700' },
    { label: '术后注意事项', value: stats.aftercareCount, sub: '条', to: null, color: 'bg-rose-50 text-rose-700' },
  ] : []

  const quickLinks = [
    { to: '/admin/knowledge/new', label: '+ 新建知识库项目', color: 'bg-slate-900 text-white hover:bg-slate-700' },
    { to: '/admin/categories', label: '管理分类', color: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
    { to: '/admin/warnings', label: '管理避雷指南', color: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-800">概览</h2>
        <p className="text-slate-400 text-sm mt-1">颜迹后台管理系统</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">加载中…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {cards.map(({ label, value, sub, to, color }) => {
              const inner = (
                <div className={`rounded-xl p-5 ${color.split(' ')[0]} h-full`}>
                  <p className={`text-3xl font-bold ${color.split(' ')[1]}`}>{value ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                  <p className="text-sm font-medium text-slate-700 mt-2">{label}</p>
                </div>
              )
              return to ? (
                <Link key={label} to={to} className="block hover:opacity-80 transition-opacity">{inner}</Link>
              ) : (
                <div key={label}>{inner}</div>
              )
            })}
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">快捷操作</h3>
            <div className="flex flex-wrap gap-3">
              {quickLinks.map(({ to, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${color}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
