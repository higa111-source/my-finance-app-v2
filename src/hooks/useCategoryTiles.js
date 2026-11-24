import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getCategoryVisual, getIncomeVisual } from '../lib/categoryVisuals'
import { INCOME, toKind } from '../lib/kind'
import useAuth from './authContext'

const CACHE_KEY = 'categoryCache'

// 前回のカテゴリを端末から読み、通信を待たずに入力できるようにする
function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (Array.isArray(cache?.big) && Array.isArray(cache?.small)) return cache
  } catch {
    // 壊れている・使えない場合はキャッシュなしとして扱う
  }
  return { big: [], small: [] }
}

function writeCache(big, small) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ big, small }))
  } catch {
    // 保存できなくても動作に支障はない
  }
}

function groupByBig(smallCategories) {
  const grouped = {}
  for (const sc of smallCategories) {
    if (!grouped[sc.big_category_id]) grouped[sc.big_category_id] = []
    grouped[sc.big_category_id].push(sc)
  }
  return grouped
}

function buildTiles(bigCategories, smallCategoriesByBig) {
  const directTiles = []
  const groupTiles = []

  for (const bc of bigCategories) {
    const visual = getCategoryVisual(bc.big_category_name)
    const smalls = smallCategoriesByBig[bc.big_category_id] || []

    if (visual.mode === 'group') {
      groupTiles.push({
        key: `g-${bc.big_category_id}`,
        type: 'group',
        label: bc.big_category_name,
        bigId: bc.big_category_id,
        smallId: null,
        icon: visual.icon,
        palette: visual.palette,
      })
      continue
    }

    if (smalls.length === 0) {
      directTiles.push({
        key: `d-big-${bc.big_category_id}`,
        type: 'direct',
        label: bc.big_category_name,
        bigId: bc.big_category_id,
        smallId: null,
        icon: visual.icon,
        palette: visual.palette,
      })
      continue
    }

    for (const sc of smalls) {
      const { icon, palette } = toKind(bc.kind) === INCOME ? getIncomeVisual(sc.small_category_name) : visual
      directTiles.push({
        key: `d-${sc.small_category_id}`,
        type: 'direct',
        label: sc.small_category_name,
        bigId: bc.big_category_id,
        smallId: sc.small_category_id,
        icon,
        palette,
      })
    }
  }

  return [...directTiles, ...groupTiles, { key: 'manage', type: 'manage', label: '編集' }]
}

// kind を渡すと、その区分の大カテゴリとタイルだけを返す
export default function useCategoryTiles(kind = null) {
  const { loggedIn } = useAuth()
  const [allBigCategories, setBigCategories] = useState(() => readCache().big)
  const [smallCategoriesByBig, setSmallCategoriesByBig] = useState(() => groupByBig(readCache().small))

  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const [{ data: bigData, error: bigError }, { data: smallData, error: smallError }] = await Promise.all([
          supabase.from('big_category_master').select('big_category_id, big_category_name, kind').order('big_category_id'),
          supabase.from('small_category_master').select('small_category_id, big_category_id, small_category_name').order('big_category_id, small_category_id'),
        ])
        if (bigError) throw bigError
        if (smallError) throw smallError

        // 未ログインだと0件で返るため、前回のカテゴリを残す
        if (!bigData || bigData.length === 0) return

        setBigCategories(bigData)
        setSmallCategoriesByBig(groupByBig(smallData || []))
        writeCache(bigData, smallData || [])
      } catch (err) {
        console.error('カテゴリ取得失敗', err)
      }
    }
    fetchCategories()
  }, [version, loggedIn])

  const bigCategories = useMemo(
    () => (kind ? allBigCategories.filter((bc) => toKind(bc.kind) === kind) : allBigCategories),
    [allBigCategories, kind]
  )
  const tiles = useMemo(() => buildTiles(bigCategories, smallCategoriesByBig), [bigCategories, smallCategoriesByBig])

  return { bigCategories, smallCategoriesByBig, tiles, reload }
}
