import { createClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, hasStoredSession } from './lib/auth.js'

const supabaseUrl = 'https://fxfrdomzvehxfgnaboqu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZnJkb216dmVoeGZnbmFib3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzg2OTQsImV4cCI6MjA3MTI1NDY5NH0.pR1htU-_rG4cLkWVxA-bNEx_z5LHN2F4NLN3ezwObh4'

// ログイン中にトークン更新が通信エラーで失敗すると、ライブラリは匿名として送信してしまう。
// 匿名だと一覧が「0件」に見えるため、送信せず通信エラーとして扱う。
function guardedFetch(input, init) {
  const url = typeof input === 'string' ? input : input.url
  const authorization = new Headers(init?.headers).get('Authorization')
  if (
    url.startsWith(`${supabaseUrl}/rest/`) &&
    authorization === `Bearer ${supabaseAnonKey}` &&
    hasStoredSession()
  ) {
    return Promise.reject(new TypeError('ログイン情報を更新できませんでした（通信エラー）'))
  }
  return fetch(input, init)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: AUTH_STORAGE_KEY, persistSession: true, autoRefreshToken: true },
  global: { fetch: guardedFetch },
})
