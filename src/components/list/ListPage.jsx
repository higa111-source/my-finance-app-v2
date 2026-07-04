import { useState } from 'react'
import ExpenseListView from './ExpenseListView'
import ExpenseEditView from './ExpenseEditView'

function ListPage() {
  const [mode, setMode] = useState('list')
  const [editingExpense, setEditingExpense] = useState(null)
  const [reload, setReload] = useState(false)

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

  return <ExpenseListView reload={reload} onEdit={handleEdit} />
}

export default ListPage
