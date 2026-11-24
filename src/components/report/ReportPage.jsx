import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { buildMonthRange, fetchExpenses } from '../../lib/expenses'
import { EXPENSE, INCOME, KIND_THEME, formatSigned, kindOfRow, summarize } from '../../lib/kind'
import SegmentTabs from '../shared/SegmentTabs'
import { getCategoryVisual, getIncomeVisual } from '../../lib/categoryVisuals'

const KIND_OPTIONS = [EXPENSE, INCOME].map((k) => ({
  value: k,
  label: KIND_THEME[k].label,
  activeClass: KIND_THEME[k].tab,
}))

// 支出は大カテゴリ、収入は小カテゴリ（種類と人）で分ける
function groupName(row) {
  const name = kindOfRow(row) === INCOME
    ? row.small_category_master?.small_category_name
    : row.big_category_master?.big_category_name
  return name || '未分類'
}

const groupOrder = (row) => (kindOfRow(row) === INCOME ? row.small_category_id : row.big_category_id) ?? Infinity

// 金額の大小で色や並びが変わらないよう、カテゴリ順に並べる
function buildChartData(rows) {
  const groups = new Map()
  for (const row of [...rows].sort((a, b) => groupOrder(a) - groupOrder(b))) {
    const name = groupName(row)
    groups.set(name, (groups.get(name) || 0) + Number(row.amount || 0))
  }
  return [...groups].map(([name, value]) => ({ name, value }))
}

function SummaryItem({ label, className = 'text-gray-800', children }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-base font-bold ${className}`}>{children}</div>
    </div>
  )
}

function formatAmount(v) {
  return `¥${Number(v).toLocaleString()}`
}

function ReportPage() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [allExpenses, setAllExpenses] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [kind, setKind] = useState(EXPENSE)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    // 月を素早く切り替えたとき、古い取得結果で上書きしないようにする
    let cancelled = false

    async function load() {
      setStatus('loading')
      setSelectedCategory(null)
      try {
        const rows = await fetchExpenses(buildMonthRange(selectedYear, selectedMonth))
        if (cancelled) return
        setAllExpenses(rows)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('レポート取得失敗', err)
        setAllExpenses([])
        setStatus('error')
      }
    }
    load()

    return () => { cancelled = true }
  }, [selectedYear, selectedMonth])

  const summary = summarize(allExpenses)
  const kindRows = useMemo(() => allExpenses.filter((row) => kindOfRow(row) === kind), [allExpenses, kind])
  const chartData = useMemo(() => buildChartData(kindRows), [kindRows])
  const colorOf = (name) => (kind === INCOME ? getIncomeVisual(name).hex : getCategoryVisual(name).palette.hex)

  const changeKind = (next) => {
    setKind(next)
    setSelectedCategory(null)
  }

  function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const { name, value } = payload[0].payload

    const breakdown = {}
    if (kind === EXPENSE) {
      for (const row of kindRows) {
        if (groupName(row) !== name) continue
        const smallName = row.small_category_master?.small_category_name || '未分類'
        breakdown[smallName] = (breakdown[smallName] || 0) + Number(row.amount || 0)
      }
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
    ? kindRows
        .filter((e) => groupName(e) === selectedCategory)
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
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 bg-white px-4 py-3">
        {status === 'ready' ? (
          <>
            <SummaryItem label="収入" className={summary.hasIncome ? 'text-blue-600' : 'text-gray-400'}>
              {summary.hasIncome ? `${summary.income.toLocaleString()}円` : '未登録'}
            </SummaryItem>
            <SummaryItem label="支出">{summary.expense.toLocaleString()}円</SummaryItem>
            <SummaryItem
              label="収支"
              className={!summary.hasIncome ? 'text-gray-400' : summary.balance < 0 ? 'text-red-500' : 'text-emerald-600'}
            >
              {summary.hasIncome ? `${formatSigned(summary.balance)}円` : '収入未登録'}
            </SummaryItem>
          </>
        ) : (
          <p className="col-span-3 text-center text-sm text-gray-400">
            {status === 'loading' ? '読み込み中...' : '❌ レポートの取得に失敗しました'}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-4 pt-3">
        <SegmentTabs label="円グラフの種類" options={KIND_OPTIONS} value={kind} onChange={changeKind} />
      </div>

      <div className="bg-white px-2 py-2" style={{ height: 320 }}>
        {status !== 'ready' ? null : chartData.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">
            {kind === INCOME ? '収入は登録されていません' : 'データがありません'}
          </p>
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
                // 収入は名前と金額が長く画面端で切れるため、下の一覧に出す
                label={kind === EXPENSE && (({ name, value }) => `${name}: ${formatAmount(value)}`)}
                onClick={(entry) => setSelectedCategory(entry.name)}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={colorOf(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {kind === EXPENSE && <Legend itemSorter={null} />}
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {status === 'ready' && kind === INCOME && chartData.length > 0 && (
        <div className="flex flex-col bg-white px-4 pb-3">
          {chartData.map(({ name, value }) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedCategory(name)}
              className="flex items-center gap-2 border-t border-gray-100 py-2 text-sm text-gray-700"
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: colorOf(name) }} />
              <span className="flex-1 text-left">{name}</span>
              <span className="font-bold">{formatAmount(value)}</span>
            </button>
          ))}
        </div>
      )}

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
