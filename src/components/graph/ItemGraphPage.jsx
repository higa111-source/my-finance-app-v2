import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { supabase } from '../../supabaseClient'
import { getCategoryVisual } from '../../lib/categoryVisuals'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function ItemGraphPage() {
  const [fromYm, setFromYm] = useState('')
  const [toYm, setToYm] = useState('')
  const [bigCategories, setBigCategories] = useState([])
  const [smallCategories, setSmallCategories] = useState([])
  const [bigCategoryId, setBigCategoryId] = useState('')
  const [smallCategoryId, setSmallCategoryId] = useState('')
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    async function init() {
      const [{ data: minData }, { data: maxData }, { data: bigData, error: bigError }] = await Promise.all([
        supabase.from('expenses').select('date').or('delete_flg.is.null,delete_flg.eq.false').order('date', { ascending: true }).limit(1),
        supabase.from('expenses').select('date').or('delete_flg.is.null,delete_flg.eq.false').order('date', { ascending: false }).limit(1),
        supabase.from('big_category_master').select('big_category_id, big_category_name').order('big_category_id'),
      ])
      if (minData?.[0]) setFromYm(minData[0].date.slice(0, 7))
      if (maxData?.[0]) setToYm(maxData[0].date.slice(0, 7))
      if (bigError) console.error('大カテゴリ取得失敗', bigError)
      setBigCategories(bigData || [])
    }
    init()
  }, [])

  useEffect(() => {
    if (!bigCategoryId) {
      setSmallCategories([])
      setSmallCategoryId('')
      return
    }
    async function fetchSmall() {
      const { data, error } = await supabase
        .from('small_category_master')
        .select('small_category_id, small_category_name')
        .eq('big_category_id', Number(bigCategoryId))
        .order('small_category_id')
      if (error) {
        console.error('小カテゴリ取得失敗', error)
        return
      }
      setSmallCategories(data || [])
      setSmallCategoryId('')
    }
    fetchSmall()
  }, [bigCategoryId])

  const handleSearch = async () => {
    if (!bigCategoryId) {
      alert('大カテゴリを選択してください')
      return
    }

    let query = supabase
      .from('expenses')
      .select('date, amount')
      .gte('date', `${fromYm}-01`)
      .lte('date', `${toYm}-31`)
      .eq('big_category_id', Number(bigCategoryId))
      .or('delete_flg.is.null,delete_flg.eq.false')

    if (smallCategoryId) {
      query = query.eq('small_category_id', Number(smallCategoryId))
    }

    const { data, error } = await query
    if (error) {
      console.error('グラフデータ取得失敗', error)
      return
    }

    const monthly = {}
    for (const row of data || []) {
      const ym = row.date.slice(0, 7)
      monthly[ym] = (monthly[ym] || 0) + Number(row.amount || 0)
    }

    const labels = []
    const values = []
    const cur = new Date(`${fromYm}-01`)
    const end = new Date(`${toYm}-01`)
    while (cur <= end) {
      const ym = cur.toISOString().slice(0, 7)
      labels.push(ym)
      values.push(monthly[ym] || 0)
      cur.setMonth(cur.getMonth() + 1)
    }

    const bigCategoryName = bigCategories.find((bc) => bc.big_category_id === Number(bigCategoryId))?.big_category_name
    const color = getCategoryVisual(bigCategoryName).palette.hex

    setChartData({
      labels,
      datasets: [{
        label: '月別支出金額',
        data: values,
        backgroundColor: color,
      }],
    })
  }

  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `¥${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => `¥${v.toLocaleString()}`,
        },
      },
    },
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3">
        <select
          value={bigCategoryId}
          onChange={(e) => setBigCategoryId(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        >
          <option value="">大カテゴリ選択</option>
          {bigCategories.map((bc) => (
            <option key={bc.big_category_id} value={bc.big_category_id}>{bc.big_category_name}</option>
          ))}
        </select>
        <select
          value={smallCategoryId}
          onChange={(e) => setSmallCategoryId(e.target.value)}
          disabled={!bigCategoryId}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-50"
        >
          <option value="">（全小カテゴリ）</option>
          {smallCategories.map((sc) => (
            <option key={sc.small_category_id} value={sc.small_category_id}>{sc.small_category_name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <input type="month" value={fromYm} onChange={(e) => setFromYm(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
        <span className="text-sm text-gray-400">〜</span>
        <input type="month" value={toYm} onChange={(e) => setToYm(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
        <button type="button" onClick={handleSearch} className="rounded-lg bg-orange-100 px-4 py-1 text-sm font-bold text-orange-600">
          表示
        </button>
      </div>

      <div className="flex-1 bg-white p-3">
        {chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <p className="mt-8 text-center text-sm text-gray-400">大カテゴリを選択して「表示」を押してください</p>
        )}
      </div>
    </div>
  )
}

export default ItemGraphPage
