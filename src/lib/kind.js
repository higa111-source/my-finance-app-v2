// 支出と収入の区分。明細には持たせず、大カテゴリの kind だけで決まる。
export const EXPENSE = 'expense'
export const INCOME = 'income'

// 区分の情報がない場合（旧版のキャッシュや未分類）は支出として扱う
export const toKind = (value) => (value === INCOME ? INCOME : EXPENSE)

export const kindOfRow = (row) => toKind(row.big_category_master?.kind)

export const KIND_THEME = {
  [EXPENSE]: {
    label: '支出',
    hex: '#ea580c',
    text: 'text-orange-500',
    soft: 'bg-orange-100 text-orange-600',
    row: 'bg-white',
    area: 'bg-orange-50/40',
    keypad: '',
    tab: 'bg-orange-500 text-white',
    button: 'bg-orange-500 active:bg-orange-600',
    confirmLabel: '確定',
  },
  [INCOME]: {
    label: '収入',
    hex: '#2563eb',
    text: 'text-blue-600',
    soft: 'bg-blue-100 text-blue-700',
    row: 'bg-blue-50',
    area: 'bg-blue-200',
    keypad: 'bg-blue-100',
    tab: 'bg-blue-600 text-white',
    button: 'bg-blue-600 active:bg-blue-700',
    confirmLabel: '収入を登録',
  },
}

// 収入と支出を混ぜずに合計する。hasIncome は「収入0円」と「収入未登録」の区別用。
export function summarize(rows) {
  let income = 0
  let expense = 0
  let hasIncome = false
  for (const row of rows) {
    const amount = Number(row.amount || 0)
    if (kindOfRow(row) === INCOME) {
      income += amount
      hasIncome = true
    } else {
      expense += amount
    }
  }
  return { income, expense, balance: income - expense, hasIncome }
}

export const formatSigned = (n) => `${n > 0 ? '+' : ''}${n.toLocaleString()}`
