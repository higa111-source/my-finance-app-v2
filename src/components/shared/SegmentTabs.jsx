// options: [{ value, label, activeClass }]
function SegmentTabs({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-full bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full py-1.5 text-sm font-bold ${o.value === value ? o.activeClass : 'text-gray-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentTabs
