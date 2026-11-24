import { useState } from 'react'
import BottomNav from './components/layout/BottomNav'
import ExpenseInputPage from './components/expense-input/ExpenseInputPage'
import ListPage from './components/list/ListPage'
import ReportPage from './components/report/ReportPage'
import ItemGraphPage from './components/graph/ItemGraphPage'
import TemplatePage from './components/template/TemplatePage'
import useAuth from './hooks/authContext'

function App() {
  const [page, setPage] = useState('input')
  const { loggedIn, requestLogin } = useAuth()
  const loginKey = loggedIn ? 'in' : 'out' // ログイン状態が変わったら取得し直す

  return (
    <>
      {!loggedIn && (
        <div className="flex items-center justify-between bg-amber-100 px-4 py-1.5 text-xs text-amber-800">
          <span>ログインしていません</span>
          <button type="button" onClick={() => requestLogin()} className="px-2 py-1 font-bold underline">
            ログイン
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {page === 'input' && <ExpenseInputPage />}
        {page === 'list' && <ListPage />}
        {page === 'report' && <ReportPage key={loginKey} />}
        {page === 'graph' && <ItemGraphPage key={loginKey} />}
        {page === 'template' && <TemplatePage />}
      </div>
      <BottomNav page={page} onNavigate={setPage} />
    </>
  )
}

export default App
