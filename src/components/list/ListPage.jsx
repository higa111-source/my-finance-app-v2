import { useState } from 'react'
import ExpenseListView from './ExpenseListView'
import ExpenseEditView from './ExpenseEditView'

function ListPage() {
  const [mode, setMode] = useState('list')
  const [editingExpense, setEditingExpense] = useState(null)
  const [reload, setReload] = useState(false)
  // 編集画面から戻っても条件が残るよう、ここで保持する
  const [filters, setFilters] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1, kind: '', bigId: '', smallId: '', note: '' }
  })

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setMode('edit')
  }

  const handleBackToList = () => {
    setMode('list')
    setReload((r) => !r)
  }

  if (mode === 'edit' && editingExpense) {
    return (
      <ExpenseEditView
        expense={editingExpense}
        onCancel={() => setMode('list')}
        onSaved={handleBackToList}
        onDeleted={handleBackToList}
      />
    )
  }

  return <ExpenseListView reload={reload} filters={filters} onFiltersChange={setFilters} onEdit={handleEdit} />
}

export default ListPage
