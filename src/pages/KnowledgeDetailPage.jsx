import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function InfoBlock({ label, children, className = '' }) {
  if (!children) return null
  return (
    <div className={`rounded-[16px] p-5 ${className}`}>
      <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-2">{label}</p>
      <p className="text-[14px] text-ink font-sans leading-relaxed">{children}</p>
    </div>
  )
}

function AftercareItem({ item }) {
  return (
    <div className={`rounded-[12px] p-4 ${item.is_warning ? '' : 'bg-cream-deep'}`}
         style={item.is_warning ? { background: '#FEF4E8' } : {}}>
      <div className="flex gap-2">
        {item.is_warning && <span className="text-[14px] shrink-0 mt-0.5">⚠️</span>}
        <div>
          <p className="text-[10px] font-sans tracking-[0.2em] text-ink-muted uppercase mb-1">
            第 {item.day_start}{item.day_end !== item.day_start ? `–${item.day_end}` : ''} 天
          </p>
          <p className="text-[13px] text-ink font-sans leading-relaxed">{item.content}</p>
        </div>
      </div>
    </div>
  )
}

export default function KnowledgeDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [treatment, setTreatment] = useState(null)
  const [aftercare, setAftercare] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    setLoading(true)
    const [treatRes, careRes] = await Promise.all([
      supabase.from('kb_treatments')
        .select('*, kb_categories(name)')
        .eq('id', id)
        .single(),
      supabase.from('kb_aftercare')
        .select('*')
        .eq('kb_treatment_id', id)
        .order('sort_order'),
    ])
    setTreatment(treatRes.data)
    setAftercare(careRes.data ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto pb-16">
          <div className="pt-10 space-y-4">
            <div className="h-8 bg-white rounded-xl animate-pulse w-48" />
            <div className="bg-white rounded-[20px] h-48 animate-pulse" />
            <div className="bg-white rounded-[20px] h-64 animate-pulse" />
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
            <p className="text-ink-muted mb-4">内容不存在</p>
            <button onClick={() => navigate('/knowledge')} className="btn-primary max-w-[140px]">返回知识库</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto pb-16">

        {/* Back */}
        <div className="pt-8 mb-6">
          <button onClick={() => navigate('/knowledge')}
            className="text-[12px] text-ink-muted font-sans hover:text-ink transition-colors">
            ← 返回知识库
          </button>
        </div>

        {/* Title */}
        <div className="mb-2">
          {treatment.kb_categories?.name && (
            <span className="text-[10px] font-sans tracking-[0.2em] text-gold uppercase">
              {treatment.kb_categories.name}
            </span>
          )}
          <h1 className="text-[28px] text-ink mt-1"
              style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            {treatment.name}
          </h1>
        </div>

        {/* Price + duration pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {(treatment.price_min || treatment.price_max) && (
            <span className="text-[11px] font-sans px-3 py-1 rounded-full"
                  style={{ background: '#F5F0E8', color: '#B89B6E' }}>
              {treatment.price_min && treatment.price_max
                ? `¥${Number(treatment.price_min).toLocaleString()} – ¥${Number(treatment.price_max).toLocaleString()}`
                : treatment.price_min
                  ? `¥${Number(treatment.price_min).toLocaleString()} 起`
                  : `¥${Number(treatment.price_max).toLocaleString()} 以内`}
            </span>
          )}
          {treatment.duration && (
            <span className="text-[11px] font-sans px-3 py-1 rounded-full bg-cream-deep text-ink-muted">
              维持 {treatment.duration}
            </span>
          )}
        </div>

        {/* Description */}
        {treatment.description && (
          <p className="text-[14px] text-ink-soft font-sans leading-relaxed mb-6">
            {treatment.description}
          </p>
        )}

        {/* Info blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <InfoBlock label="适合人群" className="bg-white shadow-sm">
            {treatment.suitable_for}
          </InfoBlock>
          <InfoBlock label="不适合人群" className="bg-white shadow-sm">
            {treatment.not_suitable_for}
          </InfoBlock>
        </div>

        {/* Aftercare */}
        {aftercare.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-4">
              术后注意事项
            </p>
            <div className="space-y-3">
              {aftercare.map(item => <AftercareItem key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-blush-light rounded-[20px] p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] text-ink mb-1"
               style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
              你有做过这个项目吗？
            </p>
            <p className="text-[12px] text-ink-muted font-sans">记录你的真实体验</p>
          </div>
          <button
            onClick={() => navigate('/treatments')}
            className="shrink-0 px-5 py-2.5 bg-ink text-cream rounded-full text-[12px] font-sans
                       tracking-[0.08em] hover:bg-[#2C2826] transition-colors whitespace-nowrap">
            去记录
          </button>
        </div>
      </main>
    </div>
  )
}
