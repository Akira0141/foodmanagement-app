import { createClient } from '@supabase/supabase-js'

// 環境変数から Supabase の URL とキーを読み込む
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
