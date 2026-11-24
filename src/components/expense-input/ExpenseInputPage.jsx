import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'
import useSubmitLock from '../../hooks/useSubmitLock'
import useAuth from '../../hooks/authContext'
import { needsLogin } from '../../lib/auth'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import { toDateInputValue } from '../../lib/date'
import { EXPENSE, INCOME, KIND_THEME } from '../../lib/kind'
import DateNav from './DateNav'
import CategoryGrid from '../shared/CategoryGrid'
import CategoryPickerSheet from '../shared/CategoryPickerSheet'
import CategoryManageSheet from '../shared/CategoryManageSheet'
import SegmentTabs from '../shared/SegmentTabs'
import NumericKeypad from '../shared/NumericKeypad'

const KIND_OPTIONS = [EXPENSE, INCOME].map((kind) => ({
  value: kind,
  label: KIND_THEME[kind].label,
  activeClass: KIND_THEME[kind].tab,
}))

function ExpenseInputPage() {
  const userName = useUserName()
  const { busy, run } = useSubmitLock()
  const { requestLogin } = useAuth()
  const [kind, setKind] = useState(EXPENSE)
  const theme = KIND_THEME[kind]
  const { bigCategories, smallCategoriesByBig, tiles, reload } = useCategoryTiles(kind)

  const [date, setDate] = useState(new Date())
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedBig, setSelectedBig] = useState(null)
  const [selectedSmall, setSelectedSmall] = useState(null)
  const [sheetBigId, setSheetBigId] = useState(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [message, setMessage] = useState('')

  const sheetBigCategory = bigCategories.find((bc) => bc.big_category_id === sheetBigId)

  // 日付・メモ・金額は残し、カテゴリの選択だけ解除する
  const changeKind = (next) => {
    if (next === kind) return
    setKind(next)
    setSelectedBig(null)
    setSelectedSmall(null)
    setSheetBigId(null)
  }

  // 何も入力せずにアプリを離れたら、次に開いたとき支出から始められるようにする
  useEffect(() => {
    if (kind === EXPENSE || amount || note || manageOpen) return
    const handleHidden = () => {
      if (!document.hidden) return
      setKind(EXPENSE)
      setSelectedBig(null)
      setSelectedSmall(null)
    }
    document.addEventListener('visibilitychange', handleHidden)
    return () => document.removeEventListener('visibilitychange', handleHidden)
  }, [kind, amount, note, manageOpen])

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

  // 選択中の小カテゴリが削除されたら選択を解除する
  const handleCategoryDeleted = (smallId) => {
    if (smallId === selectedSmall) {
      setSelectedBig(null)
      setSelectedSmall(null)
    }
  }

  const handleSubmit = () => run(submitExpense)

  const submitExpense = async () => {
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
      if (needsLogin(error)) {
        requestLogin(handleSubmit)
        return
      }
      if (error) throw error

      setNote('')
      setAmount('')
      setSelectedBig(null)
      setSelectedSmall(null)
      setKind(EXPENSE) // 戻し忘れて支出を収入に入れるのを防ぐ
      setMessage(`✅ ${theme.label}を登録しました`)
      setTimeout(() => setMessage(''), 3000)
      return true
    } catch (err) {
      console.error('登録失敗', err)
      setMessage('❌ 登録に失敗しました')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    // 送信中の入力は登録後に消えてしまうため、完了まで操作を止める
    <div className="flex min-h-0 flex-1 flex-col" inert={busy}>
      <div className={`px-4 pt-2 ${theme.row}`}>
        <SegmentTabs label="入力の種類" options={KIND_OPTIONS} value={kind} onChange={changeKind} />
      </div>

      <DateNav
        className={theme.row}
        date={date}
        onPrevDay={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
        onNextDay={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
        onSetDate={setDate}
      />

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
          className="w-full flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
        />
        <button type="button" onClick={() => setNote('')} className="text-gray-300">
          <X size={16} />
        </button>
      </div>

      <div className={`border-t border-gray-100 px-4 py-3 ${theme.row}`}>
        <span className={`mr-2 text-sm font-bold ${theme.text}`}>{theme.label}</span>
        <span className="text-xl font-bold text-gray-800">
          ¥ {amount ? Number(amount).toLocaleString() : 0}
        </span>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${theme.area}`}>
        <div className="px-4 py-1 text-xs font-bold text-gray-500">カテゴリ</div>
        {kind === INCOME && bigCategories.length === 0 && (
          <p className="px-4 py-2 text-center text-sm text-gray-600">収入カテゴリがまだ登録されていません</p>
        )}

        <CategoryGrid
          key={kind}
          tiles={tiles}
          selectedBig={selectedBig}
          selectedSmall={selectedSmall}
          onSelectDirect={handleSelectDirect}
          onOpenGroup={handleOpenGroup}
          onManage={() => setManageOpen(true)}
        />
      </div>

      {message && (
        <div className={`px-4 py-2 text-center text-sm ${message.includes('❌') ? 'text-red-500' : 'text-emerald-600'}`}>
          {message}
        </div>
      )}

      <NumericKeypad value={amount} onChange={setAmount} onConfirm={handleSubmit} busy={busy} kind={kind} />

      {sheetBigCategory && (
        <CategoryPickerSheet
          bigCategoryName={sheetBigCategory.big_category_name}
          smallCategories={smallCategoriesByBig[sheetBigId] || []}
          onSelect={handlePickFromSheet}
          onClose={() => setSheetBigId(null)}
        />
      )}

      {manageOpen && (
        <CategoryManageSheet
          bigCategories={bigCategories}
          smallCategoriesByBig={smallCategoriesByBig}
          onChanged={reload}
          onDeleted={handleCategoryDeleted}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  )
}

export default ExpenseInputPage
