let audioCtx = null
let ambientNodes = null

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function startAmbient() {
  if (ambientNodes) return
  try {
    const ac = ctx()
    const master = ac.createGain()
    master.gain.setValueAtTime(0, ac.currentTime)
    master.gain.linearRampToValueAtTime(0.032, ac.currentTime + 5)
    master.connect(ac.destination)

    // Pad chord: A minor drone with slight detuning for richness
    const layers = [
      { freq: 110.0, detune:  0  },
      { freq: 110.3, detune:  3  },
      { freq: 165.0, detune: -2  },
      { freq: 220.0, detune:  1  },
      { freq: 130.8, detune:  0  },
    ]
    const oscs = layers.map(({ freq, detune }) => {
      const osc = ac.createOscillator()
      const g   = ac.createGain()
      osc.type          = 'sine'
      osc.frequency.value = freq
      osc.detune.value  = detune
      g.gain.value      = 1 / layers.length
      osc.connect(g)
      g.connect(master)
      osc.start()
      return osc
    })

    // Slow breathing LFO (~12s cycle)
    const lfo     = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value  = 0.008
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)
    lfo.start()

    ambientNodes = { oscs, lfo, master }
  } catch {}
}

export function stopAmbient() {
  if (!ambientNodes) return
  try {
    const ac = ctx()
    const { oscs, lfo, master } = ambientNodes
    ambientNodes = null
    master.gain.linearRampToValueAtTime(0, ac.currentTime + 2)
    setTimeout(() => {
      oscs.forEach(o => { try { o.stop() } catch {} })
      try { lfo.stop() } catch {}
    }, 2500)
  } catch {}
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
