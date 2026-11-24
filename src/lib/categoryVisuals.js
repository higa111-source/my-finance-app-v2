import { Home, UtensilsCrossed, ShoppingBag, Gamepad2, Users, Baby, Tag } from 'lucide-react'

const palette = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', solid: 'bg-slate-500', ring: 'ring-slate-400', hex: '#64748b' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', solid: 'bg-orange-500', ring: 'ring-orange-400', hex: '#f97316' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', solid: 'bg-emerald-500', ring: 'ring-emerald-400', hex: '#10b981' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', solid: 'bg-violet-500', ring: 'ring-violet-400', hex: '#8b5cf6' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', solid: 'bg-pink-500', ring: 'ring-pink-400', hex: '#ec4899' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', solid: 'bg-sky-500', ring: 'ring-sky-400', hex: '#0ea5e9' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-500', solid: 'bg-gray-500', ring: 'ring-gray-400', hex: '#6b7280' },
}

const bigCategoryVisuals = {
  'インフラ': { icon: Home, colorKey: 'slate', mode: 'group' },
  '食費': { icon: UtensilsCrossed, colorKey: 'orange', mode: 'direct' },
  '日用品': { icon: ShoppingBag, colorKey: 'emerald', mode: 'direct' },
  '趣味・娯楽': { icon: Gamepad2, colorKey: 'violet', mode: 'group' },
  '交際': { icon: Users, colorKey: 'pink', mode: 'group' },
  '子ども': { icon: Baby, colorKey: 'sky', mode: 'direct' },
}

const defaultVisual = { icon: Tag, colorKey: 'gray', mode: 'direct' }

export function getCategoryVisual(bigCategoryName) {
  const visual = bigCategoryVisuals[bigCategoryName] || defaultVisual
  return { ...visual, palette: palette[visual.colorKey] }
}
