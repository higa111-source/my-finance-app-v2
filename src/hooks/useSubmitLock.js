import { useCallback, useRef, useState } from 'react'

const COOLDOWN_MS = 1000

// 登録処理の二重実行を防ぐ。
// state の更新は次の描画まで反映されないため、判定には即時に変わる ref を使う。
// 成功直後（task が true を返した後）の連打も、短時間だけ無視する。
export default function useSubmitLock() {
  const lockedRef = useRef(false)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async (task) => {
    if (lockedRef.current) return
    lockedRef.current = true
    setBusy(true)
    let succeeded = false
    try {
      succeeded = (await task()) === true
    } finally {
      setBusy(false)
      if (succeeded) {
        setTimeout(() => { lockedRef.current = false }, COOLDOWN_MS)
      } else {
        lockedRef.current = false
      }
    }
  }, [])

  return { busy, run }
}
