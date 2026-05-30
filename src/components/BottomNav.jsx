export default function BottomNav({ currentView, onChange }) {
  const tabs = [
    { id: 'ar', label: 'AR', icon: BrainIcon },
    { id: 'games', label: 'Juegos', icon: GameIcon },
    { id: 'about', label: 'Acerca', icon: InfoIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/80">
      <div className="flex h-full">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200
                ${active ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function BrainIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9.5 2C8 2 6.5 2.9 5.8 4.3C5.1 3.5 4.1 3 3 3C1.3 3 0 4.3 0 6C0 6.7 0.3 7.4 0.7 7.9C0.3 8.4 0 9.2 0 10C0 11.6 1.1 12.9 2.5 13.3C2.5 13.5 2.5 13.8 2.5 14C2.5 16.2 4.3 18 6.5 18H8"/>
      <path d="M14.5 2C16 2 17.5 2.9 18.2 4.3C18.9 3.5 19.9 3 21 3C22.7 3 24 4.3 24 6C24 6.7 23.7 7.4 23.3 7.9C23.7 8.4 24 9.2 24 10C24 11.6 22.9 12.9 21.5 13.3C21.5 13.5 21.5 13.8 21.5 14C21.5 16.2 19.7 18 17.5 18H16"/>
      <path d="M8 18V22M16 18V22M8 22H16"/>
      <path d="M12 2V18"/>
      <path d="M8 6C8 4.9 8.9 4 10 4"/>
      <path d="M16 6C16 4.9 15.1 4 14 4"/>
      <path d="M7 11C7 9.9 7.9 9 9 9"/>
      <path d="M17 11C17 9.9 16.1 9 15 9"/>
    </svg>
  )
}

function GameIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4M8 10v4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
      <circle cx="18" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}

function InfoIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="11.5" x2="12" y2="16" strokeLinecap="round" />
    </svg>
  )
}
