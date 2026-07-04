import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import { toDateInputValue, fromDateInputValue } from '../../lib/date'
import CategoryGrid from '../shared/CategoryGrid'
import CategoryPickerSheet from '../shared/CategoryPickerSheet'
import NumericKeypad from '../shared/NumericKeypad'

function ExpenseEditView({ expense, onCancel, onSaved, onDeleted }) {
  const userName = useUserName()
  const { bigCategories, smallCategoriesByBig, tiles } = useCategoryTiles()

  const [date, setDate] = useState(fromDateInputValue(expense.date))
  const [note, setNote] = useState(expense.note || '')
  const [amount, setAmount] = useState(String(expense.amount ?? ''))
  const [selectedBig, setSelectedBig] = useState(expense.big_category_master?.big_category_id ?? null)
  const [selectedSmall, setSelectedSmall] = useState(expense.small_category_master?.small_category_id ?? null)
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

  const handleSave = async () => {
    if (!selectedBig || !amount) {
      setMessage('❌ カテゴリと金額は必須です')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    const { error } = await supabase
      .from('expenses')
      .update({
        date: toDateInputValue(date),
        big_category_id: selectedBig,
        small_category_id: selectedSmall,
        note,
        amount: Number(amount),
        last_updated_by: userName,
      })
      .eq('id', expense.id)

    if (error) {
      console.error('更新失敗', error)
      setMessage('❌ 更新に失敗しました')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    onSaved()
  }

  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) return
    const { error } = await supabase
      .from('expenses')
      .update({ delete_flg: true })
      .eq('id', expense.id)

    if (error) {
      console.error('削除失敗', error)
      setMessage('❌ 削除に失敗しました')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    onDeleted()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <button type="button" onClick={onCancel} className="text-sm text-gray-400">キャンセル</button>
        <span className="text-sm font-bold text-gray-600">支出を編集</span>
        <button type="button" onClick={handleDelete} className="text-sm text-red-400">削除</button>
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-3 text-center">
        <input
          type="date"
          value={toDateInputValue(date)}
          onChange={(e) => e.target.value && setDate(fromDateInputValue(e.target.value))}
          className="text-base text-gray-700"
        />
      </div>

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
        <div className="px-4 py-2 text-center text-sm text-red-500">{message}</div>
      )}

      <div>
        <NumericKeypad value={amount} onChange={setAmount} onConfirm={handleSave} />
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-orange-100 py-3 text-base font-bold text-orange-500"
          >
            保存する
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

export default ExpenseEditView
