import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'
import useAuth from '../../hooks/authContext'
import { needsLogin } from '../../lib/auth'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import { toDateInputValue, fromDateInputValue } from '../../lib/date'
import { KIND_THEME, kindOfRow } from '../../lib/kind'
import CategoryGrid from '../shared/CategoryGrid'
import CategoryPickerSheet from '../shared/CategoryPickerSheet'
import NumericKeypad from '../shared/NumericKeypad'

function ExpenseEditView({ expense, onCancel, onSaved, onDeleted }) {
  const userName = useUserName()
  const { requestLogin } = useAuth()
  // 支出と収入の間の付け替えはできないよう、同じ区分のカテゴリだけ出す
  const kind = kindOfRow(expense)
  const theme = KIND_THEME[kind]
  const { bigCategories, smallCategoriesByBig, tiles } = useCategoryTiles(kind)

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
    const { data, error } = await supabase
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
      .select('id')

    if (needsLogin(error, data)) {
      requestLogin(handleSave)
      return
    }
    if (error || data.length === 0) {
      console.error('更新失敗', error)
      setMessage('❌ 更新に失敗しました')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    onSaved()
  }

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？')) deleteExpense()
  }

  const deleteExpense = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .update({ delete_flg: true })
      .eq('id', expense.id)
      .select('id')

    if (needsLogin(error, data)) {
      requestLogin(deleteExpense)
      return
    }
    if (error || data.length === 0) {
      console.error('削除失敗', error)
      setMessage('❌ 削除に失敗しました')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    onDeleted()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`flex items-center justify-between px-4 py-3 ${theme.row}`}>
        <button type="button" onClick={onCancel} className="text-sm text-gray-400">キャンセル</button>
        <span className="text-sm font-bold text-gray-600">{theme.label}を編集</span>
        <button type="button" onClick={handleDelete} className="text-sm text-red-400">削除</button>
      </div>

      <div className={`border-t border-gray-100 px-4 py-3 text-center ${theme.row}`}>
        <input
          type="date"
          value={toDateInputValue(date)}
          onChange={(e) => e.target.value && setDate(fromDateInputValue(e.target.value))}
          className="text-base text-gray-700"
        />
      </div>

      <div className={`flex items-center gap-2 border-t border-gray-100 px-4 py-3 ${theme.row}`}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            // 変換確定の Enter では閉じない
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) e.currentTarget.blur()
          }}
          enterKeyHint="done"
          placeholder="メモ欄"
          className="w-full flex-1 text-base text-gray-700 placeholder:text-gray-300 focus:outline-none"
        />
        <button type="button" onClick={() => setNote('')} className="text-gray-300">
          <X size={18} />
        </button>
      </div>

      <div className={`border-t border-gray-100 px-4 py-3 ${theme.row}`}>
        <span className={`mr-2 text-sm font-bold ${theme.text}`}>{theme.label}</span>
        <span className="text-2xl font-bold text-gray-800">
          ¥ {amount ? Number(amount).toLocaleString() : 0}
        </span>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${theme.area}`}>
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
        <NumericKeypad value={amount} onChange={setAmount} onConfirm={handleSave} kind={kind} confirmLabel="確定" />
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleSave}
            className={`w-full rounded-xl py-3 text-base font-bold ${theme.soft}`}
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
