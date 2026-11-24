import { useState } from 'react'
import { X, Pencil, Trash2, Plus, Check } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getCategoryVisual } from '../../lib/categoryVisuals'

// 小カテゴリIDは「大カテゴリID×100 + 連番」の採番ルール。
// 同じ大カテゴリ内の最大値+1 を基本とし、全体で重複しないIDを選ぶ。
function nextSmallCategoryId(bigId, smallCategoriesByBig) {
  const usedIds = new Set(
    Object.values(smallCategoriesByBig).flat().map((sc) => sc.small_category_id)
  )
  const siblings = smallCategoriesByBig[bigId] || []
  let candidate = siblings.length > 0
    ? Math.max(...siblings.map((sc) => sc.small_category_id)) + 1
    : bigId * 100 + 1
  while (usedIds.has(candidate)) candidate++
  return candidate
}

function CategoryManageSheet({ bigCategories, smallCategoriesByBig, onChanged, onDeleted, onClose }) {
  // editing: { type: 'rename', smallId } | { type: 'add', bigId } | null
  const [editing, setEditing] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const showMessage = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const startRename = (sc) => {
    setEditing({ type: 'rename', smallId: sc.small_category_id, bigId: sc.big_category_id })
    setInputValue(sc.small_category_name)
  }

  const startAdd = (bigId) => {
    setEditing({ type: 'add', bigId })
    setInputValue('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setInputValue('')
  }

  const validateName = (name, bigId, excludeSmallId = null) => {
    if (!name) return '名前を入力してください'
    const duplicated = (smallCategoriesByBig[bigId] || []).some(
      (sc) => sc.small_category_name === name && sc.small_category_id !== excludeSmallId
    )
    if (duplicated) return `「${name}」は既にあります`
    return null
  }

  const handleSubmitEdit = async () => {
    if (!editing || busy) return
    const name = inputValue.trim()
    const excludeId = editing.type === 'rename' ? editing.smallId : null
    const invalid = validateName(name, editing.bigId, excludeId)
    if (invalid) {
      showMessage(`❌ ${invalid}`)
      return
    }

    setBusy(true)
    try {
      // .select() で結果行を受け取り、権限設定(RLS)で無視された場合も検知する
      const { data, error } = editing.type === 'add'
        ? await supabase
          .from('small_category_master')
          .insert([{
            big_category_id: editing.bigId,
            small_category_id: nextSmallCategoryId(editing.bigId, smallCategoriesByBig),
            small_category_name: name,
          }])
          .select()
        : await supabase
          .from('small_category_master')
          .update({ small_category_name: name })
          .eq('small_category_id', editing.smallId)
          .select()

      if (error) throw error
      if (!data || data.length === 0) throw new Error('変更が反映されませんでした（権限設定を確認してください）')

      showMessage(editing.type === 'add' ? `✅ 「${name}」を追加しました` : `✅ 「${name}」に変更しました`)
      cancelEdit()
      onChanged()
    } catch (err) {
      console.error('カテゴリ保存失敗', err)
      showMessage(`❌ 保存に失敗しました: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (sc) => {
    if (busy) return
    setBusy(true)
    try {
      // 支出(論理削除済みを含む)・テンプレートで使われていないか確認
      const [expenseRes, templateRes] = await Promise.all([
        supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('small_category_id', sc.small_category_id),
        supabase.from('template_expenses').select('id', { count: 'exact', head: true }).eq('small_category_id', sc.small_category_id),
      ])
      if (expenseRes.error) throw expenseRes.error
      if (templateRes.error) throw templateRes.error

      const expenseCount = expenseRes.count ?? 0
      const templateCount = templateRes.count ?? 0
      if (expenseCount > 0 || templateCount > 0) {
        const usages = []
        if (expenseCount > 0) usages.push(`支出${expenseCount}件`)
        if (templateCount > 0) usages.push(`テンプレート${templateCount}件`)
        showMessage(`❌ 「${sc.small_category_name}」は${usages.join('・')}で使われているため削除できません`)
        return
      }

      if (!window.confirm(`「${sc.small_category_name}」を削除しますか？`)) return

      const { data, error } = await supabase
        .from('small_category_master')
        .delete()
        .eq('small_category_id', sc.small_category_id)
        .select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error('削除が反映されませんでした（権限設定を確認してください）')

      showMessage(`✅ 「${sc.small_category_name}」を削除しました`)
      onDeleted(sc.small_category_id)
      onChanged()
    } catch (err) {
      console.error('カテゴリ削除失敗', err)
      showMessage(`❌ 削除に失敗しました: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const renderEditRow = (key) => (
    <div key={key} className="flex items-center gap-2 px-3 py-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmitEdit()
          if (e.key === 'Escape') cancelEdit()
        }}
        autoFocus
        placeholder="小カテゴリ名"
        className="min-w-0 flex-1 rounded-lg border border-orange-300 px-3 py-2 text-base text-gray-700 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmitEdit}
        disabled={busy}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white disabled:opacity-50"
        aria-label="保存"
      >
        <Check size={18} />
      </button>
      <button
        type="button"
        onClick={cancelEdit}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
        aria-label="キャンセル"
      >
        <X size={18} />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-black/40">
      <div className="flex h-full w-full max-w-[480px] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-base font-bold text-gray-700">カテゴリ編集</span>
          <button type="button" onClick={onClose} className="p-1 text-gray-400" aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        {message && (
          <div className={`px-4 py-2 text-center text-sm ${message.includes('❌') ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
            {message}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-orange-50/40 pb-[env(safe-area-inset-bottom)]">
          {bigCategories.map((bc) => {
            const { icon: Icon, palette } = getCategoryVisual(bc.big_category_name)
            const smalls = smallCategoriesByBig[bc.big_category_id] || []
            const isAddingHere = editing?.type === 'add' && editing.bigId === bc.big_category_id

            return (
              <section key={bc.big_category_id} className="mx-3 my-3 overflow-hidden rounded-xl bg-white">
                <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
                    <Icon size={15} />
                  </span>
                  <span className="text-sm font-bold text-gray-600">{bc.big_category_name}</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {smalls.map((sc) =>
                    editing?.type === 'rename' && editing.smallId === sc.small_category_id
                      ? renderEditRow(sc.small_category_id)
                      : (
                        <div key={sc.small_category_id} className="flex items-center gap-1 px-3 py-1">
                          <span className="flex-1 py-2 text-sm text-gray-700">{sc.small_category_name}</span>
                          <button
                            type="button"
                            onClick={() => startRename(sc)}
                            disabled={busy}
                            className="flex h-10 w-10 items-center justify-center text-gray-400 active:text-orange-500"
                            aria-label={`${sc.small_category_name}の名前を変更`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sc)}
                            disabled={busy}
                            className="flex h-10 w-10 items-center justify-center text-gray-400 active:text-red-500"
                            aria-label={`${sc.small_category_name}を削除`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                  )}

                  {isAddingHere ? renderEditRow('add') : (
                    <button
                      type="button"
                      onClick={() => startAdd(bc.big_category_id)}
                      disabled={busy}
                      className="flex w-full items-center gap-2 px-3 py-3 text-sm text-orange-500 active:bg-orange-50"
                    >
                      <Plus size={16} />
                      小カテゴリを追加
                    </button>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryManageSheet
