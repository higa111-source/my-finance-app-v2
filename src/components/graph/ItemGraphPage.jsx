import { useEffect, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { supabase } from '../../supabaseClient'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import { getCategoryVisual, getIncomeVisual } from '../../lib/categoryVisuals'
import { buildMonthRange, fetchExpenses } from '../../lib/expenses'
import { EXPENSE, INCOME, KIND_THEME, formatSigned, kindOfRow, summarize, toKind } from '../../lib/kind'
import SegmentTabs from '../shared/SegmentTabs'

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Tooltip, Legend)

const BALANCE = 'balance'
const MODE_OPTIONS = [
  ...[EXPENSE, INCOME].map((k) => ({ value: k, label: KIND_THEME[k].label, activeClass: KIND_THEME[k].tab })),
  { value: BALANCE, label: '収支推移', activeClass: 'bg-gray-600 text-white' },
]
const SELECT_CLASS = 'rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-50'
const BALANCE_COLOR = '#1f2937'

// fromYm〜toYm（'YYYY-MM'）の月を順に並べる
function listMonths(fromYm, toYm) {
  const months = []
  let [y, m] = fromYm.split('-').map(Number)
  for (;;) {
    const ym = `${y}-${String(m).padStart(2, '0')}`
    if (ym > toYm) return months
    months.push(ym)
    if (m === 12) { y++; m = 1 } else m++
  }
}

const sumAmount = (rows) => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)

