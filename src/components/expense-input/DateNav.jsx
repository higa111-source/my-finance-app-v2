import { formatDateJa, toDateInputValue, fromDateInputValue } from '../../lib/date'

function DateNav({ date, onPrevDay, onNextDay, onSetDate }) {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-2">
      <button type="button" onClick={onPrevDay} className="text-sm text-gray-400">
        ← 前日
      </button>

      <div className="relative flex-1 text-center">
        <span className="text-lg font-bold text-gray-800">{formatDateJa(date)}</span>
        <input
          type="date"
          value={toDateInputValue(date)}
          onChange={(e) => e.target.value && onSetDate(fromDateInputValue(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <button type="button" onClick={onNextDay} className="text-sm text-gray-400">
        翌日 →
      </button>
    </div>
  )
}

export default DateNav
