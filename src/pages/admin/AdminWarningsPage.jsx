import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY = { title: '', content: '', sort_order: '' }

export default function AdminWarningsPage() {
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [newForm, setNewForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('kb_warnings').select('*').order('sort_order')
    setWarnings(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newForm.title.trim() || !newForm.content.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('kb_warnings').insert({
      title: newForm.title.trim(),
      content: newForm.content.trim(),
      sort_order: newForm.sort_order !== '' ? Number(newForm.sort_order) : (warnings.length + 1),
    })
    if (err) { setError(err.message); setSaving(false); return }
    setNewForm(EMPTY)
    await load()
    setSaving(false)
  }

  function startEdit(w) {
    setEditingId(w.id)
    setEditForm({ title: w.title, content: w.content, sort_order: w.sort_order })
    setError('')
  }

  async function saveEdit(id) {
    if (!editForm.title.trim() || !editForm.content.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('kb_warnings')
      .update({
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        sort_order: Number(editForm.sort_order),
      })
      .eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setEditingId(null)
    await load()
    setSaving(false)
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`确认删除「${title}」？`)) return
    await supabase.from('kb_warnings').delete().eq('id', id)
    await load()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">避雷指南</h2>
        <p className="text-slate-400 text-sm mt-1">管理医美消费安全警示内容</p>
      </div>

      {/* Add new */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-100 p-5 mb-6 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">新增警示</h3>
        <div className="flex gap-3">
          <input
            required
            value={newForm.title}
            onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            placeholder="标题"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <input
            type="number"
            value={newForm.sort_order}
            onChange={e => setNewForm(f => ({ ...f, sort_order: e.target.value }))}
            placeholder="排序"
            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <textarea
          required
          rows={3}
          value={newForm.content}
          onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))}
          placeholder="警示内容详述…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          添加
        </button>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">加载中…</p>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-slate-100 p-5">
              {editingId === w.id ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      autoFocus
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <input
                      type="number"
                      value={editForm.sort_order}
                      onChange={e => setEditForm(f => ({ ...f, sort_order: e.target.value }))}
                      placeholder="排序"
                      className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={editForm.content}
                    onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                  />
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(w.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right">{w.sort_order}.</span>
                      <h4 className="font-semibold text-slate-800 text-sm">{w.title}</h4>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        onClick={() => startEdit(w)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(w.id, w.title)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed pl-7">{w.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
