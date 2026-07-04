import { PenLine, Receipt, PieChart, BarChart3, Repeat } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'input', label: '入力', icon: PenLine },
  { key: 'list', label: '一覧', icon: Receipt },
  { key: 'report', label: 'レポート', icon: PieChart },
  { key: 'graph', label: 'グラフ', icon: BarChart3 },
  { key: 'template', label: 'テンプレート', icon: Repeat },
]

function BottomNav({ page, onNavigate }) {
  return (
    <nav className="sticky bottom-0 grid grid-cols-5 bg-gray-800 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const active = page === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={`flex flex-col items-center gap-1 py-3 text-xs ${active ? 'text-white' : 'text-gray-400'}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
