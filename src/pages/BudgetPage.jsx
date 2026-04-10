import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES, getCategoryMeta, formatMoney } from '../lib/constants'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-sand rounded-[10px] px-3 py-2 shadow-md text-[12px] font-sans">
      <p className="text-ink-muted mb-0.5">{label}</p>
      <p className="text-ink font-sans">{formatMoney(payload[0].value)}</p>
    </div>
  )
}

export default function BudgetPage() {
  const { user } = useAuth()

  const [year,       setYear]       = useState(CURRENT_YEAR)
  const [budget,     setBudget]     = useState(null)
  const [budgetInput,setBudgetInput]= useState('')
  const [treatments, setTreatments] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [editBudget, setEditBudget] = useState(false)

  useEffect(() => { fetchData() }, [year])

  async function fetchData() {
    setLoading(true)
    const yearStart = `${year}-01-01`
    const yearEnd   = `${year}-12-31`

    const [budgetRes, treatRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('year', year).maybeSingle(),
      supabase.from('treatments').select('cost, category, treatment_date')
        .eq('user_id', user.id)
        .gte('treatment_date', yearStart).lte('treatment_date', yearEnd),
    ])

    setBudget(budgetRes.data)
    setBudgetInput(budgetRes.data?.amount ?? '')
    setTreatments(treatRes.data ?? [])
    setLoading(false)
  }

  async function saveBudget() {
    const amount = parseFloat(String(budgetInput).replace(/[^0-9.]/g, ''))
    if (isNaN(amount) || amount <= 0) return
    setSaving(true)
    if (budget?.id) {
      await supabase.from('budgets').update({ amount }).eq('id', budget.id)
    } else {
      await supabase.from('budgets').insert({ user_id: user.id, year, amount })
    }
    await fetchData()
    setEditBudget(false)
    setSaving(false)
  }

  // ── Chart data ─────────────────────────────────────────────────────────
  const categoryData = CATEGORIES.map(cat => ({
    name: cat.value,
    icon: cat.icon,
    amount: treatments.filter(t => t.category === cat.value).reduce((s, t) => s + (t.cost ?? 0), 0),
  })).filter(d => d.amount > 0)

  const monthData = MONTH_NAMES.map((name, i) => ({
    name,
    amount: treatments
      .filter(t => new Date(t.treatment_date).getMonth() === i)
      .reduce((s, t) => s + (t.cost ?? 0), 0),
  }))

  const totalSpent = treatments.reduce((s, t) => s + (t.cost ?? 0), 0)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-4xl mx-auto pb-16">

        {/* ── Header ── */}
        <div className="pt-10 pb-8 flex items-center justify-between">
          <h1 className="text-[22px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            预算
          </h1>
          {/* Year selector */}
          <div className="flex gap-1">
            {YEARS.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-sans transition-colors ${
                  y === year ? 'bg-ink text-cream' : 'bg-cream-deep text-ink-soft hover:bg-sand'
                }`}>
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* ── Budget setting card ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm mb-6">
          <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-4">
            {year} 年度预算
          </p>
          {!editBudget ? (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[36px] text-ink italic leading-none"
                   style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                  {budget?.amount ? formatMoney(budget.amount) : '未设置'}
                </p>
                {budget?.amount > 0 && (
                  <p className="text-[12px] text-ink-muted font-sans mt-1">
                    已消费 {formatMoney(totalSpent)} · 剩余 {formatMoney(Math.max(0, budget.amount - totalSpent))}
                  </p>
                )}
              </div>
              <button onClick={() => setEditBudget(true)}
                className="px-5 py-2 bg-cream-deep text-ink-soft rounded-full text-[12px] font-sans hover:bg-sand transition-colors">
                {budget?.amount ? '修改预算' : '设置预算'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-[14px]">¥</span>
                <input type="number" min="0"
                  className="input-field pl-7"
                  placeholder="输入年度预算金额"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveBudget()} />
              </div>
              <button onClick={saveBudget} disabled={saving}
                className="px-5 py-3 bg-ink text-cream rounded-full text-[12px] font-sans hover:bg-[#2C2826] transition-colors whitespace-nowrap">
                {saving ? '保存中…' : '保 存'}
              </button>
              <button onClick={() => setEditBudget(false)}
                className="px-4 py-3 bg-cream-deep text-ink-muted rounded-full text-[12px] font-sans hover:bg-sand transition-colors">
                取消
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-5">
            <div className="bg-white rounded-[20px] h-56 animate-pulse" />
            <div className="bg-white rounded-[20px] h-56 animate-pulse" />
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-ink-muted">{year} 年暂无消费记录</p>
          </div>
        ) : (
          <>
            {/* ── Category Bar Chart ── */}
            {categoryData.length > 0 && (
              <div className="bg-white rounded-[20px] p-6 shadow-sm mb-5">
                <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-6">分类消费</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A5A0" />
                        <stop offset="100%" stopColor="#D4BC96" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8DECE" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#78716C', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `¥${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FAF7F2' }} />
                    <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Monthly Line Chart ── */}
            <div className="bg-cream-deep rounded-[20px] p-6 shadow-sm mb-5">
              <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-6">月度消费</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#D4A5A0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D4A5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DECE" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v === 0 ? '' : `¥${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D4A5A0', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="amount" stroke="#D4A5A0" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 3, fill: '#D4A5A0', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#D4A5A0' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Category breakdown list ── */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <p className="text-[10px] font-sans tracking-[0.25em] text-ink-muted uppercase mb-4">分类明细</p>
              <div className="space-y-0">
                {CATEGORIES.map((cat, i) => {
                  const catTotal = treatments
                    .filter(t => t.category === cat.value)
                    .reduce((s, t) => s + (t.cost ?? 0), 0)
                  const count = treatments.filter(t => t.category === cat.value).length
                  if (count === 0) return null
                  const pct = totalSpent > 0 ? Math.round((catTotal / totalSpent) * 100) : 0
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center gap-3 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] shrink-0 ${cat.bg}`}>
                          {cat.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] text-ink font-sans">{cat.value}</span>
                            <span className="text-[13px] text-ink italic"
                                  style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                              {formatMoney(catTotal)}
                            </span>
                          </div>
                          <div className="h-1 bg-cream-deep rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blush"
                                 style={{ width: `${pct}%`, transition: 'width 0.6s ease-out' }} />
                          </div>
                          <p className="text-[10px] text-ink-muted mt-0.5">{count} 次 · {pct}%</p>
                        </div>
                      </div>
                      {i < CATEGORIES.length - 1 && <div className="h-px bg-sand" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
