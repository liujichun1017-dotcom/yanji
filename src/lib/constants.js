export const CATEGORIES = [
  { value: '注射填充', icon: '💉', bg: 'bg-blush-light', text: 'text-blush' },
  { value: '仪器护理', icon: '🌡️', bg: 'bg-cream-deep', text: 'text-ink-muted' },
  { value: '皮肤基础', icon: '🌸', bg: 'bg-blush-light', text: 'text-blush' },
  { value: '线雕提升', icon: '✨', bg: 'bg-cream-deep', text: 'text-gold' },
  { value: '其他',    icon: '◦',  bg: 'bg-sand',       text: 'text-ink-muted' },
]

export const CATEGORY_ALL = '全部'
export const CATEGORY_VALUES = CATEGORIES.map(c => c.value)

export const STATUSES = [
  { value: '已完成', bg: 'bg-[#F5F0E8]',    text: 'text-[#B89B6E]' },
  { value: '恢复中', bg: 'bg-blush-light',   text: 'text-blush' },
  { value: '待预约', bg: 'bg-cream-deep',    text: 'text-ink-muted' },
  { value: '已取消', bg: 'bg-gray-100',      text: 'text-gray-400' },
]

export function getCategoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[4]
}

export function getStatusMeta(value) {
  return STATUSES.find(s => s.value === value) ?? STATUSES[0]
}

export function formatMoney(n, withSymbol = true) {
  if (n == null) return '—'
  const str = Number(n).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return withSymbol ? `¥${str}` : str
}

export function formatMoneyFull(n) {
  if (n == null) return '—'
  return `¥${Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
