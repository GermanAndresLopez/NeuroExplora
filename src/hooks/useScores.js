const KEY = 'ne_scores'

export function getScores() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveScore({ game, score, user }) {
  const scores = getScores()
  scores.push({ game, score, user: user || 'Anónimo', date: new Date().toISOString() })
  scores.sort((a, b) => b.score - a.score)
  localStorage.setItem(KEY, JSON.stringify(scores.slice(0, 100)))
}
