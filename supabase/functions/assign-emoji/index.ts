// Supabase Edge Function: assign-emoji
// - payload: { id: string, name: string }
// - uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
// - optionally uses OPENAI_API_KEY to improve emoji selection

import { serve } from 'std/server'
import { createClient } from 'npm:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')

const supabase = createClient(SUPABASE_URL as string, SERVICE_KEY as string)

function pickEmojiLocal(name: string){
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
    { keywords: ['チーズ'], emoji: '🧀' },
    { keywords: ['うどん','udon','そうめん','そば','soba','蕎麦','素麺','ラーメン','らーめん','ramen','麺'], emoji: '🍜' },
    { keywords: ['砂糖','しお','塩'], emoji: '🧂' },
    { keywords: ['納豆'], emoji: '🍱' },
  ]
  for(const entry of map){
    for(const kw of entry.keywords){
      if(lname.includes(kw)) return entry.emoji
    }
  }
  // fallback: pick first CJK character to decide
  return '🍽️'
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

async function pickEmoji(name: string){
  // If OPENAI_API_KEY is provided, ask OpenAI for a single emoji suggestion.
  if(OPENAI_KEY){
    try{
      const prompt = `Return exactly one emoji (no other text) that best represents this food item name: "${name}". If unsure, return a generic plate emoji.`
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that replies with a single emoji representing a food item.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4,
          temperature: 0.0
        })
      })
      if(res.ok){
        const j = await res.json()
        const txt = j?.choices?.[0]?.message?.content?.trim()
        if(txt && txt.length <= 4) return txt
      }
    }catch(e){
      // ignore and fall back
      console.error('OpenAI call failed', e)
    }
  }
  return pickEmojiLocal(name)
}

serve(async (req: Request) => {
  // handle CORS preflight
  if(req.method === 'OPTIONS'){
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try{
    const json = await req.json()
    const { id, name } = json
    if(!id || !name) return new Response(JSON.stringify({ error: 'id and name required' }), { status: 400, headers: CORS_HEADERS })

    const emoji = await pickEmoji(name)
    const { error } = await supabase.from('items').update({ emoji }).eq('id', id)
    if(error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS_HEADERS })

    return new Response(JSON.stringify({ emoji }), { status: 200, headers: CORS_HEADERS })
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS })
  }
})
