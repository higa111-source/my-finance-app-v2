import { useRef, useState } from 'react'
import { ChevronUp, Pencil } from 'lucide-react'

const PAGE_SIZE = 12

function Tile({ tile, selected, onClick }) {
  const { label, icon: Icon, palette } = tile

  if (tile.type === 'manage') {
    return (
      <button
        type="button"
        disabled={!onClick}
        onClick={onClick}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white p-1 ${onClick ? '' : 'opacity-50'}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Pencil size={16} />
        </span>
        <span className="text-xs text-gray-500">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white p-1 ${selected ? `ring-2 ${palette.ring}` : ''}`}
    >
      {tile.type === 'group' ? (
        // 大カテゴリ: 塗りつぶしの角丸四角 + シートが開くことを示すバッジ
        <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-white ${palette.solid}`}>
          <Icon size={18} />
          <span className={`absolute -right-1.5 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow ${palette.text}`}>
            <ChevronUp size={12} strokeWidth={3} />
          </span>
        </span>
      ) : (
        // 小カテゴリ: 淡色の丸
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
          <Icon size={18} />
        </span>
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </button>
  )
}

function CategoryGrid({ tiles, selectedBig, selectedSmall, onSelectDirect, onOpenGroup, onManage }) {
  const scrollRef = useRef(null)
  const [pageState, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(tiles.length / PAGE_SIZE))
  // カテゴリ削除でページ数が減った場合に範囲外にならないようにする
  const page = Math.min(pageState, pageCount - 1)
  const pages = Array.from({ length: pageCount }, (_, i) =>
    tiles.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE)
  )

  const handleScroll = (e) => {
    const { scrollLeft, clientWidth } = e.currentTarget
    if (clientWidth > 0) setPage(Math.round(scrollLeft / clientWidth))
  }

  const goToPage = (i) => {
    const el = scrollRef.current
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  const isSelected = (tile) =>
    tile.type === 'direct'
      ? tile.bigId === selectedBig && tile.smallId === selectedSmall
      : tile.bigId === selectedBig

  // 全ページで行数を揃え、スワイプ時にタイルの高さが変わらないようにする
  const rows = Math.max(1, Math.ceil(pages[0].length / 4))

  return (
    <div className="flex h-full flex-col pb-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex shrink-0 grow snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((pageTiles, i) => (
          <div
            key={i}
            className="grid w-full shrink-0 snap-start snap-always grid-cols-4 gap-1.5 p-2"
            style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
          >
            {pageTiles.map((tile) => (
              <Tile
                key={tile.key}
                tile={tile}
                selected={isSelected(tile)}
                onClick={
                  tile.type === 'manage'
                    ? onManage
                    : tile.type === 'group'
                      ? () => onOpenGroup(tile)
                      : () => onSelectDirect(tile)
                }
              />
            ))}
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex justify-center gap-2 pb-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`${i + 1}ページ目を表示`}
              className={`h-1.5 w-1.5 rounded-full ${i === page ? 'bg-orange-400' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryGrid
