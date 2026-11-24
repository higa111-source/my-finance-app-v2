import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { AuthContext } from '../../hooks/authContext'
import { hasStoredSession } from '../../lib/auth'
import LoginSheet from './LoginSheet'

function AuthProvider({ children }) {
  // 起動を待たせないよう、通信せず端末の保存情報だけで判定する
  const [loggedIn, setLoggedIn] = useState(hasStoredSession)
  const [email, setEmail] = useState('')
  // null: 閉じている / { onSuccess }: 開いている
  const [loginRequest, setLoginRequest] = useState(null)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(hasStoredSession())
      if (session?.user?.email) setEmail(session.user.email)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const requestLogin = useCallback((onSuccess) => setLoginRequest({ onSuccess }), [])

  // 他の端末のログインは残す
  const logout = useCallback(() => supabase.auth.signOut({ scope: 'local' }), [])

  const handleSuccess = () => {
    const onSuccess = loginRequest?.onSuccess
    setLoggedIn(true)
    setLoginRequest(null)
    onSuccess?.()
  }

  const value = useMemo(
    () => ({ loggedIn, email, requestLogin, logout }),
    [loggedIn, email, requestLogin, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginRequest && (
        <LoginSheet
          willContinue={Boolean(loginRequest.onSuccess)}
          onSuccess={handleSuccess}
          onClose={() => setLoginRequest(null)}
        />
      )}
    </AuthContext.Provider>
  )
}

export default AuthProvider
