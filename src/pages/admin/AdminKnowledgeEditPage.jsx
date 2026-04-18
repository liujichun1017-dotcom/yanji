import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const EMPTY_TREATMENT = {
  name: '', category_id: '', suitable_for: '', not_suitable_for: '',
  duration: '', price_min: '', price_max: '', description: '',
}

const EMPTY_AFTERCARE = {
  day_start: '', day_end: '', content: '', is_warning: false, sort_order: 0,
}

export default function AdminKnowledgeEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_TREATMENT)
  const [aftercares, setAftercares] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: cats }, treatmentRes, aftercareRes] = await Promise.all([
        supabase.from('kb_categories').select('*').order('sort_order'),
        isNew ? { data: null } : supabase.from('kb_treatments').select('*').eq('id', id).single(),
        isNew ? { data: [] } : supabase.from('kb_aftercare').select('*').eq('kb_treatment_id', id).order('sort_order'),
      ])
      setCategories(cats ?? [])
      if (treatmentRes.data) setForm(treatmentRes.data)
      setAftercares(aftercareRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id, isNew])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Aftercare helpers ─────────────────────────────────────────────
  function addAftercareRow() {
    setAftercares(a => [...a, { ...EMPTY_AFTERCARE, _tempId: Date.now() }])
  }

  function updateAftercareRow(idx, key, value) {
    setAftercares(a => a.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  }

  function removeAftercareRow(idx) {
    setAftercares(a => a.filter((_, i) => i !== idx))
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        suitable_for: form.suitable_for || null,
        not_suitable_for: form.not_suitable_for || null,
        duration: form.duration || null,
        price_min: form.price_min !== '' ? Number(form.price_min) : null,
        price_max: form.price_max !== '' ? Number(form.price_max) : null,
        description: form.description || null,
      }

      let treatmentId = id
      if (isNew) {
        const { data, error: insertErr } = await supabase.from('kb_treatments').insert(payload).select().single()
        if (insertErr) throw insertErr
        treatmentId = data.id
      } else {
        const { error: updateErr } = await supabase.from('kb_treatments').update(payload).eq('id', id)
        if (updateErr) throw updateErr
        await supabase.from('kb_aftercare').delete().eq('kb_treatment_id', id)
      }

      // Upsert aftercares
      const aftercareRows = aftercares
        .filter(r => r.content?.trim())
        .map((r, idx) => ({
          kb_treatment_id: treatmentId,
          day_start: Number(r.day_start) || 0,
          day_end: Number(r.day_end) || 0,
          content: r.content.trim(),
          is_warning: !!r.is_warning,
          sort_order: idx,
        }))

      if (aftercareRows.length > 0) {
        const { error: acErr } = await supabase.from('kb_aftercare').insert(aftercareRows)
        if (acErr) throw acErr
      }

      navigate('/admin/knowledge')
    } catch (err) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">加载中…</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/knowledge" className="text-slate-400 hover:text-slate-600 text-sm">← 返回列表</Link>
        <span className="text-slate-200">/</span>
        <h2 className="text-xl font-semibold text-slate-800">
          {isNew ? '新建知识库项目' : `编辑：${form.name}`}
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ── 基本信息 ── */}
        <section className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">基本信息</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">项目名称 *</label>
              <input
                required
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="例：玻尿酸填充"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">分类</label>
              <select
                value={form.category_id ?? ''}
                onChange={e => setField('category_id', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="">— 请选择分类 —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">持续时间</label>
              <input
                value={form.duration ?? ''}
                onChange={e => setField('duration', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="例：6–18 个月"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">最低价 (¥)</label>
                <input
                  type="number" min="0"
                  value={form.price_min ?? ''}
                  onChange={e => setField('price_min', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">最高价 (¥)</label>
                <input
                  type="number" min="0"
                  value={form.price_max ?? ''}
                  onChange={e => setField('price_max', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="15000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">适合人群</label>
            <textarea
              rows={2}
              value={form.suitable_for ?? ''}
              onChange={e => setField('suitable_for', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              placeholder="描述适合该项目的人群特征…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">不适合人群</label>
            <textarea
              rows={2}
              value={form.not_suitable_for ?? ''}
              onChange={e => setField('not_suitable_for', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              placeholder="禁忌症、不适合人群…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">项目介绍</label>
            <textarea
              rows={5}
              value={form.description ?? ''}
              onChange={e => setField('description', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              placeholder="详细介绍项目原理、效果、注意事项…"
            />
          </div>
        </section>

        {/* ── 术后注意事项 ── */}
        <section className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">术后注意事项</h3>
            <button
              type="button"
              onClick={addAftercareRow}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + 添加一条
            </button>
          </div>

          {aftercares.length === 0 ? (
            <p className="text-slate-400 text-sm py-2">暂无注意事项，点击上方添加</p>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[60px_60px_1fr_60px_32px] gap-2 text-xs text-slate-400 font-medium px-1">
                <span>开始天</span>
                <span>结束天</span>
                <span>内容</span>
                <span className="text-center">警告</span>
                <span />
              </div>
              {aftercares.map((row, idx) => (
                <div key={row.id ?? row._tempId ?? idx} className="grid grid-cols-[60px_60px_1fr_60px_32px] gap-2 items-start">
                  <input
                    type="number" min="0"
                    value={row.day_start}
                    onChange={e => updateAftercareRow(idx, 'day_start', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 text-center"
                  />
                  <input
                    type="number" min="0"
                    value={row.day_end}
                    onChange={e => updateAftercareRow(idx, 'day_end', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 text-center"
                  />
                  <textarea
                    rows={2}
                    value={row.content}
                    onChange={e => updateAftercareRow(idx, 'content', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                    placeholder="注意事项内容…"
                  />
                  <div className="flex items-center justify-center pt-1.5">
                    <input
                      type="checkbox"
                      checked={!!row.is_warning}
                      onChange={e => updateAftercareRow(idx, 'is_warning', e.target.checked)}
                      className="w-4 h-4 accent-red-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAftercareRow(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors pt-1.5 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Actions ── */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
          <Link
            to="/admin/knowledge"
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
