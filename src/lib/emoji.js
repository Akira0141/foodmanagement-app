// 簡易的な食材名 -> 絵文字マッピング
// 名前にマッチするキーワードが見つかれば絵文字を返す

const map = [
  { keywords: ['鶏', 'チキン', 'とり'], emoji: '🍗' },
  { keywords: ['豚', 'ポーク'], emoji: '🥩' },
  { keywords: ['牛', 'ビーフ'], emoji: '🥩' },
  { keywords: ['卵', 'たまご'], emoji: '🥚' },
  { keywords: ['牛乳', 'ミルク'], emoji: '🥛' },
  { keywords: ['魚', 'さかな', 'サーモン'], emoji: '🐟' },
  { keywords: ['玉ねぎ', 'たまねぎ', 'ネギ'], emoji: '🧅' },
  { keywords: ['にんじん', '人参'], emoji: '🥕' },
  { keywords: ['キャベツ'], emoji: '🥬' },
  { keywords: ['じゃがいも', 'ジャガイモ', 'potato'], emoji: '🥔' },
  { keywords: ['きゅうり', 'キュウリ', 'cucumber'], emoji: '🥒' },
  { keywords: ['ブロッコリー', 'broccoli'], emoji: '🥦' },
  { keywords: ['トマト'], emoji: '🍅' },
  { keywords: ['レタス'], emoji: '🥬' },
  { keywords: ['牛乳','ヨーグルト'], emoji: '🥛' },
  { keywords: ['パン'], emoji: '🍞' },
  { keywords: ['米', 'ごはん'], emoji: '🍚' },
  { keywords: ['豆腐'], emoji: '🍱' },
  { keywords: ['うどん', 'udon', 'そうめん', 'そば', 'soba', '蕎麦', '素麺', 'ラーメン', 'らーめん', 'ramen', '麺'], emoji: '🍜' },
  { keywords: ['えのき','えりんぎ','エリンギ','しめじ','まいたけ'], emoji: '🍄' },
  { keywords: ['じゃがいも','ジャガイモ','potato'], emoji: '🥔' },
  { keywords: ['きゅうり','キュウリ','cucumber'], emoji: '🥒' },
  { keywords: ['ブロッコリー','broccoli'], emoji: '🥦' },
    ]

export function pickEmoji(name){
  if(!name) return '🍽️'
  const lname = name.toLowerCase()
  for(const entry of map){
    for(const kw of entry.keywords){
      if(lname.includes(kw)) return entry.emoji
    }
  }
  return '🍽️'
}
