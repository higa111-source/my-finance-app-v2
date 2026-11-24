import { useState } from 'react'
import { supabase } from '../../supabaseClient'

const INPUT_CLASS = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 focus:border-orange-300 focus:outline-none'

function LoginSheet({ willContinue, onSuccess, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorText, setErrorText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErrorText('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      console.error('ログイン失敗', error)
      setErrorText(
        error.code === 'invalid_credentials'
          ? 'メールアドレスかパスワードが違います'
          : 'ログインできませんでした。通信状態を確認してください'
      )
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={busy ? undefined : onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[480px] flex-col gap-3 rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <p className="text-center text-sm font-bold text-gray-600">ログイン</p>
        {willContinue && (
          <p className="text-center text-xs text-gray-500">入力内容は残っています。ログイン後に続けて処理します。</p>
        )}
        <input
          type="email"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          aria-label="メールアドレス"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={INPUT_CLASS}
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          aria-label="パスワード"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={INPUT_CLASS}
        />
        {errorText && <p className="text-center text-sm text-red-500">❌ {errorText}</p>}
        <button type="submit" disabled={busy} className="rounded-xl bg-orange-500 py-3 text-base font-bold text-white disabled:opacity-50">
          {busy ? 'ログイン中...' : 'ログイン'}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className="py-2 text-sm text-gray-400">
          キャンセル
        </button>
      </form>
    </div>
  )
}

export default LoginSheet
