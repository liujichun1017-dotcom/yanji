import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function KnowledgeWarningsPage() {
  const navigate  = useNavigate()
  const [warnings, setWarnings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.from('kb_warnings').select('*').order('sort_order')
      .then(({ data }) => { setWarnings(data ?? []); setLoading(false) })
  }, [])

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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] text-ink mb-2"
              style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            避雷指南
          </h1>
          <div className="bg-[#FEF4E8] rounded-[14px] px-4 py-3">
            <p className="text-[12px] text-[#92400E] font-sans leading-relaxed">
              以下内容基于常见套路整理，仅作参考，不针对任何具体机构
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-[16px] h-24 animate-pulse" />)}
          </div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] text-ink-muted">暂无内容</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map(w => (
              <div key={w.id}
                className="bg-white rounded-[16px] overflow-hidden shadow-sm flex">
                {/* Gold left border */}
                <div className="w-[3px] shrink-0 bg-gold" />
                <div className="px-5 py-4 flex-1">
                  <p className="text-[15px] text-ink mb-1.5"
                     style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
                    {w.title}
                  </p>
                  <p className="text-[13px] text-ink-soft font-sans leading-relaxed">
                    {w.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
