export const AUTH_STORAGE_KEY = 'kakeibo-auth'

// ログイン情報が端末に残っているか。
// 通信エラー中も残るため、「圏外」と「ログアウト」を区別できる。
export function hasStoredSession() {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

const AUTH_ERROR_CODES = ['42501', 'PGRST301', 'PGRST302', 'PGRST303']

// 未ログインが原因で DB に拒否されたか。
// RLS は更新・削除をエラーにせず0件で返すため、件数も渡せるようにしている。
export function needsLogin(error, rows) {
  if (hasStoredSession()) return false
  if (error) return AUTH_ERROR_CODES.includes(error.code)
  return Array.isArray(rows) && rows.length === 0
}
