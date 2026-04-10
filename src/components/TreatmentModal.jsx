import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES, formatMoneyFull } from '../lib/constants'

export default function TreatmentModal({ treatment, onSave, onClose }) {
  const { user } = useAuth()
  const isEdit = !!treatment?.id

  const [form, setForm] = useState({
    name:             treatment?.name             ?? '',
    category:         treatment?.category         ?? '注射填充',
    treatment_date:   treatment?.treatment_date   ?? new Date().toISOString().split('T')[0],
    cost:             treatment?.cost             ?? '',
    clinic_id:        treatment?.clinic_id        ?? '',
    rating:           treatment?.rating           ?? 0,
    status:           treatment?.status           ?? '已完成',
    kb_treatment_id:  treatment?.kb_treatment_id  ?? '',
    notes:            treatment?.notes            ?? '',
  })

  const [costDisplay, setCostDisplay] = useState(
    treatment?.cost != null ? formatMoneyFull(treatment.cost) : ''
  )

  const [clinics, setClinics]           = useState([])
  const [kbList, setKbList]             = useState([])
  const [showNewClinic, setShowNewClinic] = useState(false)
  const [newClinicName, setNewClinicName] = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    fetchClinics()
    fetchKb()
  }, [])

  async function fetchClinics() {
    const { data } = await supabase
      .from('clinics').select('id, name').eq('user_id', user.id).order('name')
    setClinics(data ?? [])
  }

  async function fetchKb() {
    const { data } = await supabase
      .from('kb_treatments')
      .select('id, name, kb_categories(name)')
      .order('name')
    setKbList(data ?? [])
  }

  // ── Cost field handlers ──────────────────────────────────────────────────
  function handleCostFocus() {
    setCostDisplay(form.cost !== '' ? String(form.cost) : '')
  }
  function handleCostChange(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setForm(f => ({ ...f, cost: raw }))
    setCostDisplay(raw)
  }
  function handleCostBlur() {
    const num = parseFloat(String(form.cost).replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      setForm(f => ({ ...f, cost: num }))
      setCostDisplay(formatMoneyFull(num))
    } else {
      setForm(f => ({ ...f, cost: '' }))
      setCostDisplay('')
    }
  }

  // ── Clinic inline create ─────────────────────────────────────────────────
  async function createClinic() {
    if (!newClinicName.trim()) return
    const { data, error } = await supabase
      .from('clinics')
      .insert({ user_id: user.id, name: newClinicName.trim() })
      .select('id, name').single()
    if (!error && data) {
      setClinics(c => [...c, data])
      setForm(f => ({ ...f, clinic_id: data.id }))
      setShowNewClinic(false)
      setNewClinicName('')
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('请填写项目名称'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        user_id:          user.id,
        name:             form.name.trim(),
        category:         form.category,
        treatment_date:   form.treatment_date,
        cost:             form.cost !== '' ? Number(form.cost) : null,
        clinic_id:        form.clinic_id  || null,
        rating:           form.rating     || null,
        status:           form.status,
        kb_treatment_id:  form.kb_treatment_id || null,
        notes:            form.notes.trim() || null,
      }
      let result
      if (isEdit) {
        const { data, error } = await supabase
          .from('treatments').update(payload).eq('id', treatment.id).select().single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('treatments').insert(payload).select().single()
        if (error) throw error
        result = data
      }
      onSave(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── KB grouped by category ───────────────────────────────────────────────
  const kbByCategory = kbList.reduce((acc, t) => {
    const cat = t.kb_categories?.name ?? '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel: bottom sheet on mobile, centered modal on desktop */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-t-[24px] md:rounded-[24px] w-full md:max-w-[560px] md:mx-4 max-h-[92vh] overflow-y-auto slide-up md:slide-none shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4 sticky top-0 bg-white z-10">
            <h2 className="text-[20px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
              {isEdit ? '编辑项目' : '记录新项目'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-ink-muted text-[22px] leading-none transition-colors">×</button>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {/* 项目名称 */}
            <div>
              <label className="form-label">项目名称</label>
              <input type="text" className="input-field" placeholder="例：玻尿酸鼻部填充"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            {/* 分类 */}
            <div>
              <label className="form-label">分类</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-sans transition-colors ${
                      form.category === cat.value ? 'bg-ink text-cream' : 'bg-cream-deep text-ink-soft hover:bg-sand'
                    }`}>
                    <span>{cat.icon}</span><span>{cat.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 日期 + 费用 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">日期</label>
                <input type="date" className="input-field"
                  value={form.treatment_date}
                  onChange={e => setForm(f => ({ ...f, treatment_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">费用</label>
                <input type="text" inputMode="decimal" className="input-field font-sans" placeholder="¥0.00"
                  value={costDisplay}
                  onFocus={handleCostFocus}
                  onBlur={handleCostBlur}
                  onChange={handleCostChange} />
              </div>
            </div>

            {/* 机构 */}
            <div>
              <label className="form-label">机构</label>
              {!showNewClinic ? (
                <select className="input-field" value={form.clinic_id}
                  onChange={e => {
                    if (e.target.value === '__new__') { setShowNewClinic(true); setForm(f => ({ ...f, clinic_id: '' })) }
                    else setForm(f => ({ ...f, clinic_id: e.target.value }))
                  }}>
                  <option value="">不选择</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="__new__">＋ 新增机构...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input type="text" className="input-field flex-1" placeholder="机构名称" autoFocus
                    value={newClinicName} onChange={e => setNewClinicName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createClinic())} />
                  <button type="button" onClick={createClinic}
                    className="px-4 py-2 bg-ink text-cream rounded-[10px] text-[12px] whitespace-nowrap">添加</button>
                  <button type="button" onClick={() => setShowNewClinic(false)}
                    className="px-3 py-2 bg-cream-deep text-ink-muted rounded-[10px] text-[12px]">取消</button>
                </div>
              )}
              <p className="text-[10px] text-ink-muted mt-1 tracking-wide">仅自己可见</p>
            </div>

            {/* 效果评分 */}
            <div>
              <label className="form-label">效果评分</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? 0 : n }))}
                    className={`w-9 h-9 rounded-full border text-[18px] transition-all ${
                      form.rating >= n ? 'bg-blush border-blush text-white shadow-sm' : 'border-sand bg-white text-sand'
                    }`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* 关联知识库 */}
            <div>
              <label className="form-label">关联知识库项目</label>
              <select className="input-field" value={form.kb_treatment_id}
                onChange={e => setForm(f => ({ ...f, kb_treatment_id: e.target.value }))}>
                <option value="">不关联</option>
                {Object.entries(kbByCategory).map(([cat, items]) => (
                  <optgroup key={cat} label={`── ${cat}`}>
                    {items.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[10px] text-ink-muted mt-1 tracking-wide">关联后可查看术后护理指南</p>
            </div>

            {/* 备注 */}
            <div>
              <label className="form-label">备注</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="记录你的感受、医生的建议..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-sand rounded-full text-[13px] text-ink-muted hover:border-ink-muted transition-colors font-sans">
                取消
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? '保存中…' : '保 存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
