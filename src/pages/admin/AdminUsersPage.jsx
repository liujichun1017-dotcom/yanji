import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminUsersPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('treatments')
        .select('user_id, cost, treatment_date')
        .order('treatment_date', { ascending: false })

      if (!data) { setLoading(false); return }

      // Aggregate by user_id
      const map = {}
      for (const t of data) {
        if (!map[t.user_id]) {
          map[t.user_id] = { user_id: t.user_id, count: 0, total: 0, latest: t.treatment_date }
        }
        map[t.user_id].count++
        map[t.user_id].total += Number(t.cost ?? 0)
        if (t.treatment_date > map[t.user_id].latest) map[t.user_id].latest = t.treatment_date
      }

      setRows(Object.values(map).sort((a, b) => b.count - a.count))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">用户数据</h2>
        <p className="text-slate-400 text-sm mt-1">只读视图 · 按治疗记录聚合（用户 ID 已脱敏）</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">加载中…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-400 text-sm">暂无用户数据</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">用户 ID（截取）</th>
                <th className="text-left px-5 py-3 font-medium">治疗记录数</th>
                <th className="text-left px-5 py-3 font-medium">累计消费</th>
                <th className="text-left px-5 py-3 font-medium">最近记录</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.user_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="px-5 py-3.5 text-slate-700">{r.count} 条</td>
                  <td className="px-5 py-3.5 text-slate-700">¥{r.total.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{r.latest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
