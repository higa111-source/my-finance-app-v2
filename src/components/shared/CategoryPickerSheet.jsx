function CategoryPickerSheet({ bigCategoryName, smallCategories, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-center text-sm font-bold text-gray-500">{bigCategoryName}を選択</p>
        <div className="flex flex-col gap-2">
          {smallCategories.map((sc) => (
            <button
              key={sc.small_category_id}
              type="button"
              onClick={() => onSelect(sc.small_category_id, sc.small_category_name)}
              className="rounded-lg border border-gray-200 py-3 text-gray-700 active:bg-gray-50"
            >
              {sc.small_category_name}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm text-gray-400">
          キャンセル
        </button>
      </div>
    </div>
  )
}

export default CategoryPickerSheet
