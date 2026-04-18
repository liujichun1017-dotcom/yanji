import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editOrder, setEditOrder] = useState(0)
  const [newName, setNewName] = useState('')
  const [newOrder, setNewOrder] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('kb_categories').select('*').order('sort_order')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('kb_categories').insert({
      name: newName.trim(),
      sort_order: newOrder !== '' ? Number(newOrder) : (categories.length + 1),
    })
    if (err) { setError(err.message); setSaving(false); return }
    setNewName('')
    setNewOrder('')
    await load()
    setSaving(false)
  }

  function startEdit(cat) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditOrder(cat.sort_order)
    setError('')
  }

  async function saveEdit(id) {
    if (!editName.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('kb_categories')
      .update({ name: editName.trim(), sort_order: Number(editOrder) })
      .eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setEditingId(null)
    await load()
    setSaving(false)
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`确认删除分类「${name}」？该分类下的知识库项目不会删除，但会失去分类关联。`)) return
    await supabase.from('kb_categories').delete().eq('id', id)
    await load()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">分类管理</h2>
        <p className="text-slate-400 text-sm mt-1">管理知识库项目的分类标签</p>
      </div>

      {/* Add new */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-100 p-5 mb-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">新增分类</h3>
        <div className="flex gap-3">
          <input
            required
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="分类名称"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <input
            type="number"
            value={newOrder}
            onChange={e => setNewOrder(e.target.value)}
            placeholder="排序"
            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            添加
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </form>

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">加载中…</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">排序</th>
                <th className="text-left px-5 py-3 font-medium">分类名称</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  {editingId === cat.id ? (
                    <>
                      <td className="px-5 py-2.5">
                        <input
                          type="number"
                          value={editOrder}
                          onChange={e => setEditOrder(e.target.value)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 text-center"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 w-full max-w-xs"
                          onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)}
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => saveEdit(cat.id)}
                            disabled={saving}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs disabled:opacity-40"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5 text-slate-400 text-xs w-16">{cat.sort_order}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{cat.name}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => startEdit(cat)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="text-red-500 hover:text-red-700 font-medium text-xs"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
