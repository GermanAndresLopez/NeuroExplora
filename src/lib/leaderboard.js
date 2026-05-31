// Firebase Realtime Database via REST — no SDK needed.
// Set VITE_FIREBASE_DB_URL in Vercel env vars, e.g.:
//   https://your-project-default-rtdb.firebaseio.com
// Rules should allow read/write (or at least unauthenticated reads):
//   { "rules": { ".read": true, ".write": true } }

const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL
  ?? 'https://neuroexplora-191ac-default-rtdb.firebaseio.com'
const LS_KEY = 'ne_leaderboard_v2'

export async function submitScore({ name, score, total, date = Date.now() }) {
  const entry = { name: name.trim().toUpperCase().slice(0, 20), score, total, date }

  if (DB_URL) {
    try {
      await fetch(`${DB_URL}/leaderboard.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch {}
  }

  // Always persist locally as backup
  const local = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  local.push(entry)
  localStorage.setItem(LS_KEY, JSON.stringify(local))
}

export async function getLeaderboard() {
  if (DB_URL) {
    try {
      const res  = await fetch(`${DB_URL}/leaderboard.json`)
      const data = await res.json()
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.values(data)
          .sort((a, b) => b.score - a.score || a.date - b.date)
          .slice(0, 20)
      }
    } catch {}
  }

  const local = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  return local
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, 20)
}
