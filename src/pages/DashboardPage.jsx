import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TreatmentModal from '../components/TreatmentModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney } from '../lib/constants'

// ── Count-up animation hook ──────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let startTime = null
    const animate = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2)
      setValue(Math.floor(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])
  return value
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function todayLabel() {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).toUpperCase()
}

// ── Status badge ─────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    '已完成': 'bg-[#B89B6E]',
    '恢复中': 'bg-blush',
    '待预约': 'bg-ink-muted',
    '已取消': 'bg-gray-300',
  }
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[status] ?? 'bg-sand'}`} />
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [loading,          setLoading]          = useState(true)
  const [treatmentCount,   setTreatmentCount]   = useState(0)
  const [totalSpent,       setTotalSpent]        = useState(0)
  const [budget,           setBudget]            = useState(null)
  const [recentItems,      setRecentItems]       = useState([])
  const [aftercare,        setAftercare]         = useState(null)   // { treatment, care, daysSince }
  const [showModal,        setShowModal]         = useState(false)

  // Animated values
  const animSpent    = useCountUp(Math.round(totalSpent))
  const [barWidth,   setBarWidth] = useState(0)

  const percentage = budget?.amount > 0
    ? Math.min(Math.round((totalSpent / budget.amount) * 100), 100)
    : 0

  useEffect(() => {
    fetchAll()
  }, [])

  // Trigger bar animation after data loads
  useEffect(() => {
    if (!loading && percentage > 0) {
      const t = setTimeout(() => setBarWidth(percentage), 80)
      return () => clearTimeout(t)
    }
  }, [loading, percentage])

  async function fetchAll() {
    setLoading(true)
    const year      = new Date().getFullYear()
    const yearStart = `${year}-01-01`
    const yearEnd   = `${year}-12-31`

    const [countRes, spentRes, budgetRes, recentRes, recoveringRes] = await Promise.all([
      supabase.from('treatments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('treatment_date', yearStart).lte('treatment_date', yearEnd),

      supabase.from('treatments')
        .select('cost')
        .eq('user_id', user.id)
        .gte('treatment_date', yearStart).lte('treatment_date', yearEnd),

      supabase.from('budgets')
        .select('*')
        .eq('user_id', user.id).eq('year', year)
        .maybeSingle(),

      supabase.from('treatments')
        .select('id, name, treatment_date, status, clinics(name)')
        .eq('user_id', user.id)
        .order('treatment_date', { ascending: false })
        .limit(3),

      supabase.from('treatments')
        .select('id, name, treatment_date, kb_treatment_id, kb_treatments(name)')
        .eq('user_id', user.id).eq('status', '恢复中')
        .order('treatment_date', { ascending: false })
        .limit(1),
    ])

    const count   = countRes.count ?? 0
    const spent   = (spentRes.data ?? []).reduce((s, t) => s + (t.cost ?? 0), 0)
    const bgt     = budgetRes.data
    const recent  = recentRes.data ?? []
    const recovering = recoveringRes.data?.[0]

    setTreatmentCount(count)
    setTotalSpent(spent)
    setBudget(bgt)
    setRecentItems(recent)

    // Aftercare lookup
    if (recovering?.kb_treatment_id) {
      const today     = new Date()
      const treatDate = new Date(recovering.treatment_date)
      const daysSince = Math.floor((today - treatDate) / (1000 * 60 * 60 * 24))
      const { data: careData } = await supabase
        .from('kb_aftercare')
        .select('*')
        .eq('kb_treatment_id', recovering.kb_treatment_id)
        .lte('day_start', daysSince)
        .gte('day_end', daysSince)
        .limit(1)
      if (careData?.length > 0) {
        setAftercare({ treatment: recovering, care: careData[0], daysSince })
      }
    }
    setLoading(false)
  }

  const isEmpty = !loading && treatmentCount === 0

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-5xl mx-auto pb-16">

        {/* ── Greeting ── */}
        <div className="pt-10 pb-8">
          <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-3">
            {todayLabel()}
          </p>
          <h1 className="text-[22px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            {getGreeting()}，这是你今年第{' '}
            <span className="text-blush">{loading ? '…' : treatmentCount}</span>{' '}
            次记录 ✦
          </h1>
        </div>

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full border border-sand flex items-center justify-center mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-sand" />
            </div>
            <p className="text-[14px] text-ink-muted mb-6">还没有记录，开始你的第一次</p>
            <button onClick={() => setShowModal(true)} className="btn-primary max-w-[200px]">
              记录第一个项目
            </button>
          </div>
        )}

        {/* ── Cards grid ── */}
        {!isEmpty && !loading && (
          <div className="grid md:grid-cols-3 gap-5">

            {/* ── Budget card (spans 2 cols) ── */}
            <div className="md:col-span-2 bg-white rounded-[20px] p-7 shadow-sm">
              <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-5">
                {new Date().getFullYear()} 年度预算
              </p>

              {budget ? (
                <>
                  {/* Big spent number */}
                  <div className="mb-1">
                    <span
                      className="text-[40px] text-ink leading-none italic"
                      style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                      ¥{animSpent.toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-muted mb-5 font-sans">
                    / {formatMoney(budget.amount)}
                  </p>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-cream-deep rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        transition: 'width 0.8s ease-out',
                        background: 'linear-gradient(to right, #D4A5A0, #D4BC96)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-ink-muted font-sans mb-6">
                    <span>已消费 {percentage}%</span>
                    <span>剩余 {formatMoney(Math.max(0, budget.amount - totalSpent))}</span>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-cream-deep rounded-[10px] p-4">
                      <p className="text-[10px] font-sans tracking-[0.2em] text-ink-muted uppercase mb-1">项目次数</p>
                      <p className="text-[24px] text-ink italic leading-none"
                         style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                        {treatmentCount}
                      </p>
                    </div>
                    <div className="bg-cream-deep rounded-[10px] p-4">
                      <p className="text-[10px] font-sans tracking-[0.2em] text-ink-muted uppercase mb-1">平均单次</p>
                      <p className="text-[24px] text-ink italic leading-none"
                         style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                        {treatmentCount > 0 ? formatMoney(Math.round(totalSpent / treatmentCount)) : '—'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* No budget set */
                <div className="flex flex-col items-center py-6">
                  <p className="text-[14px] text-ink-muted mb-4">尚未设置年度预算</p>
                  <button onClick={() => navigate('/budget')}
                    className="px-6 py-2.5 bg-ink text-cream rounded-full text-[12px] font-sans tracking-[0.08em] hover:bg-[#2C2826] transition-colors">
                    设置年度预算
                  </button>
                </div>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-5">

              {/* Recent treatments */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-4">最近项目</p>
                {recentItems.length === 0 ? (
                  <p className="text-[12px] text-ink-muted">暂无记录</p>
                ) : (
                  <div className="space-y-0">
                    {recentItems.map((t, i) => (
                      <div key={t.id}>
                        <div
                          className="flex items-center gap-3 py-3 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => navigate(`/treatments/${t.id}`)}>
                          <StatusDot status={t.status} />
                          <span className="flex-1 text-[13px] text-ink truncate">{t.name}</span>
                          <span className="text-[11px] text-ink-muted shrink-0">
                            {new Date(t.treatment_date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                        {i < recentItems.length - 1 && <div className="h-px bg-sand" />}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => navigate('/treatments')}
                  className="mt-3 text-[11px] text-gold hover:underline font-sans">
                  查看全部 →
                </button>
              </div>

              {/* Aftercare reminder */}
              {aftercare && (
                <div className="bg-blush-light rounded-[20px] p-6 shadow-sm">
                  <p className="text-[10px] font-sans tracking-[0.25em] text-ink-soft uppercase mb-3">术后提醒</p>
                  <p className="text-[13px] font-sans text-ink-soft mb-2">
                    📌 {aftercare.treatment.kb_treatments?.name ?? aftercare.treatment.name} · 术后第 {aftercare.daysSince} 天
                  </p>
                  <p className="text-[12px] text-ink-soft leading-relaxed">
                    {aftercare.care.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white rounded-[20px] p-7 h-64 animate-pulse" />
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-[20px] p-6 h-44 animate-pulse" />
            </div>
          </div>
        )}
      </main>

      {/* New treatment modal */}
      {showModal && (
        <TreatmentModal
          onSave={() => { setShowModal(false); fetchAll() }}
          onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
