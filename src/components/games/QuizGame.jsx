import { useState } from 'react'

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
  const [phase, setPhase] = useState('idle') // 'idle' | 'question' | 'feedback' | 'results'
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([]) // array of booleans

  function startGame() {
    setPhase('question')
    setQuestionIndex(0)
    setSelected(null)
    setAnswers([])
  }

  function handleAnswer(optionIndex) {
    if (phase !== 'question') return
    const correct = optionIndex === QUESTIONS[questionIndex].correct
    setSelected(optionIndex)
    setAnswers(prev => [...prev, correct])
    setPhase('feedback')
  }

  function nextQuestion() {
    if (questionIndex + 1 >= QUESTIONS.length) {
      setPhase('results')
      const finalAnswers = [...answers, correct]
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
      <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Cerebral</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            6 preguntas sobre las funciones de las regiones del cerebro. Pon a prueba lo que aprendiste.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {[
            { icon: '❓', label: '6 preguntas', sub: '1 por región' },
            { icon: '4️⃣', label: '4 opciones', sub: 'respuesta única' },
          ].map(item => (
            <div key={item.label} className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-semibold">{item.label}</div>
              <div className="text-gray-500 text-xs">{item.sub}</div>
            </div>
          ))}
        </div>
        <button
          onClick={startGame}
          className="w-full max-w-xs py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/30"
        >
          Comenzar Quiz
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const pct = Math.round((correctCount / QUESTIONS.length) * 100)
    const stars = correctCount >= 6 ? 3 : correctCount >= 4 ? 2 : 1
    const message =
      correctCount === 6 ? '¡Perfecto! Eres un experto en neurociencia.' :
      correctCount >= 4 ? '¡Muy bien! Tienes buen conocimiento del cerebro.' :
      '¡Sigue explorando! Usa la vista AR para aprender más.'

    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-5">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`text-3xl ${i < stars ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Resultado Final</h2>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700 col-span-2">
            <div className="text-4xl font-bold text-cyan-400 mb-1">{correctCount}/{QUESTIONS.length}</div>
            <div className="text-gray-500 text-sm">respuestas correctas ({pct}%)</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={startGame}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[questionIndex]

  return (
    <div className="flex flex-col h-full px-4 py-3">
      {/* Progress */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Pregunta {questionIndex + 1} de {QUESTIONS.length}</span>
          <span className="text-cyan-400">{answers.filter(Boolean).length} correctas</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${((questionIndex) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4 shrink-0">
        <p className="text-white font-medium text-sm leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5 flex-1">
        {q.options.map((option, i) => {
          let style = 'bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:bg-gray-750'
          if (phase === 'feedback' && selected !== null) {
            if (i === q.correct) {
              style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
            } else if (i === selected && i !== q.correct) {
              style = 'bg-red-500/20 border-red-500 text-red-300'
            } else {
              style = 'bg-gray-800/50 border-gray-700/50 text-gray-500'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={phase === 'feedback'}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${style}`}
            >
              <span className="text-xs font-bold mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {phase === 'feedback' && (
        <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed shrink-0
          ${answers[answers.length - 1]
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span className="font-semibold mr-1">
            {answers[answers.length - 1] ? '¡Correcto!' : 'Incorrecto.'}
          </span>
          {q.explanation}
        </div>
      )}

      {phase === 'feedback' && (
        <button
          onClick={nextQuestion}
          className="mt-3 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors shrink-0"
        >
          {questionIndex + 1 >= QUESTIONS.length ? 'Ver resultados' : 'Siguiente pregunta'}
        </button>
      )}
    </div>
  )
}
