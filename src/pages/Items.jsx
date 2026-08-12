import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ItemsPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
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
    const { data, error } = await supabase.from('items').select('*').order('expires_at', { ascending: true })
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
    // 簡易バリデーション
    if(!name) return
    // もし expiresAt が空なら null を入れる。サーバ側でデフォルト提案することも可能
    const payload = {
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
      return
    }
    // 追加後は入力クリアして再取得
    setName('')
    setQuantity('')
    setUnit('')
    setLocation('冷蔵庫')
    setPurchasedAt('')
    setExpiresAt('')
    setNotes('')
    fetchItems()
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
            <button className="bg-sky-600 text-white px-4 py-2 rounded">追加</button>
          </div>
        </form>

        {loading && <div>読み込み中...</div>}
        {!loading && (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`p-3 bg-white rounded shadow flex items-center justify-between ${isExpiringSoon(item.expires_at)? 'border-l-4 border-red-400':''}`}>
                <div>
                  <div className="text-lg">{item.emoji || '🍽️'} {item.name}</div>
                  <div className="text-sm text-gray-600">{item.quantity}{item.unit? item.unit: ''} - {item.location}</div>
                </div>
                <div className="text-sm text-gray-700">{item.expires_at? new Date(item.expires_at).toLocaleDateString(): '期限なし'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function isExpiringSoon(dateStr){
  if(!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (d - now) / (1000*60*60*24)
  return diff <= 3
}
