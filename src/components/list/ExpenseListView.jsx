import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function buildMonthRange(year, month) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { monthStart, monthEnd }
}

function ExpenseListView({ reload, onEdit }) {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [expenses, setExpenses] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    async function fetchExpenses() {
      const { monthStart, monthEnd } = buildMonthRange(selectedYear, selectedMonth)
      const { data, error } = await supabase
        .from('expenses')
        .select(`id, date, note, amount,
          big_category_master (big_category_id, big_category_name),
          small_category_master (small_category_id, small_category_name),
          delete_flg`)
        .or('delete_flg.is.null,delete_flg.eq.false')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false })

      if (error) {
        console.error('支出一覧取得失敗', error)
        return
      }

      const filtered = (data || []).filter((e) => !e.delete_flg)
      setExpenses(filtered)
      setTotalAmount(filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0))
    }
    fetchExpenses()
  }, [reload, selectedYear, selectedMonth])

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <span className="text-sm font-bold text-gray-600">
          合計: {totalAmount.toLocaleString()}円
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {expenses.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">データがありません</p>
        )}
        <div className="flex flex-col gap-2">
          {expenses.map((exp) => {
            const day = new Date(exp.date).getDate()
            const weekday = WEEKDAYS[new Date(exp.date).getDay()]
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => onEdit(exp)}
                className="rounded-xl bg-white p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {day}日({weekday}) {exp.big_category_master?.big_category_name || '-'} / {exp.small_category_master?.small_category_name || '-'}
                  </span>
                  <span className="text-base font-bold text-gray-800">
                    {Number(exp.amount).toLocaleString()}円
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">備考: {exp.note || '-'}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ExpenseListView
