import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ItemsPage from './pages/Items'
import { supabase } from './lib/supabaseClient'

// シンプルな認証保護: 未ログイン時は /login にリダイレクト
function Protected({ children }){
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(()=>{
    let mounted = true
    supabase.auth.getUser().then(res=>{
      if(!mounted) return
      setUser(res.data.user)
      setLoading(false)
    })
    const { subscription } = supabase.auth.onAuthStateChange((event, session)=>{
      setUser(session?.user ?? null)
    })
    return ()=>{
      mounted = false
      subscription?.unsubscribe()
    }
  },[])

  if(loading) return <div>認証情報を確認中...</div>
  if(!user) return <Navigate to="/login" replace />
  return children
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/items" element={<Protected><ItemsPage/></Protected>} />
        <Route path="/" element={<Navigate to="/items" replace/>} />
      </Routes>
    </BrowserRouter>
  )
}
