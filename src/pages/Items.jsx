import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ItemsPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [location, setLocation] = useState('冷蔵庫')
  const [purchasedAt, setPurchasedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=>{
    fetchItems()
    // 簡易ポーリング: 60秒ごと
    const id = setInterval(fetchItems, 60000)
    return ()=>clearInterval(id)
  },[])

  async function fetchItems(){
    setLoading(true)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if(userError || !userData?.user){
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('expires_at', { ascending: true })

    if(error){
      console.error(error)
      setItems([])
    }else{
      setItems(data)
    }
    setLoading(false)
  }

  async function handleAdd(e){
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    // 簡易バリデーション
    if(!name){
      setErrorMessage('食材名を入力してください。')
      return
    }
    setSubmitting(true)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if(userError || !userData?.user){
      setErrorMessage('ログイン状態を確認できませんでした。再度ログインしてください。')
      setSubmitting(false)
      return
    }

    // もし expiresAt が空なら null を入れる。サーバ側でデフォルト提案することも可能
    const payload = {
      user_id: userData.user.id,
      name,
      quantity: quantity || null,
      unit: unit || null,
      location: location || null,
      purchased_at: purchasedAt || null,
      expires_at: expiresAt || null,
      notes: notes || null,
      emoji: ''
    }
    const { data, error } = await supabase.from('items').insert([payload]).select().single()
    if(error){
      console.error(error)
      setErrorMessage(error.message || '登録に失敗しました。Supabase の items テーブルと RLS を確認してください。')
      setSubmitting(false)
      return
    }
    // 追加後: サーバ側で emoji が補完されるように Edge Function を呼び出して補完を依頼
    try{
      const functionsBase = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://ernmoosoaucausczssqz.functions.supabase.co'
      await fetch(`${functionsBase}/assign-emoji`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id: data.id, name: data.name })
      })
    }catch(e){
      console.error('Edge Function call failed', e)
    }

    // 入力クリアして再取得
    setName('')
    setQuantity('')
    setUnit('')
    setLocation('冷蔵庫')
    setPurchasedAt('')
    setExpiresAt('')
    setNotes('')
    setSuccessMessage('追加しました。')
    setSubmitting(false)
    await fetchItems()
  }

  async function handleLogout(){
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="p-6 bg-sky-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">在庫一覧</h1>
          <div>
            <button onClick={handleLogout} className="mr-2 bg-gray-200 px-3 py-1 rounded">ログアウト</button>
          </div>
        </div>

        <form onSubmit={handleAdd} className="mb-4 bg-white p-4 rounded shadow">
          {(errorMessage || successMessage) && (
            <div className={`mb-3 rounded p-2 text-sm ${errorMessage ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {errorMessage || successMessage}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-2 border p-2 rounded" placeholder="食材名" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border p-2 rounded" placeholder="数量" value={quantity} onChange={e=>setQuantity(e.target.value)} />
            <input className="border p-2 rounded" placeholder="単位" value={unit} onChange={e=>setUnit(e.target.value)} />
            <input className="border p-2 rounded" placeholder="保管場所" value={location} onChange={e=>setLocation(e.target.value)} />
            <input type="date" className="border p-2 rounded" value={purchasedAt} onChange={e=>setPurchasedAt(e.target.value)} />
            <input type="date" className="border p-2 rounded" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
            <input className="col-span-3 border p-2 rounded" placeholder="メモ" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
          <div className="mt-2">
            <button disabled={submitting} className="bg-sky-600 text-white px-4 py-2 rounded disabled:opacity-60">
              {submitting ? '追加中...' : '追加'}
            </button>
          </div>
        </form>

        {loading && <div>読み込み中...</div>}
        {!loading && (
          <div className="space-y-2">
            {items.map(item => {
              const expiry = getExpiryState(item.expires_at)
              return (
                <div key={item.id} className={`p-3 bg-white rounded shadow flex items-center justify-between ${expiry === 'danger' ? 'border-l-4 border-red-400 bg-red-50' : expiry === 'warning' ? 'border-l-4 border-yellow-400 bg-yellow-50' : ''}`}>
                  <div>
                    <div className="text-lg">{item.emoji || '🍽️'} {item.name}</div>
                    <div className="text-sm text-gray-600">{item.quantity}{item.unit? item.unit: ''} - {item.location}</div>
                  </div>
                  <div className="text-sm text-gray-700">{item.expires_at? new Date(item.expires_at).toLocaleDateString(): '期限なし'}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getExpiryState(dateStr){
  if(!dateStr) return 'normal'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (d - now) / (1000*60*60*24)
  if(diff <= 1) return 'danger'
  if(diff <= 3) return 'warning'
  return 'normal'
}
