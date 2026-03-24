import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: '🏠', label: 'Dashboard'  },
  { to: '/bookshelf',  icon: '📚', label: 'Bookshelf'  },
  { to: '/vocabulary', icon: '🔤', label: 'Vocabulary' },
  { to: '/revision',   icon: '🃏', label: 'Revision'   },
  { to: '/analytics',  icon: '📊', label: 'Analytics'  },
  { to: '/profile',    icon: '👤', label: 'Profile'    },
]

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout }          = useAuth()
  const { isDark, toggleTheme }   = useTheme()
  const navigate                  = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          border-r border-[var(--border)] transition-all duration-300
          ${collapsed ? 'w-16' : 'w-56'}
        `}
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]
                         ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-400 to-lavender-400
                          flex items-center justify-center text-lg flex-shrink-0">
            📚
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base text-[var(--text)]">
              Word<span className="text-sage-400">Shelf</span>
            </span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto ws-scroll">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium
                transition-all duration-200 group
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-sage-pale text-sage-500 font-semibold'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                }
              `}
              title={collapsed ? label : undefined}
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom — user + collapse */}
        <div className="px-2 py-3 border-t border-[var(--border)] flex flex-col gap-1">
          {/* User avatar */}
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-terra-400 to-lavender-400
                              flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm
                        text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-all
                        ${collapsed ? 'justify-center' : ''}`}
            title="Toggle theme"
          >
            <span className="text-base">{isDark ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm
                        text-[var(--text-muted)] hover:bg-terra-pale hover:text-terra-500 transition-all
                        ${collapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs
                        text-[var(--text-light)] hover:bg-[var(--bg-subtle)] transition-all
                        ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-base">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <main
        className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between
                           px-6 py-3.5 border-b border-[var(--border)]"
                style={{ background: 'var(--bg)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search words, books…"
                className="ws-input pl-9 py-2 text-xs w-56"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* RIS Score chip */}
            {user?.risScore !== undefined && (
              <div className="badge badge-sage text-xs">
                🧠 RIS {user.risScore}
              </div>
            )}
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terra-400 to-lavender-400
                            flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                 onClick={() => navigate('/profile')}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
