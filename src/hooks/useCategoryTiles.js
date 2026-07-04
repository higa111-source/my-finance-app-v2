import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getCategoryVisual } from '../lib/categoryVisuals'

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
      directTiles.push({
        key: `d-${sc.small_category_id}`,
        type: 'direct',
        label: sc.small_category_name,
        bigId: bc.big_category_id,
        smallId: sc.small_category_id,
        icon: visual.icon,
        palette: visual.palette,
      })
    }
  }

  return [...directTiles, ...groupTiles, { key: 'manage', type: 'manage', label: '編集' }]
}

export default function useCategoryTiles() {
  const [bigCategories, setBigCategories] = useState([])
  const [smallCategoriesByBig, setSmallCategoriesByBig] = useState({})

  useEffect(() => {
    async function fetchCategories() {
      try {
        const [{ data: bigData, error: bigError }, { data: smallData, error: smallError }] = await Promise.all([
          supabase.from('big_category_master').select('big_category_id, big_category_name').order('big_category_id'),
          supabase.from('small_category_master').select('small_category_id, big_category_id, small_category_name').order('big_category_id, small_category_id'),
        ])
        if (bigError) throw bigError
        if (smallError) throw smallError

        setBigCategories(bigData || [])

        const grouped = {}
        for (const sc of smallData || []) {
          if (!grouped[sc.big_category_id]) grouped[sc.big_category_id] = []
          grouped[sc.big_category_id].push(sc)
        }
        setSmallCategoriesByBig(grouped)
      } catch (err) {
        console.error('カテゴリ取得失敗', err)
      }
    }
    fetchCategories()
  }, [])

  const tiles = useMemo(() => buildTiles(bigCategories, smallCategoriesByBig), [bigCategories, smallCategoriesByBig])

  return { bigCategories, smallCategoriesByBig, tiles }
}
