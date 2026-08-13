import React, { useState } from 'react'
import { signUpWithEmail } from '../lib/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const [success,setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const { data, error } = await signUpWithEmail(email, password)
    if(error){
      setError(error.message)
      return
    }
    setSuccess(true)
    // そのままログイン画面に戻す。Supabase 側で確認メールスキップを有効にしている想定
    setTimeout(()=>navigate('/login'), 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <h1 className="text-xl font-semibold mb-4">会員登録</h1>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">登録が完了しました。ログイン画面へ移動します。</div>}
          <label className="block mb-2">メールアドレス
            <input className="mt-1 block w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
          </label>
          <label className="block mb-4">パスワード
            <input type="password" className="mt-1 block w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
          </label>
          <button className="w-full bg-sky-600 text-white p-2 rounded">会員登録</button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
          すでにアカウントをお持ちの方は
          <Link to="/login" className="text-sky-600 font-medium underline">ログイン</Link>
        </div>
      </div>
    </div>
  )
}
