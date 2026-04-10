import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function PriceTag({ min, max }) {
  if (!min && !max) return null
  const label = min && max
    ? `¥${Number(min).toLocaleString()} – ¥${Number(max).toLocaleString()}`
    : min ? `¥${Number(min).toLocaleString()} 起` : `¥${Number(max).toLocaleString()} 以内`
  return (
    <span className="inline-block text-[10px] font-sans px-2 py-0.5 rounded-full"
          style={{ background: '#F5F0E8', color: '#B89B6E' }}>
      {label}
    </span>
  )
}

export default function KnowledgePage() {
  const navigate = useNavigate()

  const [categories,  setCategories]  = useState([])
  const [treatments,  setTreatments]  = useState([])
  const [activeId,    setActiveId]    = useState(null)
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [catRes, treatRes] = await Promise.all([
      supabase.from('kb_categories').select('*').order('sort_order'),
      supabase.from('kb_treatments').select('*, kb_categories(name)').order('name'),
    ])
    const cats = catRes.data ?? []
    setCategories(cats)
    setTreatments(treatRes.data ?? [])
    if (cats.length > 0) setActiveId(cats[0].id)
    setLoading(false)
  }

  const filtered = treatments.filter(t => {
    const matchesCat = !activeId || t.category_id === activeId
    const matchesSearch = !search || t.name.includes(search) ||
      (t.suitable_for ?? '').includes(search)
    return search ? matchesSearch : matchesCat
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 max-w-5xl mx-auto px-4 md:px-8 pb-16">

        {/* ── Page header ── */}
        <div className="pt-10 pb-6 flex items-center justify-between">
          <h1 className="text-[22px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            知识库
          </h1>
          <button
            onClick={() => navigate('/knowledge/warnings')}
            className="text-[12px] font-sans text-gold hover:underline flex items-center gap-1">
            ⚠️ 避雷指南 →
          </button>
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <input
            type="text"
            className="input-field max-w-sm"
            placeholder="搜索项目名称…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[20px] h-40 animate-pulse" />)}
          </div>
        ) : (
          <div className="md:flex gap-6">

            {/* ── Left sidebar (desktop) ── */}
            <aside className="hidden md:block w-44 shrink-0">
              <div className="sticky top-20 space-y-1">
                {categories.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setActiveId(cat.id); setSearch('') }}
                    className={`w-full text-left px-4 py-2.5 rounded-[10px] text-[13px] font-sans transition-colors ${
                      activeId === cat.id && !search
                        ? 'bg-ink text-cream'
                        : 'text-ink-soft hover:bg-cream-deep'
                    }`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </aside>

            {/* ── Mobile category tabs ── */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
              {categories.map(cat => (
                <button key={cat.id}
                  onClick={() => { setActiveId(cat.id); setSearch('') }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-sans transition-colors ${
                    activeId === cat.id && !search
                      ? 'bg-ink text-cream'
                      : 'bg-cream-deep text-ink-soft'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* ── Right content ── */}
            <div className="flex-1 min-w-0">
              {search && (
                <p className="text-[12px] text-ink-muted mb-4 font-sans">
                  搜索「{search}」找到 {filtered.length} 条结果
                </p>
              )}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[13px] text-ink-muted">暂无相关内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map(t => (
                    <div key={t.id}
                      onClick={() => navigate(`/knowledge/${t.id}`)}
                      className="bg-white rounded-[20px] p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md shadow-sm transition-all duration-200">
                      <p className="text-[16px] text-ink mb-2"
                         style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
                        {t.name}
                      </p>
                      {t.suitable_for && (
                        <p className="text-[12px] text-ink-muted font-sans mb-3 line-clamp-2 leading-relaxed">
                          {t.suitable_for}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <PriceTag min={t.price_min} max={t.price_max} />
                        {t.duration && (
                          <span className="text-[10px] font-sans text-ink-muted">
                            维持 {t.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
