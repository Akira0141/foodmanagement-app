import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error){
      setError(error.message)
      return
    }
    // ログイン成功
    navigate('/items')
  }

  return (
    <div className="min-h-screen flex items-center justify-center emoji-wallpaper">
      <div className="absolute top-4 right-4">
        <button onClick={() => setShowHelpModal(true)} className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
          ？
        </button>
      </div>
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded shadow w-full max-w-sm card-ghost">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-sky-700">食材在庫管理アプリ</div>
        </div>
        <form onSubmit={handleSubmit}>
          <h1 className="text-xl font-semibold mb-4">ログイン</h1>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <label className="block mb-2">メールアドレス
            <input className="mt-1 block w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
          </label>
          <label className="block mb-4">パスワード
            <input type="password" className="mt-1 block w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
          </label>
          <button className="w-full bg-sky-600 text-white p-2 rounded">ログイン</button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
          アカウントをお持ちでない方は
          <Link to="/register" className="text-sky-600 font-medium underline">会員登録</Link>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 card-ghost">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">アプリの使い方</h2>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="text-sm text-gray-700 space-y-3">
              <div>
                <p className="font-semibold text-sky-700 mb-1">📝 食材を追加する</p>
                <p>絵文字、食材名、数量、単位、保管場所、購入日、賞味期限、メモを入力して「追加」ボタンをクリック</p>
                <p className="text-xs text-gray-600 mt-1">絵文字は自分で選ばずに登録すると、品名から推測して自動で選んで登録します</p>
              </div>
              <div>
                <p className="font-semibold text-sky-700 mb-1">🔍 食材を検索する</p>
                <p>食材名、保管場所、またはメモのキーワードで検索できます</p>
              </div>
              <div>
                <p className="font-semibold text-sky-700 mb-1">📅 期限で並び替える</p>
                <p>「期限が近い順」「期限が遠い順」など、条件に合わせて並べ替え</p>
              </div>
              <div>
                <p className="font-semibold text-sky-700 mb-1">✏️ 食材を編集する</p>
                <p>食材の「編集」ボタンをクリックして、内容を変更してから「更新」をクリック</p>
              </div>
              <div>
                <p className="font-semibold text-sky-700 mb-1">🗑️ 食材を削除する</p>
                <p>不要な食材の「削除」ボタンをクリックして、確認画面で削除</p>
              </div>
              <div>
                <p className="font-semibold text-sky-700 mb-1">⚠️ 期限の色</p>
                <p>赤：賞味期限が1日以内 / 黄：3日以内</p>
              </div>
            </div>
            <button onClick={() => setShowHelpModal(false)} className="mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-semibold">閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}
