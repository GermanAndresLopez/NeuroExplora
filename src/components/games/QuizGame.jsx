import { useState } from 'react'
import { playClick, playSelect, playSuccess } from '../../hooks/useSound.js'

const QUESTIONS = [
  {
    question: '¿Qué lóbulo cerebral es el principal centro de procesamiento visual?',
    options: ['Lóbulo Frontal', 'Lóbulo Temporal', 'Lóbulo Parietal', 'Lóbulo Occipital'],
    correct: 3,
    explanation: 'El lóbulo occipital contiene la corteza visual primaria e interpreta formas, colores y movimiento.',
  },
  {
    question: '¿Qué estructura controla las funciones vitales automáticas como la respiración?',
    options: ['Cerebelo', 'Lóbulo Frontal', 'Tronco Encefálico', 'Lóbulo Temporal'],
    correct: 2,
    explanation: 'El tronco encefálico regula respiración, ritmo cardíaco y presión arterial de forma automática.',
  },
  {
    question: '¿Qué área cerebral es fundamental para la formación de nuevas memorias?',
    options: ['Lóbulo Occipital', 'Lóbulo Temporal', 'Cerebelo', 'Lóbulo Parietal'],
    correct: 1,
    explanation: 'El lóbulo temporal contiene el hipocampo, esencial para convertir experiencias en recuerdos duraderos.',
  },
  {
    question: '¿Qué función principal cumple el cerebelo?',
    options: ['Procesar el lenguaje', 'Controlar la visión', 'Coordinar movimientos y equilibrio', 'Tomar decisiones'],
    correct: 2,
    explanation: 'El cerebelo afina la coordinación motora, mantiene el equilibrio y posibilita el aprendizaje de habilidades.',
  },
  {
    question: '¿Qué lóbulo alberga la personalidad, la planificación y las decisiones complejas?',
    options: ['Lóbulo Parietal', 'Lóbulo Occipital', 'Lóbulo Temporal', 'Lóbulo Frontal'],
    correct: 3,
    explanation: 'La corteza prefrontal del lóbulo frontal es la sede de las funciones ejecutivas y la toma de decisiones.',
  },
  {
    question: '¿Qué lóbulo procesa las sensaciones de tacto, temperatura y orientación espacial?',
    options: ['Lóbulo Temporal', 'Lóbulo Occipital', 'Lóbulo Frontal', 'Lóbulo Parietal'],
    correct: 3,
    explanation: 'El lóbulo parietal integra señales sensoriales del cuerpo y orienta el organismo en el espacio.',
  },
]

