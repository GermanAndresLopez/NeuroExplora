let audioCtx = null

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq, dur, type = 'square', vol = 0.06, delayMs = 0) {
  try {
    const ac   = ctx()
    const t0   = ac.currentTime + delayMs / 1000
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(vol, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.01)
  } catch {}
}

export function playClick()   { tone(520, 0.06, 'square',   0.06) }
export function playBack()    { tone(320, 0.06, 'square',   0.05) }
export function playSelect()  { tone(660, 0.07, 'sine',     0.07) }
export function playMatch()   { tone(780, 0.08, 'sine',     0.07); tone(980, 0.08, 'sine', 0.05, 90) }
export function playMiss()    { tone(220, 0.12, 'sawtooth', 0.05) }
export function playSuccess() {
  [520, 660, 780, 1040].forEach((f, i) => tone(f, 0.1, 'sine', 0.05, i * 80))
}
