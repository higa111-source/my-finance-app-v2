import { useState } from 'react'
import TemplateSettingsView from './TemplateSettingsView'
import TemplateApplyView from './TemplateApplyView'

function TemplatePage() {
  const [mode, setMode] = useState('settings')

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex gap-2 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setMode('settings')}
          className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'settings' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}
        >
          設定
        </button>
        <button
          type="button"
          onClick={() => setMode('apply')}
          className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'apply' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}
        >
          出力
        </button>
      </div>

      {mode === 'settings' ? <TemplateSettingsView /> : <TemplateApplyView />}
    </div>
  )
}

export default TemplatePage
