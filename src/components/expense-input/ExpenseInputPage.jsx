import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import { toDateInputValue } from '../../lib/date'
import DateNav from './DateNav'
import CategoryGrid from '../shared/CategoryGrid'
import CategoryPickerSheet from '../shared/CategoryPickerSheet'
import NumericKeypad from '../shared/NumericKeypad'

function ExpenseInputPage() {
  const userName = useUserName()
  const { bigCategories, smallCategoriesByBig, tiles } = useCategoryTiles()

  const [date, setDate] = useState(new Date())
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedBig, setSelectedBig] = useState(null)
  const [selectedSmall, setSelectedSmall] = useState(null)
  const [sheetBigId, setSheetBigId] = useState(null)
  const [message, setMessage] = useState('')

  const sheetBigCategory = bigCategories.find((bc) => bc.big_category_id === sheetBigId)

  const handleSelectDirect = (tile) => {
    setSelectedBig(tile.bigId)
    setSelectedSmall(tile.smallId)
  }

  const handleOpenGroup = (tile) => {
    setSheetBigId(tile.bigId)
  }

  const handlePickFromSheet = (smallId) => {
    setSelectedBig(sheetBigId)
    setSelectedSmall(smallId)
    setSheetBigId(null)
  }

  const handleSubmit = async () => {
    if (!selectedBig || !amount) {
      setMessage('❌ カテゴリと金額は必須です')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const { error } = await supabase.from('expenses').insert([{
        date: toDateInputValue(date),
        big_category_id: selectedBig,
        small_category_id: selectedSmall,
        note,
        amount: Number(amount),
        created_by: userName,
        last_updated_by: userName,
      }])
      if (error) throw error

      setNote('')
      setAmount('')
      setSelectedBig(null)
      setSelectedSmall(null)
      setMessage('✅ 支出を登録しました')
    } catch (err) {
      console.error('支出登録失敗', err)
      setMessage('❌ 登録に失敗しました')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DateNav
        date={date}
        onPrevDay={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
        onNextDay={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
        onSetDate={setDate}
      />

      <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ欄"
          className="w-full flex-1 text-base text-gray-700 placeholder:text-gray-300 focus:outline-none"
        />
        <button type="button" onClick={() => setNote('')} className="text-gray-300">
          <X size={18} />
        </button>
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <span className="mr-2 text-sm font-bold text-orange-500">支出</span>
        <span className="text-2xl font-bold text-gray-800">
          ¥ {amount ? Number(amount).toLocaleString() : 0}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-orange-50/40">
        <div className="px-4 py-2 text-xs font-bold text-gray-400">カテゴリ</div>

        <CategoryGrid
          tiles={tiles}
          selectedBig={selectedBig}
          selectedSmall={selectedSmall}
          onSelectDirect={handleSelectDirect}
          onOpenGroup={handleOpenGroup}
        />
      </div>

      {message && (
        <div className={`px-4 py-2 text-center text-sm ${message.includes('❌') ? 'text-red-500' : 'text-emerald-600'}`}>
          {message}
        </div>
      )}

      <div>
        <NumericKeypad value={amount} onChange={setAmount} onConfirm={handleSubmit} />
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-orange-100 py-3 text-base font-bold text-orange-500"
          >
            支出を入力する
          </button>
        </div>
      </div>

      {sheetBigCategory && (
        <CategoryPickerSheet
          bigCategoryName={sheetBigCategory.big_category_name}
          smallCategories={smallCategoriesByBig[sheetBigId] || []}
          onSelect={handlePickFromSheet}
          onClose={() => setSheetBigId(null)}
        />
      )}
    </div>
  )
}

export default ExpenseInputPage