function ItemGraphPage() {
  const [mode, setMode] = useState(EXPENSE)
  const [fromYm, setFromYm] = useState('')
  const [toYm, setToYm] = useState('')
  const { bigCategories: allBigCategories, smallCategoriesByBig } = useCategoryTiles()
  const [bigCategoryId, setBigCategoryId] = useState('')
  const [smallCategoryId, setSmallCategoryId] = useState('')
  const [chartData, setChartData] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(0)

  const bigCategories = allBigCategories.filter((bc) => toKind(bc.kind) === EXPENSE)
  // 収入は大カテゴリを選ばせず、小カテゴリを直接並べる
  const smallCategories = mode === INCOME
    ? allBigCategories
        .filter((bc) => toKind(bc.kind) === INCOME)
        .flatMap((bc) => smallCategoriesByBig[bc.big_category_id] || [])
    : smallCategoriesByBig[Number(bigCategoryId)] || []

  useEffect(() => {
    async function init() {
      const [{ data: minData }, { data: maxData }] = await Promise.all([
        supabase.from('expenses').select('date').or('delete_flg.is.null,delete_flg.eq.false').order('date', { ascending: true }).limit(1),
        supabase.from('expenses').select('date').or('delete_flg.is.null,delete_flg.eq.false').order('date', { ascending: false }).limit(1),
      ])
      if (minData?.[0]) setFromYm(minData[0].date.slice(0, 7))
      if (maxData?.[0]) setToYm(maxData[0].date.slice(0, 7))
    }
    init()
  }, [])

  // 条件と表示中のグラフが食い違わないよう、変更したら表示を消す（取得中の結果も捨てる）
  const change = (setter, value) => {
    requestRef.current++
    setter(value)
    setChartData(null)
    setMessage('')
    setLoading(false)
  }

  const changeMode = (next) => {
    change(setMode, next)
    setBigCategoryId('')
    setSmallCategoryId('')
  }

  const handleSearch = async () => {
    if (!fromYm || !toYm) {
      alert('期間を選択してください')
      return
    }
    if (mode === EXPENSE && !bigCategoryId) {
      alert('大カテゴリを選択してください')
      return
    }

    const requestId = ++requestRef.current
    setLoading(true)
    setMessage('')
    try {
      const [toYear, toMonth] = toYm.split('-').map(Number)
      const rows = await fetchExpenses({ start: `${fromYm}-01`, end: buildMonthRange(toYear, toMonth).end })
      if (requestId !== requestRef.current) return
      setChartData(buildChart(rows))
    } catch (err) {
      if (requestId !== requestRef.current) return
      console.error('グラフデータ取得失敗', err)
      setChartData(null)
      setMessage('❌ グラフの取得に失敗しました')
    }
    setLoading(false)
  }

  const buildChart = (rows) => {
    const labels = listMonths(fromYm, toYm)
    const byMonth = Object.fromEntries(labels.map((ym) => [ym, []]))
    for (const row of rows) byMonth[row.date.slice(0, 7)]?.push(row)

    if (mode === BALANCE) {
      const monthly = labels.map((ym) => summarize(byMonth[ym]))
      // 収入が未登録の月は赤字に見えないよう、収入・収支を空にする
      const income = monthly.map((m) => (m.hasIncome ? m.income : null))
      const expense = monthly.map((m) => m.expense)
      const balance = monthly.map((m) => (m.hasIncome ? m.balance : null))
      return {
        labels,
        table: [income, expense, balance],
        datasets: [
          { type: 'line', label: '収支', data: balance, borderColor: BALANCE_COLOR, backgroundColor: BALANCE_COLOR, borderWidth: 2, pointRadius: 4 },
          { label: '収入', data: income, backgroundColor: KIND_THEME[INCOME].hex, borderRadius: 4 },
          { label: '支出', data: expense, backgroundColor: KIND_THEME[EXPENSE].hex, borderRadius: 4 },
        ],
      }
    }

    const isTarget = (row) =>
      kindOfRow(row) === mode &&
      (mode === INCOME || row.big_category_id === Number(bigCategoryId)) &&
      (!smallCategoryId || row.small_category_id === Number(smallCategoryId))
    const smallName = smallCategories.find((sc) => sc.small_category_id === Number(smallCategoryId))?.small_category_name
    const bigName = bigCategories.find((bc) => bc.big_category_id === Number(bigCategoryId))?.big_category_name
    const incomeColor = smallName ? getIncomeVisual(smallName).palette.hex : KIND_THEME[INCOME].hex

    return {
      labels,
      datasets: [{
        label: smallName || (mode === INCOME ? '収入全体' : bigName),
        data: labels.map((ym) => sumAmount(byMonth[ym].filter(isTarget))),
        backgroundColor: mode === INCOME ? incomeColor : getCategoryVisual(bigName).palette.hex,
        borderRadius: 4,
      }],
    }
  }

  const chartOptions = {
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ¥${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `¥${v.toLocaleString()}`,
        },
      },
    },
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="bg-white px-4 pt-3">
        <SegmentTabs label="グラフの種類" options={MODE_OPTIONS} value={mode} onChange={changeMode} />
      </div>

      {mode !== BALANCE && (
        <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3">
          {mode === EXPENSE && (
            <select
              aria-label="大カテゴリ"
              value={bigCategoryId}
              onChange={(e) => {
                change(setBigCategoryId, e.target.value)
                setSmallCategoryId('')
              }}
              className={SELECT_CLASS}
            >
              <option value="">大カテゴリ選択</option>
              {bigCategories.map((bc) => (
                <option key={bc.big_category_id} value={bc.big_category_id}>{bc.big_category_name}</option>
              ))}
            </select>
          )}
          <select
            aria-label="小カテゴリ"
            value={smallCategoryId}
            onChange={(e) => change(setSmallCategoryId, e.target.value)}
            disabled={mode === EXPENSE && !bigCategoryId}
            className={SELECT_CLASS}
          >
            <option value="">{mode === INCOME ? '収入全体' : '（全小カテゴリ）'}</option>
            {smallCategories.map((sc) => (
              <option key={sc.small_category_id} value={sc.small_category_id}>{sc.small_category_name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <input type="month" value={fromYm} onChange={(e) => change(setFromYm, e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
        <span className="text-sm text-gray-400">〜</span>
        <input type="month" value={toYm} onChange={(e) => change(setToYm, e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
        <button type="button" onClick={handleSearch} disabled={loading} className="rounded-lg bg-orange-100 px-4 py-1 text-sm font-bold text-orange-600 disabled:opacity-50">
          {loading ? '読込中…' : '表示'}
        </button>
      </div>

      <div className="flex-1 bg-white p-3">
        {chartData ? (
          <Chart key={mode} type="bar" data={chartData} options={chartOptions} />
        ) : (
          <p className="mt-8 text-center text-sm text-gray-400">{message || (mode === EXPENSE ? '大カテゴリを選択して「表示」を押してください' : '「表示」を押してください')}</p>
        )}
        {chartData && mode === BALANCE && (
          <table className="mt-4 w-full text-right text-xs text-gray-600">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-1 text-left">月</th>
                <th className="p-1">収入</th>
                <th className="p-1">支出</th>
                <th className="p-1">収支</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((ym, i) => {
                const [income, expense, balance] = chartData.table.map((values) => values[i])
                return (
                  <tr key={ym} className="border-b border-gray-100">
                    <td className="p-1 text-left">{ym}</td>
                    <td className="p-1">{income === null ? '未登録' : income.toLocaleString()}</td>
                    <td className="p-1">{expense.toLocaleString()}</td>
                    <td className="p-1 font-bold">{balance === null ? '-' : formatSigned(balance)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ItemGraphPage
