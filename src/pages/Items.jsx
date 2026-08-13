import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { pickEmoji } from '../lib/emoji'

const todayString = () => new Date().toISOString().slice(0, 10)

export default function ItemsPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('expiry_soonest')
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [location, setLocation] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(todayString())
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [showHelpModal, setShowHelpModal] = useState(false)

  // 保存場所のロケーション定義
  const locationOptions = [
    { label: '冷蔵庫', emoji: '🧊', color: 'bg-blue-50 border-blue-200' },
    { label: '冷凍庫', emoji: '❄️', color: 'bg-cyan-50 border-cyan-200' },
    { label: 'ストッカー', emoji: '📦', color: 'bg-amber-50 border-amber-200' }
  ]

  // 単位のオプション定義
  const unitOptions = ['個', 'g', 'ℓ', 'パック', 'ケース']

  useEffect(()=>{
    fetchItems()
    const id = setInterval(fetchItems, 60000)
    return ()=>clearInterval(id)
  },[])

  async function getCurrentUser(){
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if(userError || !userData?.user){
      throw new Error('ログイン状態を確認できませんでした。再度ログインしてください。')
    }
    return userData.user
  }

  async function fetchItems(){
    setLoading(true)
    try{
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('expires_at', { ascending: true })

      if(error){
        console.error(error)
        setItems([])
      }else{
        setItems(data)
      }
    }catch(err){
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function resetForm(){
    setName('')
    setEmoji('')
    setQuantity('')
    setUnit('')
    setLocation('冷蔵庫')
    setPurchasedAt(todayString())
    setExpiresAt('')
    setNotes('')
    setEditingId(null)
  }

  function startEdit(item){
    setErrorMessage('')
    setSuccessMessage('')
    setEditingId(item.id)
    setName(item.name || '')
    setEmoji(item.emoji || '')
    setQuantity(item.quantity || '')
    setUnit(item.unit || '')
    setLocation(item.location || '冷蔵庫')
    setPurchasedAt(item.purchased_at ? item.purchased_at.slice(0, 10) : todayString())
    setExpiresAt(item.expires_at ? item.expires_at.slice(0, 10) : '')
    setNotes(item.notes || '')
  }

  async function handleAdd(e){
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if(!name.trim()){
      setErrorMessage('食材名を入力してください。')
      return
    }
    setSubmitting(true)

    try{
      const user = await getCurrentUser()
        const suggestedExpiresAt = computeSuggestedExpiryDate(name, expiresAt, purchasedAt)
        const chosenEmoji = emoji || pickEmoji(name)
        const payload = {
          user_id: user.id,
          name: name.trim(),
          quantity: quantity || null,
          unit: unit || null,
          location: location || null,
          purchased_at: purchasedAt || null,
          expires_at: suggestedExpiresAt,
          notes: notes || null,
          emoji: chosenEmoji || ''
        }

        const { data, error } = await supabase.from('items').insert([payload]).select().single()
      if(error){
        throw new Error(error.message || '登録に失敗しました。')
      }

      try{
        const functionsBase = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
        if(functionsBase){
          await fetch(`${functionsBase.replace(/\/$/, '')}/assign-emoji`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id, name: data.name })
          })
        }
      }catch(e){
        console.error('Edge Function call failed', e)
      }

      resetForm()
      setSuccessMessage('追加しました。')
      await fetchItems()
    }catch(err){
      setErrorMessage(err.message || '登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(e){
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if(!name.trim()){
      setErrorMessage('食材名を入力してください。')
      return
    }

    setSubmitting(true)
    try{
      const user = await getCurrentUser()
      const suggestedExpiresAt = computeSuggestedExpiryDate(name, expiresAt, purchasedAt)
      const chosenEmoji = emoji || pickEmoji(name)
      const payload = {
        name: name.trim(),
        quantity: quantity || null,
        unit: unit || null,
        location: location || null,
        purchased_at: purchasedAt || null,
        expires_at: suggestedExpiresAt,
        notes: notes || null,
        emoji: chosenEmoji || null
      }

      const { error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id)

      if(error){
        throw new Error(error.message || '更新に失敗しました。')
      }

      resetForm()
      setSuccessMessage('更新しました。')
      await fetchItems()
    }catch(err){
      setErrorMessage(err.message || '更新に失敗しました。')
    }finally{
      setSubmitting(false)
    }
  }

  async function handleDelete(itemId){
    if(!window.confirm('この食材を削除しますか？')) return

    setErrorMessage('')
    setSuccessMessage('')
    try{
      const user = await getCurrentUser()
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if(error){
        throw new Error(error.message || '削除に失敗しました。')
      }

      if(editingId === itemId){
        resetForm()
      }
      setSuccessMessage('削除しました。')
      await fetchItems()
    }catch(err){
      setErrorMessage(err.message || '削除に失敗しました。')
    }
  }

  async function handleLogout(){
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const filteredItems = items
    .filter(item => {
      const query = searchTerm.trim().toLowerCase()
      if(!query) return true
      const haystack = [item.name, item.notes, item.location, item.quantity, item.unit].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(query)
    })
    .sort((a,b) => {
      switch(sortKey){
        case 'expiry_latest':
          return compareDateDesc(a.expires_at, b.expires_at)
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'location_asc':
          return (a.location || '').localeCompare(b.location || '')
        case 'purchased_newest':
          return compareDateDesc(a.purchased_at, b.purchased_at)
        case 'expiry_soonest':
        default:
          return compareDateAsc(a.expires_at, b.expires_at)
      }
    })

  const nearExpiryCount = filteredItems.filter(item => getExpiryState(item.expires_at) !== 'normal').length

  return (
    <div className="p-6 emoji-wallpaper min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sky-700 text-sm font-semibold">食材在庫管理アプリ</div>
            <h1 className="text-2xl font-semibold">在庫一覧</h1>
            <p className="text-sm text-sky-700 mt-1">{filteredItems.length}件の食材 / 期限注意 {nearExpiryCount}件</p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowHelpModal(true)} className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              ？
            </button>
            <button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-semibold">ログアウト</button>
          </div>
        </div>

        <div className="mb-4 flex gap-2 items-center">
          <input
            className="flex-1 border p-2 rounded bg-white"
            placeholder="食材名・保管場所・メモで検索"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="border p-2 rounded bg-white"
          >
            <option value="expiry_soonest">期限が近い順</option>
            <option value="expiry_latest">期限が遠い順</option>
            <option value="purchased_newest">購入日が新しい順</option>
            <option value="name_asc">名前順</option>
            <option value="location_asc">保管場所順</option>
          </select>
        </div>

        <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-4 bg-white p-4 rounded shadow">
          {(errorMessage || successMessage) && (
            <div className={`mb-3 rounded p-2 text-sm ${errorMessage ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {errorMessage || successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="md:col-span-2 flex gap-2">
              <div className="flex items-center">
                <span className="mr-2">絵文字</span>
                <select value={emoji} onChange={e=>setEmoji(e.target.value)} className="border p-2 rounded bg-white">
                  {(() => {
                    const suggested = pickEmoji(name)
                    const options = [suggested, '🍽️','🥗','🥩','🍅','🍞','🐟','🥚','🥛','🧂','🧀','🥬','🧅']
                    return options.map((o, i) => <option key={i} value={o}>{o}</option>)
                  })()}
                </select>
              </div>
              <input className="flex-1 border p-2 rounded" placeholder="食材名" value={name} onChange={e=>setName(e.target.value)} />
            </div>

            <input className="border p-2 rounded" placeholder="数量" value={quantity} onChange={e=>setQuantity(e.target.value)} />
            <div className="flex items-center gap-2">
              <input 
                type="text"
                list="unitList"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="単位を入力または選択"
                className="border p-2 rounded bg-white flex-1"
              />
              <datalist id="unitList">
                {unitOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </datalist>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                list="locationList"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="保管場所を入力または選択"
                className="border p-2 rounded bg-white flex-1"
              />
              <datalist id="locationList">
                {locationOptions.map(opt => (
                  <option key={opt.label} value={opt.label}>{opt.emoji} {opt.label}</option>
                ))}
              </datalist>
            </div>
            <div className="md:col-span-3">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 font-semibold">購入日</label>
                  <input type="date" className="w-full border p-2 rounded" value={purchasedAt} onChange={e=>setPurchasedAt(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 font-semibold">賞味期限</label>
                  <input type="date" className="w-full border p-2 rounded" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-red-600 mt-1">※賞味期限が未入力の場合、3日後の日付が登録されます</p>
            </div>
            <input className="md:col-span-3 border p-2 rounded" placeholder="メモ" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={submitting} className="bg-sky-600 text-white px-4 py-2 rounded disabled:opacity-60">
              {submitting ? (editingId ? '更新中...' : '追加中...') : (editingId ? '更新' : '追加')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded">
                キャンセル
              </button>
            )}
          </div>
        </form>

        {loading && <div>読み込み中...</div>}
        {!loading && (
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-600 bg-white p-4 rounded shadow">該当する食材はありません。</div>
            ) : (
              filteredItems.map(item => {
                const expiry = getExpiryState(item.expires_at)
               const expiryBadge = expiry === 'danger' ? { icon: '❗', label: '期限切れ間近', className: 'bg-red-100 text-red-700' } : expiry === 'warning' ? { icon: '⏰', label: '期限注意', className: 'bg-yellow-100 text-yellow-700' } : null

               return (
                 <div key={item.id} className={`p-3 sm:p-4 rounded-xl shadow-sm transition-shadow hover:shadow-md border-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${expiry === 'danger' ? 'bg-red-100 border-red-400' : expiry === 'warning' ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-slate-200'}`}>
                   <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-3 min-w-0">
                       <span className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-xl flex-shrink-0">{item.emoji || '🍽️'}</span>
                       <div className="min-w-0 flex-1">
                         <div className="text-base sm:text-lg font-semibold break-words leading-tight">{item.name}</div>
                       </div>
                       {expiryBadge && (
                         <span title={expiryBadge.label} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-base flex-shrink-0 ${expiryBadge.className}`}>
                           {expiryBadge.icon}
                         </span>
                       )}
                     </div>

                     <div className="mt-1 text-sm text-gray-600 break-words">
                       {item.quantity || ''}{item.unit ? item.unit : ''} - {(() => {
                         const locOpt = locationOptions.find(o => o.label === item.location)
                         return locOpt ? `${locOpt.emoji} ${item.location}` : item.location || '未設定'
                       })()}
                      </div>
                     {item.notes && <div className="text-xs text-gray-500 mt-1 break-words">{item.notes}</div>}
                   </div>

                   <div className="flex items-center justify-between gap-2 sm:justify-end sm:flex-shrink-0 sm:min-w-[200px]">
                     <div className={`text-sm font-medium py-1 px-3 rounded-full ${expiry === 'danger' ? 'bg-red-50 text-red-700' : expiry === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>
                       <div className="whitespace-nowrap text-sm">{item.expires_at ? new Date(`${item.expires_at}T00:00:00`).toLocaleDateString() : '期限なし'}</div>
                     </div>
                     <div className="flex gap-2">
                       <button type="button" onClick={() => startEdit(item)} className="border border-sky-200 text-sky-700 px-3 py-1 rounded text-sm hover:bg-sky-50">編集</button>
                       <button type="button" onClick={() => handleDelete(item.id)} className="border border-red-200 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-50">削除</button>
                     </div>
                   </div>
                 </div>
               )
              })
            )}
          </div>
        )}
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

function compareDateAsc(a, b){
  if(!a && !b) return 0
  if(!a) return 1
  if(!b) return -1
  return new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)
}

function compareDateDesc(a, b){
  return compareDateAsc(b, a)
}

function getExpiryState(dateStr){
  if(!dateStr) return 'normal'
  const d = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  const diff = (d - now) / (1000*60*60*24)
  if(diff <= 1) return 'danger'
  if(diff <= 3) return 'warning'
  return 'normal'
}

function computeSuggestedExpiryDate(name, expiresAt, purchasedAt){
  if(expiresAt) return expiresAt

  const baseDate = purchasedAt ? new Date(`${purchasedAt}T00:00:00`) : new Date()
  
  // 常に3日後を返す
  const next = new Date(baseDate)
  next.setDate(next.getDate() + 3)
  return next.toISOString().slice(0, 10)
}
