// Supabase Edge Function: assign-emoji
// - payload: { id: string, name: string }
// - uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
// - updates items table's emoji column based on simple keyword mapping

import { serve } from 'std/server'
import { createClient } from 'npm:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL as string, SERVICE_KEY as string)

function pickEmoji(name: string){
  if(!name) return '🍽️'
  const lname = name.toLowerCase()
  const map = [
    { keywords: ['鶏','チキン','とり'], emoji: '🍗' },
    { keywords: ['豚','ポーク'], emoji: '🥩' },
    { keywords: ['牛','ビーフ'], emoji: '🥩' },
    { keywords: ['卵','たまご'], emoji: '🥚' },
    { keywords: ['牛乳','ミルク'], emoji: '🥛' },
    { keywords: ['魚','さかな','サーモン'], emoji: '🐟' },
    { keywords: ['玉ねぎ','たまねぎ','ネギ'], emoji: '🧅' },
    { keywords: ['にんじん','人参'], emoji: '🥕' },
    { keywords: ['キャベツ'], emoji: '🥬' },
    { keywords: ['トマト'], emoji: '🍅' },
    { keywords: ['レタス'], emoji: '🥬' },
    { keywords: ['パン'], emoji: '🍞' },
    { keywords: ['米','ごはん'], emoji: '🍚' },
    { keywords: ['豆腐'], emoji: '🍱' },
  ]
  for(const entry of map){
    for(const kw of entry.keywords){
      if(lname.includes(kw)) return entry.emoji
    }
  }
  return '🍽️'
}

serve(async (req: Request) => {
  try{
    const json = await req.json()
    const { id, name } = json
    if(!id || !name) return new Response(JSON.stringify({ error: 'id and name required' }), { status: 400 })

    const emoji = pickEmoji(name)
    const { error } = await supabase.from('items').update({ emoji }).eq('id', id)
    if(error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ emoji }), { status: 200 })
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
