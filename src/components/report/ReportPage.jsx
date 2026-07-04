import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'
import { getCategoryVisual } from '../../lib/categoryVisuals'

function buildMonthRange(year, month) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { monthStart, monthEnd }
}

function formatAmount(v) {
  return `¥${Number(v).toLocaleString()}`
}

function ReportPage() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [allExpenses, setAllExpenses] = useState([])
  const [chartData, setChartData] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    async function fetchExpenses() {
      const { monthStart, monthEnd } = buildMonthRange(selectedYear, selectedMonth)
      const { data, error } = await supabase
        .from('expenses')
        .select(`id, date, amount, note,
          big_category_master (big_category_name),
          small_category_master (small_category_name)`)
        .or('delete_flg.is.null,delete_flg.eq.false')
        .gte('date', monthStart)
        .lte('date', monthEnd)

      if (error) {
        console.error('レポート取得失敗', error)
        return
      }

      const rows = data || []
      setAllExpenses(rows)
      setSelectedCategory(null)

      const grouped = {}
      let total = 0
      for (const row of rows) {
        const name = row.big_category_master?.big_category_name || '未分類'
        grouped[name] = (grouped[name] || 0) + Number(row.amount || 0)
        total += Number(row.amount || 0)
      }
      setChartData(Object.entries(grouped).map(([name, value]) => ({ name, value })))
      setTotalAmount(total)
    }
    fetchExpenses()
  }, [selectedYear, selectedMonth])

  function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const { name, value } = payload[0].payload

    const breakdown = {}
    for (const row of allExpenses) {
      const bigName = row.big_category_master?.big_category_name || '未分類'
      if (bigName !== name) continue
      const smallName = row.small_category_master?.small_category_name || '未分類'
      breakdown[smallName] = (breakdown[smallName] || 0) + Number(row.amount || 0)
    }

    return (
      <div className="rounded-lg bg-white p-3 text-xs shadow">
        <p className="font-bold text-gray-700">{name}: {formatAmount(value)}</p>
        <ul className="mt-1 text-gray-500">
          {Object.entries(breakdown).map(([k, v]) => (
            <li key={k}>{k}: {formatAmount(v)}</li>
          ))}
        </ul>
      </div>
    )
  }

  const filteredExpenses = selectedCategory
    ? allExpenses
        .filter((e) => (e.big_category_master?.big_category_name || '未分類') === selectedCategory)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : []

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
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
        <span className="text-sm font-bold text-gray-600">合計: {totalAmount.toLocaleString()}円</span>
      </div>

      <div className="bg-white px-2 py-2" style={{ height: 320 }}>
        {chartData.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${formatAmount(value)}`}
                onClick={(entry) => setSelectedCategory(entry.name)}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={getCategoryVisual(entry.name).palette.hex} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {selectedCategory && (
        <div className="px-3 py-2">
          <p className="mb-2 text-sm font-bold text-gray-600">{selectedCategory} の内訳</p>
          <div className="overflow-x-auto rounded-lg bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="p-2">日付</th>
                  <th className="p-2">小カテゴリ</th>
                  <th className="p-2">備考</th>
                  <th className="p-2 text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="p-2">{e.date}</td>
                    <td className="p-2">{e.small_category_master?.small_category_name || '-'}</td>
                    <td className="p-2">{e.note || '-'}</td>
                    <td className="p-2 text-right">{Number(e.amount).toLocaleString()}円</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportPage
