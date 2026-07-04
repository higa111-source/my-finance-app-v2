import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import useUserName from '../../hooks/useUserName'
import useCategoryTiles from '../../hooks/useCategoryTiles'

function TemplateSettingsView() {
  const userName = useUserName()
  const { bigCategories, smallCategoriesByBig } = useCategoryTiles()

  const [templates, setTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [bigCategory, setBigCategory] = useState('')
  const [smallCategory, setSmallCategory] = useState('')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editingId, setEditingId] = useState(null)

  const smallCategories = smallCategoriesByBig[Number(bigCategory)] || []

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('template_expenses')
      .select(`id, template_name, day_of_month, amount, note, is_active,
        big_category_id, small_category_id,
        big_category_master (big_category_name),
        small_category_master (small_category_name)`)
      .order('is_active', { ascending: false })
      .order('day_of_month')
    if (error) {
      console.error('テンプレート取得失敗', error)
      return
    }
    setTemplates(data || [])
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (editingId) return
    const list = smallCategoriesByBig[Number(bigCategory)] || []
    setSmallCategory(list.length > 0 ? String(list[0].small_category_id) : '')
  }, [bigCategory, smallCategoriesByBig, editingId])

  const clearForm = () => {
    setTemplateName('')
    setDayOfMonth(1)
    setBigCategory('')
    setSmallCategory('')
    setNote('')
    setAmount('')
    setIsActive(true)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!templateName || !bigCategory || !amount) {
      alert('テンプレート名・大カテゴリ・金額は必須です')
      return
    }

    const payload = {
      template_name: templateName,
      day_of_month: Number(dayOfMonth),
      big_category_id: Number(bigCategory),
      small_category_id: smallCategory ? Number(smallCategory) : null,
      note,
      amount: Number(amount),
      is_active: isActive,
      last_updated_by: userName,
    }

    const { error } = editingId
      ? await supabase.from('template_expenses').update(payload).eq('id', editingId)
      : await supabase.from('template_expenses').insert([{ ...payload, created_by: userName }])

    if (error) {
      console.error('テンプレート保存失敗', error)
      alert('保存に失敗しました')
      return
    }
    clearForm()
    fetchTemplates()
  }

  const handleEdit = (t) => {
    setTemplateName(t.template_name)
    setDayOfMonth(t.day_of_month)
    setBigCategory(String(t.big_category_id))
    setSmallCategory(t.small_category_id ? String(t.small_category_id) : '')
    setNote(t.note || '')
    setAmount(String(t.amount))
    setIsActive(t.is_active)
    setEditingId(t.id)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return
    const { error } = await supabase.from('template_expenses').delete().eq('id', id)
    if (error) {
      console.error('テンプレート削除失敗', error)
      return
    }
    fetchTemplates()
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-2 bg-white px-4 py-3">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="テンプレート名"
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        />
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-sm text-gray-500">
            毎月
            <input
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
            日
          </label>
        </div>
        <div className="flex gap-2">
          <select
            value={bigCategory}
            onChange={(e) => setBigCategory(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            <option value="">大カテゴリを選択</option>
            {bigCategories.map((bc) => (
              <option key={bc.big_category_id} value={bc.big_category_id}>{bc.big_category_name}</option>
            ))}
          </select>
          <select
            value={smallCategory}
            onChange={(e) => setSmallCategory(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            <option value="">小カテゴリを選択</option>
            {smallCategories.map((sc) => (
              <option key={sc.small_category_id} value={sc.small_category_id}>{sc.small_category_name}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ"
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額"
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          有効
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={handleSubmit} className="flex-1 rounded-lg bg-orange-100 py-2 text-sm font-bold text-orange-600">
            {editingId ? '更新' : '追加'}
          </button>
          {editingId && (
            <button type="button" onClick={clearForm} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-bold text-gray-500">
              キャンセル
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-3 py-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-xl bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{t.template_name}</span>
              <span className={`text-xs font-bold ${t.is_active ? 'text-emerald-500' : 'text-gray-400'}`}>
                {t.is_active ? '有効' : '無効'}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              毎月 {t.day_of_month} 日 / {t.big_category_master?.big_category_name || '-'} / {t.small_category_master?.small_category_name || '-'}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-base font-bold text-gray-800">¥{Number(t.amount).toLocaleString()}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(t)} className="text-xs text-orange-500">編集</button>
                <button type="button" onClick={() => handleDelete(t.id)} className="text-xs text-red-400">削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateSettingsView
