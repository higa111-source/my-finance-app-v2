import { useState } from 'react'
import { Pencil } from 'lucide-react'

const PAGE_SIZE = 12

function Tile({ tile, selected, onClick }) {
  const { label, icon: Icon, palette } = tile

  if (tile.type === 'manage') {
    return (
      <button
        type="button"
        disabled
        className="flex flex-col items-center gap-0.5 rounded-xl bg-white p-1 opacity-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Pencil size={12} />
        </span>
        <span className="text-[9px] text-gray-500">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl bg-white p-1 ${selected ? `ring-2 ${palette.ring}` : ''}`}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
        <Icon size={13} />
      </span>
      <span className="text-[9px] text-gray-600">{label}</span>
    </button>
  )
}

function CategoryGrid({ tiles, selectedBig, selectedSmall, onSelectDirect, onOpenGroup }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(tiles.length / PAGE_SIZE))
  const visibleTiles = tiles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const isSelected = (tile) =>
    tile.type === 'direct'
      ? tile.bigId === selectedBig && tile.smallId === selectedSmall
      : tile.bigId === selectedBig

  return (
    <div className="pb-1">
      <div className="grid grid-cols-4 gap-1 p-1.5">
        {visibleTiles.map((tile) => (
          <Tile
            key={tile.key}
            tile={tile}
            selected={isSelected(tile)}
            onClick={tile.type === 'group' ? () => onOpenGroup(tile) : () => onSelectDirect(tile)}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex justify-center gap-2 pb-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-1.5 w-1.5 rounded-full ${i === page ? 'bg-orange-400' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryGrid
