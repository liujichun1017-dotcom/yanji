import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TreatmentModal from '../components/TreatmentModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCategoryMeta, getStatusMeta, formatMoneyFull, formatDate } from '../lib/constants'

function RatingStars({ rating }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`text-[18px] ${(rating ?? 0) >= n ? 'text-blush' : 'text-sand'}`}>★</span>
      ))}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="py-4 border-b border-sand last:border-0">
      <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-1.5">{label}</p>
      <div className="text-[14px] text-ink font-sans">{children}</div>
    </div>
  )
}

export default function TreatmentDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [treatment,  setTreatment]  = useState(null)
  const [kbItem,     setKbItem]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => { fetchTreatment() }, [id])

  async function fetchTreatment() {
    setLoading(true)
    const { data, error } = await supabase
      .from('treatments')
      .select('*, clinics(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (data) {
      setTreatment(data)
      // 单独获取关联的知识库项目名称
      if (data.kb_treatment_id) {
        const { data: kb } = await supabase
          .from('kb_treatments')
          .select('id, name')
          .eq('id', data.kb_treatment_id)
          .single()
        setKbItem(kb ?? null)
      } else {
        setKbItem(null)
      }
    } else {
      setTreatment(null)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await supabase.from('treatments').delete().eq('id', id)
    navigate('/treatments')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto pb-16">
          <div className="pt-10 space-y-4">
            <div className="h-8 bg-white rounded-xl animate-pulse w-48" />
            <div className="bg-white rounded-[20px] h-80 animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (!treatment) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-ink-muted mb-4">记录不存在</p>
            <button onClick={() => navigate('/treatments')} className="btn-primary max-w-[140px]">返回列表</button>
          </div>
        </main>
      </div>
    )
  }

  const cat    = getCategoryMeta(treatment.category)
  const status = getStatusMeta(treatment.status)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto pb-16">

        {/* Back */}
        <div className="pt-8 mb-6">
          <button onClick={() => navigate('/treatments')}
            className="text-[12px] text-ink-muted font-sans hover:text-ink transition-colors flex items-center gap-1">
            ← 返回我的项目
          </button>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[22px] ${cat.bg}`}>
            {cat.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-[24px] text-ink leading-snug"
                style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
              {treatment.name}
            </h1>
            <span className={`inline-block mt-1.5 text-[11px] font-sans px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              {treatment.status}
            </span>
          </div>
          <p className="text-[28px] text-ink italic leading-none shrink-0"
             style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
            {formatMoneyFull(treatment.cost)}
          </p>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-[20px] px-6 shadow-sm mb-5">
          <Field label="日期">{formatDate(treatment.treatment_date)}</Field>
          <Field label="分类">{treatment.category}</Field>
          {treatment.clinics?.name && <Field label="机构">{treatment.clinics.name}</Field>}
          <Field label="效果评分">
            <RatingStars rating={treatment.rating} />
          </Field>
          {treatment.notes && <Field label="备注">
            <p className="text-ink-soft leading-relaxed">{treatment.notes}</p>
          </Field>}
        </div>

        {/* KB aftercare link */}
        {kbItem && (
          <div className="bg-blush-light rounded-[20px] px-6 py-5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-sans tracking-[0.2em] text-ink-soft uppercase mb-1">知识库关联</p>
              <p className="text-[14px] text-ink font-sans">{kbItem.name}</p>
            </div>
            <button
              onClick={() => navigate(`/knowledge/${kbItem.id}`)}
              className="text-[12px] text-gold font-sans hover:underline whitespace-nowrap">
              查看术后注意事项 →
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-3 border border-sand rounded-full text-[13px] font-sans text-ink-soft
                       hover:border-ink-muted transition-colors">
            编 辑
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 py-3 rounded-full text-[13px] font-sans transition-colors ${
              confirmDel
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'border border-sand text-red-400 hover:border-red-300'
            }`}>
            {deleting ? '删除中…' : confirmDel ? '确认删除' : '删 除'}
          </button>
        </div>
        {confirmDel && (
          <p className="text-center text-[11px] text-ink-muted mt-2">
            再次点击确认删除，此操作不可撤销
          </p>
        )}
      </main>

      {showModal && (
        <TreatmentModal
          treatment={{ ...treatment, kb_treatments: kbItem }}
          onSave={() => { setShowModal(false); fetchTreatment() }}
          onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
