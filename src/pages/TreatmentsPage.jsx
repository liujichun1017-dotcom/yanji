import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TreatmentModal from '../components/TreatmentModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES, STATUSES, getCategoryMeta, getStatusMeta, formatMoney } from '../lib/constants'

const FILTER_TABS = ['全部', ...CATEGORIES.map(c => c.value)]

function RatingDots({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-1.5 h-1.5 rounded-full transition-colors ${
          (rating ?? 0) >= n ? 'bg-blush' : 'bg-sand'
        }`} />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status)
  return (
    <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
      {status}
    </span>
  )
}

function TreatmentCard({ treatment, onClick }) {
  const cat = getCategoryMeta(treatment.category)
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[20px] p-5 cursor-pointer transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-md shadow-sm flex gap-4 items-start">
      {/* Category icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[18px] ${cat.bg}`}>
        {cat.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-ink truncate"
           style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
          {treatment.name}
        </p>
        <p className="text-[12px] text-ink-muted font-sans mt-0.5">
          {new Date(treatment.treatment_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          {treatment.clinics?.name && ` · ${treatment.clinics.name}`}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <RatingDots rating={treatment.rating} />
          <StatusBadge status={treatment.status} />
        </div>
      </div>

      {/* Cost */}
      <div className="shrink-0 text-right">
        <p className="text-[20px] text-ink italic leading-none"
           style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
          {treatment.cost != null ? formatMoney(treatment.cost) : '—'}
        </p>
      </div>
    </div>
  )
}

export default function TreatmentsPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [treatments,   setTreatments]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeFilter, setActiveFilter] = useState('全部')
  const [showModal,    setShowModal]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)

  useEffect(() => { fetchTreatments() }, [])

  async function fetchTreatments() {
    setLoading(true)
    const { data } = await supabase
      .from('treatments')
      .select('*, clinics(name)')
      .eq('user_id', user.id)
      .order('treatment_date', { ascending: false })
    setTreatments(data ?? [])
    setLoading(false)
  }

  const filtered = activeFilter === '全部'
    ? treatments
    : treatments.filter(t => t.category === activeFilter)

  function openCreate() { setEditTarget(null); setShowModal(true) }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-4xl mx-auto pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-10 pb-6">
          <h1 className="text-[22px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            我的项目
          </h1>
          {/* Desktop add button */}
          <button onClick={openCreate}
            className="hidden md:flex items-center gap-1.5 px-5 py-2.5 bg-ink text-cream rounded-full
                       text-[12px] font-sans tracking-[0.08em] hover:bg-[#2C2826] transition-colors">
            ＋ 记录新项目
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TABS.map(tab => (
            <button key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-sans transition-colors ${
                activeFilter === tab
                  ? 'bg-ink text-cream'
                  : 'bg-cream-deep text-ink-soft hover:bg-sand'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[20px] h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-full border border-sand flex items-center justify-center mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sand" />
            </div>
            <p className="text-[13px] text-ink-muted mb-5">
              {activeFilter === '全部' ? '还没有记录' : `暂无「${activeFilter}」类记录`}
            </p>
            {activeFilter === '全部' && (
              <button onClick={openCreate} className="btn-primary max-w-[180px]">记录第一个项目</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                onClick={() => navigate(`/treatments/${t.id}`)} />
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile FAB ── */}
      <button
        onClick={openCreate}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-ink text-cream rounded-full
                   flex items-center justify-center text-[24px] leading-none z-30 transition-transform hover:scale-105"
        style={{ boxShadow: '0 8px 24px rgba(28,25,23,0.3)' }}>
        ＋
      </button>

      {/* ── Modal ── */}
      {showModal && (
        <TreatmentModal
          treatment={editTarget}
          onSave={() => { setShowModal(false); setEditTarget(null); fetchTreatments() }}
          onClose={() => { setShowModal(false); setEditTarget(null) }} />
      )}
    </div>
  )
}
