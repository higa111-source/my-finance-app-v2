import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import useAuth from '../../hooks/authContext'
import { fromDateInputValue } from '../../lib/date'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const FETCH_SIZE = 1000
const SELECT_CLASS = 'min-w-0 rounded-lg border border-gray-200 px-2 py-1 text-base disabled:opacity-50'

// year / month が空文字の場合は「すべて」。全期間なら null を返す
function buildDateRange(year, month) {
  if (!year) return null
  if (!month) return { start: `${year}-01-01`, end: `${year}-12-31` }
  const mm = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` }
}

// 1回の取得件数に上限があるため、全件そろうまで繰り返し取得する
async function fetchAllExpenses(range) {
  const rows = []
  for (;;) {
    let query = supabase
      .from('expenses')
      .select(`id, date, note, amount,
        big_category_master (big_category_id, big_category_name),
        small_category_master (small_category_id, small_category_name),
        delete_flg`)
      .or('delete_flg.is.null,delete_flg.eq.false')
    if (range) query = query.gte('date', range.start).lte('date', range.end)

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(rows.length, rows.length + FETCH_SIZE - 1)
    if (error) throw error

    rows.push(...data)
    if (data.length < FETCH_SIZE) return rows
  }
}

// 全角/半角・大文字/小文字の違いを無視して検索するための正規化
const normalize = (text) => (text || '').normalize('NFKC').toLowerCase()

function ExpenseListView({ reload, filters, onFiltersChange, onEdit }) {
  const { year, month, bigId, smallId, note } = filters
  const { loggedIn } = useAuth()
  const { bigCategories, smallCategoriesByBig } = useCategoryTiles()
  const [expenses, setExpenses] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const smallCategories = smallCategoriesByBig[bigId] || []

  useEffect(() => {
    // 条件を素早く切り替えたとき、古い取得結果で上書きしないようにする
    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        const rows = await fetchAllExpenses(buildDateRange(year, month))
        if (cancelled) return
        setExpenses(rows)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('支出一覧取得失敗', err)
        setExpenses([])
        setStatus('error')
      }
    }
    load()

    return () => { cancelled = true }
  }, [reload, year, month, loggedIn])

  const visibleExpenses = useMemo(() => {
    const words = normalize(note).split(/\s+/).filter(Boolean)
    return expenses.filter((exp) => {
      if (bigId && exp.big_category_master?.big_category_id !== bigId) return false
      if (smallId && exp.small_category_master?.small_category_id !== smallId) return false
      if (words.length === 0) return true
      const target = normalize(exp.note)
      return words.every((word) => target.includes(word))
    })
  }, [expenses, bigId, smallId, note])

  const totalAmount = visibleExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const hasFilter = Boolean(bigId || smallId || note)

  const update = (changes) => onFiltersChange({ ...filters, ...changes })
  const toValue = (e) => (e.target.value ? Number(e.target.value) : '')

  const formatDay = (dateText) => {
    const date = fromDateInputValue(dateText)
    const day = `${date.getDate()}日(${WEEKDAYS[date.getDay()]})`
    if (!year) return `${date.getFullYear()}年${date.getMonth() + 1}月${day}`
    return month ? day : `${date.getMonth() + 1}月${day}`
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 bg-white px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            aria-label="年"
            value={year}
            onChange={(e) => {
              const value = toValue(e)
              update(value ? { year: value } : { year: '', month: '' })
            }}
            className={SELECT_CLASS}
          >
            <option value="">すべての年</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            aria-label="月"
            value={month}
            onChange={(e) => update({ month: toValue(e) })}
            disabled={!year}
            className={SELECT_CLASS}
          >
            <option value="">すべての月</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <select
            aria-label="大カテゴリ"
            value={bigId}
            onChange={(e) => update({ bigId: toValue(e), smallId: '' })}
            className={SELECT_CLASS}
          >
            <option value="">すべての大カテゴリ</option>
            {bigCategories.map((bc) => (
              <option key={bc.big_category_id} value={bc.big_category_id}>{bc.big_category_name}</option>
            ))}
          </select>
          <select
            aria-label="小カテゴリ"
            value={smallId}
            onChange={(e) => update({ smallId: toValue(e) })}
            disabled={!bigId}
            className={SELECT_CLASS}
          >
            <option value="">すべての小カテゴリ</option>
            {smallCategories.map((sc) => (
              <option key={sc.small_category_id} value={sc.small_category_id}>{sc.small_category_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1">
          <Search size={16} className="shrink-0 text-gray-400" />
          <input
            type="text"
            aria-label="メモで絞り込み"
            value={note}
            onChange={(e) => update({ note: e.target.value })}
            placeholder="メモで絞り込み"
            className="min-w-0 flex-1 text-base text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          {note && (
            <button type="button" onClick={() => update({ note: '' })} className="text-gray-400" aria-label="メモの条件を消す">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => update({ bigId: '', smallId: '', note: '' })}
            disabled={!hasFilter}
            className="text-sm text-orange-600 disabled:text-gray-300"
          >
            絞り込みを解除
          </button>
          <span className="text-sm font-bold text-gray-600">
            {status === 'ready' ? `${visibleExpenses.length}件 合計: ${totalAmount.toLocaleString()}円` : '-'}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {status === 'loading' && (
          <p className="mt-8 text-center text-sm text-gray-400">読み込み中...</p>
        )}
        {status === 'error' && (
          <p className="mt-8 text-center text-sm text-red-500">❌ 一覧の取得に失敗しました</p>
        )}
        {status === 'ready' && visibleExpenses.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            {hasFilter ? '条件に合うデータがありません' : 'データがありません'}
          </p>
        )}
        {status === 'ready' && (
          <div className="flex flex-col gap-2">
            {visibleExpenses.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => onEdit(exp)}
                className="rounded-xl bg-white p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">
                    {formatDay(exp.date)} {exp.big_category_master?.big_category_name || '-'} / {exp.small_category_master?.small_category_name || '-'}
                  </span>
                  <span className="shrink-0 text-base font-bold text-gray-800">
                    {Number(exp.amount).toLocaleString()}円
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">備考: {exp.note || '-'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpenseListView
