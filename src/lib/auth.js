// Supabase の認証ヘルパ
// - サインアップ、サインイン、サインアウトをラップする
// - 現在のセッション取得や onAuthStateChange の購読を提供する

import { supabase } from './supabaseClient'

export async function signUpWithEmail(email, password) {
  // パスワードでユーザー作成（メール確認は Supabase 側で無効化している想定）
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function getCurrentUser() {
  return supabase.auth.getUser()
}

// リアルタイムでの認証状態変更を購読する
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
