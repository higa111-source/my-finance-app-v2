import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import useCategoryTiles from '../../hooks/useCategoryTiles'
import useAuth from '../../hooks/authContext'
import { fromDateInputValue } from '../../lib/date'
import { buildMonthRange, fetchExpenses } from '../../lib/expenses'
import { EXPENSE, INCOME, KIND_THEME, formatSigned, kindOfRow, summarize } from '../../lib/kind'
import SegmentTabs from '../shared/SegmentTabs'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const KIND_OPTIONS = [
  { value: '', label: 'すべて', activeClass: 'bg-gray-600 text-white' },
  ...[EXPENSE, INCOME].map((k) => ({ value: k, label: KIND_THEME[k].label, activeClass: KIND_THEME[k].tab })),
]
const SELECT_CLASS = 'min-w-0 rounded-lg border border-gray-200 px-2 py-1 text-base disabled:opacity-50'

// year / month が空文字の場合は「すべて」。全期間なら null を返す
function buildDateRange(year, month) {
  if (!year) return null
  if (!month) return { start: `${year}-01-01`, end: `${year}-12-31` }
  return buildMonthRange(year, month)
}

// 全角/半角・大文字/小文字の違いを無視して検索するための正規化
const normalize = (text) => (text || '').normalize('NFKC').toLowerCase()

function ExpenseListView({ reload, filters, onFiltersChange, onEdit }) {
  const { year, month, kind, bigId, smallId, note } = filters
  const { loggedIn } = useAuth()
  const { bigCategories, smallCategoriesByBig } = useCategoryTiles(kind || null)
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
        const rows = await fetchExpenses(buildDateRange(year, month))
        if (cancelled) return
        setExpenses(rows)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('一覧取得失敗', err)
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
      if (kind && kindOfRow(exp) !== kind) return false
      if (bigId && exp.big_category_master?.big_category_id !== bigId) return false
      if (smallId && exp.small_category_master?.small_category_id !== smallId) return false
      if (words.length === 0) return true
      const target = normalize(exp.note)
      return words.every((word) => target.includes(word))
    })
  }, [expenses, kind, bigId, smallId, note])

  const summary = summarize(visibleExpenses)
  // 収入も含む一覧のときだけ、収入・支出・差額に分けて出す
  const showBalance = !kind && !bigId && summary.hasIncome
  const totalAmount = summary.income + summary.expense // 片方の区分しか含まないときだけ使う
  const hasFilter = Boolean(kind || bigId || smallId || note)

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
        <SegmentTabs
          label="支出と収入の絞り込み"
          options={KIND_OPTIONS}
          value={kind}
          onChange={(value) => update({ kind: value, bigId: '', smallId: '' })}
        />
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
            onClick={() => update({ kind: '', bigId: '', smallId: '', note: '' })}
            disabled={!hasFilter}
            className="text-sm text-orange-600 disabled:text-gray-300"
          >
            絞り込みを解除
          </button>
          <span className="text-sm font-bold text-gray-600">
            {status === 'ready' ? `${visibleExpenses.length}件${showBalance ? '' : ` 合計: ${totalAmount.toLocaleString()}円`}` : '-'}
          </span>
        </div>

        {status === 'ready' && showBalance && (
          <div className="flex flex-wrap justify-end gap-x-3 text-sm text-gray-600">
            <span>収入 <b className="text-blue-600">{summary.income.toLocaleString()}</b></span>
            <span>支出 <b>{summary.expense.toLocaleString()}</b></span>
            <span>差額 <b>{formatSigned(summary.balance)}円</b></span>
          </div>
        )}
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
                  <span className={`shrink-0 text-base font-bold ${kindOfRow(exp) === INCOME ? 'text-blue-600' : 'text-gray-800'}`}>
                    {kindOfRow(exp) === INCOME && '+'}{Number(exp.amount).toLocaleString()}円
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
