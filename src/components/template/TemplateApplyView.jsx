import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'

function TemplateApplyView() {
  const userName = useUserName()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [templates, setTemplates] = useState([])
  const [checkedIds, setCheckedIds] = useState([])
  const [editedAmounts, setEditedAmounts] = useState({})

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('template_expenses')
      .select('id, template_name, day_of_month, amount, note, big_category_id, small_category_id')
      .eq('is_active', true)
      .order('day_of_month')
    if (error) {
      console.error('テンプレート取得失敗', error)
      return
    }
    setTemplates(data || [])
    setCheckedIds((data || []).map((t) => t.id))
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const isEdited = Object.keys(editedAmounts).length > 0

  const handleYearChange = (value) => {
    if (isEdited && !window.confirm('年を変更すると入力中の金額の変更は消えます。よろしいですか？')) return
    setYear(Number(value))
    setEditedAmounts({})
  }

  const handleMonthChange = (value) => {
    if (isEdited && !window.confirm('月を変更すると入力中の金額の変更は消えます。よろしいですか？')) return
    setMonth(Number(value))
    setEditedAmounts({})
  }

  const resolveAmount = (t) => {
    const edited = Number(editedAmounts[t.id])
    return editedAmounts[t.id] !== undefined && !Number.isNaN(edited) ? edited : t.amount
  }

  const toggleCheck = (id) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const handleApply = async () => {
    if (checkedIds.length === 0) {
      alert('適用するテンプレートを選択してください')
      return
    }
    if (!window.confirm(`${year}年${month}月分の支出として計上します。よろしいですか？`)) return

    const records = templates
      .filter((t) => checkedIds.includes(t.id))
      .map((t) => ({
        date: `${year}-${String(month).padStart(2, '0')}-${String(t.day_of_month).padStart(2, '0')}`,
        big_category_id: t.big_category_id,
        small_category_id: t.small_category_id,
        note: t.note,
        amount: resolveAmount(t),
        created_by: userName,
        last_updated_by: userName,
      }))

    const { error } = await supabase.from('expenses').insert(records)
    if (error) {
      console.error('テンプレート計上失敗', error)
      alert('計上に失敗しました')
      return
    }
    setEditedAmounts({})
    alert('テンプレートを計上しました')
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-2 bg-white px-4 py-3">
        <input
          type="number"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
        />
        <span className="text-sm text-gray-500">年</span>
        <select
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 px-3 py-2">
        {templates.map((t) => {
          const checked = checkedIds.includes(t.id)
          const edited = editedAmounts[t.id] !== undefined
          const displayAmount = edited ? editedAmounts[t.id] : String(t.amount)
          return (
            <div key={t.id} className={`rounded-xl bg-white p-3 ${checked ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={checked} onChange={() => toggleCheck(t.id)} />
                <span className="flex-1 text-sm font-bold text-gray-700">{t.template_name}</span>
                <span className="text-xs text-gray-400">毎月{t.day_of_month}日</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={displayAmount}
                  disabled={!checked}
                  onChange={(e) => setEditedAmounts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  className={`w-28 rounded-lg border px-2 py-1 text-sm ${edited ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}
                />
                {edited && <span className="text-xs text-gray-400">(元: ¥{Number(t.amount).toLocaleString()})</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto px-3 pb-3">
        <button type="button" onClick={handleApply} className="w-full rounded-xl bg-orange-100 py-3 text-base font-bold text-orange-500">
          {year}年{month}月分として計上する
        </button>
      </div>
    </div>
  )
}

export default TemplateApplyView