export default function QuizGame({ onScore }) {
  const [phase, setPhase]               = useState('idle')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected]         = useState(null)
  const [answers, setAnswers]           = useState([])

  function startGame() {
    setPhase('question')
    setQuestionIndex(0)
    setSelected(null)
    setAnswers([])
  }

  function handleAnswer(optionIndex) {
    if (phase !== 'question') return
    const correct = optionIndex === QUESTIONS[questionIndex].correct
    correct ? playSelect() : playClick()
    setSelected(optionIndex)
    setAnswers(prev => [...prev, correct])
    setPhase('feedback')
  }

  function nextQuestion() {
    playClick()
    if (questionIndex + 1 >= QUESTIONS.length) {
      setPhase('results')
      const finalAnswers = [...answers]
      playSuccess()
      onScore?.('quiz', finalAnswers.filter(Boolean).length)
    } else {
      setQuestionIndex(i => i + 1)
      setSelected(null)
      setPhase('question')
    }
  }

  const correctCount = answers.filter(Boolean).length

  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '12px' }}>QUIZ</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 2, fontFamily: "'Courier New', monospace" }}>
            6 preguntas sobre las funciones del cerebro.<br />Pon a prueba lo que aprendiste.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '260px' }}>
          <InfoCard icon="?" label="6 PREGUNTAS" sub="1 POR REGIÓN" />
          <InfoCard icon="4" label="OPCIONES"    sub="ÚNICA RESP." />
        </div>
        <button
          onClick={startGame}
          className="pixel-btn"
          style={{
            width: '100%', maxWidth: '260px',
            padding: '14px', fontSize: '0.78rem',
            background: 'var(--accent)', color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '4px 4px 0 var(--accent-border)',
          }}
        >
          &gt; COMENZAR QUIZ
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const pct   = Math.round((correctCount / QUESTIONS.length) * 100)
    const stars = correctCount >= 6 ? 3 : correctCount >= 4 ? 2 : 1
    const msg   =
      correctCount === 6 ? 'PERFECTO — EXPERTO EN NEUROCIENCIA' :
      correctCount >= 4  ? 'MUY BIEN — BUEN CONOCIMIENTO' :
                           'SIGUE EXPLORANDO — APRENDE MÁS'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ opacity: i < stars ? 1 : 0.15 }}>★</span>
            ))}
          </div>
          <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '6px' }}>
            // RESULTADO FINAL
          </p>
          <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace", lineHeight: 1.8 }}>
            {msg}
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--accent-border)',
          padding: '16px 24px',
          textAlign: 'center',
          width: '100%', maxWidth: '260px',
        }}>
          <div style={{ fontSize: '2rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace" }}>
            {correctCount}/{QUESTIONS.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            CORRECTAS ({pct}%)
          </div>
        </div>

        <button
          onClick={startGame}
          className="pixel-btn"
          style={{
            width: '100%', maxWidth: '260px',
            padding: '12px', fontSize: '0.72rem',
            background: 'var(--accent)', color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '4px 4px 0 var(--accent-border)',
          }}
        >
          &gt; DE NUEVO
        </button>
      </div>
    )
  }

  const q = QUESTIONS[questionIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px' }}>
      {/* Progress */}
      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            PREGUNTA {questionIndex + 1} / {QUESTIONS.length}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
            {correctCount} CORRECTAS
          </span>
        </div>
        <div style={{ height: '2px', background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(questionIndex / QUESTIONS.length) * 100}%`,
            background: 'var(--accent)',
            transition: 'width 0.5s',
            boxShadow: '0 0 6px var(--accent-glow)',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        padding: '12px',
        marginBottom: '12px',
        flexShrink: 0,
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 0, left: 0,
          width: 8, height: 8,
          borderTop: '1px solid var(--accent)', borderLeft: '1px solid var(--accent)',
        }} />
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8,
          borderBottom: '1px solid var(--accent)', borderRight: '1px solid var(--accent)',
        }} />
        <p style={{ fontSize: '0.78rem', color: '#fff', lineHeight: 2, fontFamily: "'Courier New', monospace" }}>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {q.options.map((option, i) => {
          let bg = 'var(--surface)'
          let color = 'var(--text-dim)'
          let borderColor = 'rgba(229,108,120,0.15)'

          if (phase === 'feedback' && selected !== null) {
            if (i === q.correct) {
              bg = 'rgba(80,227,176,0.1)'; color = '#50e3b0'; borderColor = '#50e3b0'
            } else if (i === selected) {
              bg = 'rgba(255,85,85,0.1)'; color = '#ff5555'; borderColor = '#ff5555'
            } else {
              bg = 'var(--surface)'; color = 'var(--text-dim)'; borderColor = 'rgba(255,255,255,0.05)'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={phase === 'feedback'}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: bg,
                color,
                border: `1px solid ${borderColor}`,
                fontSize: '0.72rem',
                fontFamily: "'Courier New', monospace",
                lineHeight: 1.8,
                cursor: phase === 'feedback' ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: 'var(--accent)', marginRight: '8px', fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {phase === 'feedback' && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          border: `1px solid ${answers[answers.length - 1] ? '#50e3b0' : '#ff5555'}`,
          background: answers[answers.length - 1] ? 'rgba(80,227,176,0.08)' : 'rgba(255,85,85,0.08)',
          color: answers[answers.length - 1] ? '#50e3b0' : '#ff5555',
          fontSize: '0.7rem',
          fontFamily: "'Courier New', monospace",
          lineHeight: 2,
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', marginRight: '6px' }}>
            {answers[answers.length - 1] ? '> OK:' : '> ERR:'}
          </span>
          {q.explanation}
        </div>
      )}

      {phase === 'feedback' && (
        <button
          onClick={nextQuestion}
          className="pixel-btn"
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '11px',
            fontSize: '0.7rem',
            background: 'var(--accent)',
            color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '3px 3px 0 var(--accent-border)',
            flexShrink: 0,
          }}
        >
          {questionIndex + 1 >= QUESTIONS.length ? '> VER RESULTADOS' : '> SIGUIENTE'}
        </button>
      )}
    </div>
  )
}

function InfoCard({ icon, label, sub }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--accent-border)',
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.2rem', marginBottom: '6px', fontFamily: "'Courier New', monospace", color: 'var(--accent)' }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#fff', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginTop: '2px', fontFamily: "'Courier New', monospace" }}>{sub}</div>
    </div>
  )
}
