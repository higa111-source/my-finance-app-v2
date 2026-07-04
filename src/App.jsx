import { useState } from 'react'
import BottomNav from './components/layout/BottomNav'
import ExpenseInputPage from './components/expense-input/ExpenseInputPage'
import ListPage from './components/list/ListPage'
import ReportPage from './components/report/ReportPage'
import ItemGraphPage from './components/graph/ItemGraphPage'
import TemplatePage from './components/template/TemplatePage'

function App() {
  const [page, setPage] = useState('input')

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {page === 'input' && <ExpenseInputPage />}
        {page === 'list' && <ListPage />}
        {page === 'report' && <ReportPage />}
        {page === 'graph' && <ItemGraphPage />}
        {page === 'template' && <TemplatePage />}
      </div>
      <BottomNav page={page} onNavigate={setPage} />
    </>
  )
}

export default App
