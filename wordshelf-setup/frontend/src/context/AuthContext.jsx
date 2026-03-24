import { createContext, useContext, useEffect, useReducer } from 'react'
import api from '../services/api'

// ── State shape ──────────────────────────────────────────────
const initialState = {
  user:          null,    // { id, name, email, avatar, languagePref, risScore }
  token:         null,
  isAuthenticated: false,
  isLoading:     true,    // true while checking stored token on mount
}

// ── Reducer ──────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_INIT_DONE':
      return { ...state, isLoading: false }

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user:            action.payload.user,
        token:           action.payload.token,
        isAuthenticated: true,
        isLoading:       false,
      }

    case 'LOGOUT':
      return { ...initialState, isLoading: false }

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }

    default:
      return state
  }
}

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('ws-token')
    const user  = localStorage.getItem('ws-user')

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        // Set token on axios instance
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: parsedUser, token },
        })
      } catch {
        localStorage.removeItem('ws-token')
        localStorage.removeItem('ws-user')
        dispatch({ type: 'AUTH_INIT_DONE' })
      }
    } else {
      dispatch({ type: 'AUTH_INIT_DONE' })
    }
  }, [])

  // ── Actions ──────────────────────────────────────────────
  const login = async (email, password) => {
    // Will call POST /api/auth/login once backend is ready
    // For now, mock response
    const { data } = await api.post('/auth/login', { email, password })
    const { user, token } = data

    localStorage.setItem('ws-token', token)
    localStorage.setItem('ws-user', JSON.stringify(user))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    return user
  }

  const register = async (name, email, password, languagePref = 'en') => {
    const { data } = await api.post('/auth/register', {
      name, email, password, languagePref,
    })
    const { user, token } = data

    localStorage.setItem('ws-token', token)
    localStorage.setItem('ws-user', JSON.stringify(user))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    return user
  }

  const logout = () => {
    localStorage.removeItem('ws-token')
    localStorage.removeItem('ws-user')
    delete api.defaults.headers.common['Authorization']
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (updates) => {
    const updated = { ...state.user, ...updates }
    localStorage.setItem('ws-user', JSON.stringify(updated))
    dispatch({ type: 'UPDATE_USER', payload: updates })
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
