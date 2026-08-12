import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ItemsPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="p-6 bg-sky-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">在庫一覧</h1>
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
