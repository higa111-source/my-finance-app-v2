import { Home, UtensilsCrossed, ShoppingBag, Gamepad2, Users, Baby, Tag, Wallet, Banknote, Gift, HandCoins, Undo2, CircleDollarSign } from 'lucide-react'

const palette = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', solid: 'bg-slate-500', ring: 'ring-slate-400', hex: '#64748b' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', solid: 'bg-orange-500', ring: 'ring-orange-400', hex: '#f97316' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', solid: 'bg-emerald-500', ring: 'ring-emerald-400', hex: '#10b981' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', solid: 'bg-violet-500', ring: 'ring-violet-400', hex: '#8b5cf6' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', solid: 'bg-pink-500', ring: 'ring-pink-400', hex: '#ec4899' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', solid: 'bg-sky-500', ring: 'ring-sky-400', hex: '#0ea5e9' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', solid: 'bg-blue-600', ring: 'ring-blue-500', hex: '#2563eb' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', solid: 'bg-teal-600', ring: 'ring-teal-500', hex: '#0d9488' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-500', solid: 'bg-gray-500', ring: 'ring-gray-400', hex: '#6b7280' },
}

const bigCategoryVisuals = {
  'インフラ': { icon: Home, colorKey: 'slate', mode: 'group' },
  '食費': { icon: UtensilsCrossed, colorKey: 'orange', mode: 'direct' },
  '日用品': { icon: ShoppingBag, colorKey: 'emerald', mode: 'direct' },
  '趣味・娯楽': { icon: Gamepad2, colorKey: 'violet', mode: 'group' },
  '交際': { icon: Users, colorKey: 'pink', mode: 'group' },
  '子ども': { icon: Baby, colorKey: 'sky', mode: 'direct' },
  '収入': { icon: Wallet, colorKey: 'blue', mode: 'direct' },
}

const defaultVisual = { icon: Tag, colorKey: 'gray', mode: 'direct' }

export function getCategoryVisual(bigCategoryName) {
  const visual = bigCategoryVisuals[bigCategoryName] || defaultVisual
  return { ...visual, palette: palette[visual.colorKey] }
}

// 収入の小カテゴリは、アイコンの形で種類、色で人を区別する。名前に含まれる文字で判定する。
const incomeIcons = [['給与', Banknote], ['賞与', Gift], ['手当', HandCoins], ['還付', Undo2]]
// 円グラフ用。同じ人の中では種類ごとに濃さを変える（並びは incomeIcons + その他）
const incomePeople = [
  { word: '夫', colorKey: 'blue', shades: ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#1e3a8a'] },
  { word: '妻', colorKey: 'pink', shades: ['#be185d', '#ec4899', '#f472b6', '#f9a8d4', '#831843'] },
]
const sharedIncome = { colorKey: 'teal', shades: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#0d9488'] }

export function getIncomeVisual(smallCategoryName) {
  const name = smallCategoryName || ''
  const found = incomeIcons.findIndex(([word]) => name.includes(word))
  const index = found === -1 ? incomeIcons.length : found
  const person = incomePeople.find((p) => name.includes(p.word)) || sharedIncome
  return {
    icon: incomeIcons[index]?.[1] || CircleDollarSign,
    palette: palette[person.colorKey],
    hex: person.shades[index],
  }
}
