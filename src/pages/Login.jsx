import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function LoginPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
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
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
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
    </div>
  )
}
