import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminKnowledgePage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [deleting, setDeleting] = useState(null)

  async function load() {
    const [{ data: cats }, { data: kbs }] = await Promise.all([
      supabase.from('kb_categories').select('*').order('sort_order'),
      supabase.from('kb_treatments').select('id, name, category_id, duration, price_min, price_max').order('name'),
    ])
    setCategories(cats ?? [])
    setItems(kbs ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const filtered = filterCat === 'all'
    ? items
    : items.filter(i => i.category_id === filterCat)

  async function handleDelete(id, name) {
    if (!window.confirm(`确认删除「${name}」？关联的术后注意事项也会一并删除。`)) return
    setDeleting(id)
    await supabase.from('kb_treatments').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">知识库项目</h2>
          <p className="text-slate-400 text-sm mt-1">共 {items.length} 个项目</p>
        </div>
        <Link
          to="/admin/knowledge/new"
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          + 新建项目
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCat === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          全部
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCat === c.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">加载中…</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">项目名称</th>
                <th className="text-left px-5 py-3 font-medium">分类</th>
                <th className="text-left px-5 py-3 font-medium">持续时间</th>
                <th className="text-left px-5 py-3 font-medium">价格区间</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">暂无项目</td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{item.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {catMap[item.category_id] ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{item.duration ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {item.price_min != null && item.price_max != null
                        ? `¥${item.price_min.toLocaleString()} – ¥${item.price_max.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex gap-3 justify-end">
                        <Link
                          to={`/admin/knowledge/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleting === item.id}
                          className="text-red-500 hover:text-red-700 font-medium text-xs disabled:opacity-40"
                        >
                          {deleting === item.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
