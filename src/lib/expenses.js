import { supabase } from '../supabaseClient'

const FETCH_SIZE = 1000

// year 年 month 月の初日と末日
export function buildMonthRange(year, month) {
  const ym = `${year}-${String(month).padStart(2, '0')}`
  const lastDay = new Date(year, month, 0).getDate()
  return { start: `${ym}-01`, end: `${ym}-${String(lastDay).padStart(2, '0')}` }
}

// 明細（支出・収入）を新しい順に取得する。range が null なら全期間。
// 1回の取得件数に上限があるため、全件そろうまで繰り返す。
export async function fetchExpenses(range) {
  const rows = []
  for (;;) {
    let query = supabase
      .from('expenses')
      .select(`id, date, note, amount, big_category_id, small_category_id,
        big_category_master (big_category_id, big_category_name, kind),
        small_category_master (small_category_id, small_category_name)`)
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
