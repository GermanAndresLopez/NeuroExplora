export default function BottomNav({ currentView, onChange }) {
  const tabs = [
    { id: 'inicio',  label: 'INICIO',  icon: HomeIcon },
    { id: 'juegos',  label: 'JUEGOS',  icon: GameIcon },
    { id: 'config',  label: 'CONFIG',  icon: GearIcon },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-14"
      style={{
        background: 'rgba(5,5,8,0.97)',
        borderTop: '1px solid var(--accent-border)',
        boxShadow: '0 -4px 20px rgba(229,108,120,0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.6,
      }} />

      <div className="flex h-full">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: active ? 'var(--accent)' : 'var(--text-dim)',
                transition: 'color 0.2s',
              }}
            >
              {/* Active indicator — angular diamond */}
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '2px',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent-glow)',
                }} />
              )}

              <Icon
                active={active}
                style={{
                  width: '18px',
                  height: '18px',
                  filter: active ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none',
                  transition: 'filter 0.2s, transform 0.2s',
                  transform: active ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span style={{
                fontSize: '0.35rem',
                letterSpacing: '0.15em',
                fontFamily: "'Press Start 2P', monospace",
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ style }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9.5 2C8 2 6.5 2.9 5.8 4.3C5.1 3.5 4.1 3 3 3C1.3 3 0 4.3 0 6C0 6.7 0.3 7.4 0.7 7.9C0.3 8.4 0 9.2 0 10C0 11.6 1.1 12.9 2.5 13.3C2.5 13.5 2.5 13.8 2.5 14C2.5 16.2 4.3 18 6.5 18H8"/>
      <path d="M14.5 2C16 2 17.5 2.9 18.2 4.3C18.9 3.5 19.9 3 21 3C22.7 3 24 4.3 24 6C24 6.7 23.7 7.4 23.3 7.9C23.7 8.4 24 9.2 24 10C24 11.6 22.9 12.9 21.5 13.3C21.5 13.5 21.5 13.8 21.5 14C21.5 16.2 19.7 18 17.5 18H16"/>
      <path d="M8 18V22M16 18V22M8 22H16M12 2V18"/>
    </svg>
  )
}

function GameIcon({ style }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4M8 10v4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
      <circle cx="18" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}

function GearIcon({ style }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
