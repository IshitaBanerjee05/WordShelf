import axios from 'axios'

// ── Base instance ─────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — attach token ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ws-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — handle errors globally ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('ws-token')
      localStorage.removeItem('ws-user')
      window.location.href = '/login'
    }

    if (status === 403) {
      console.error('Access forbidden')
    }

    if (status >= 500) {
      console.error('Server error — please try again')
    }

    return Promise.reject(error)
  }
)

export default api

// ── Typed service helpers (import these in components) ────────
export const authService = {
  register:      (data)  => api.post('/auth/register', data),
  login:         (data)  => api.post('/auth/login', data),
  forgotPassword:(email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data)  => api.post('/auth/reset-password', data),
  getProfile:    ()      => api.get('/user/profile'),
  updateProfile: (data)  => api.put('/user/profile', data),
}

export const bookshelfService = {
  getAll:       ()       => api.get('/bookshelf'),
  getOne:       (id)     => api.get(`/bookshelf/${id}`),
  create:       (data)   => api.post('/bookshelf', data),
  update:       (id, data) => api.put(`/bookshelf/${id}`, data),
  remove:       (id)     => api.delete(`/bookshelf/${id}`),
  updateStatus: (id, status) => api.patch(`/bookshelf/${id}/status`, { status }),
  getWords:     (id)     => api.get(`/bookshelf/${id}/words`),
}

export const vocabularyService = {
  getAll:     (params)  => api.get('/vocabulary', { params }),
  getOne:     (id)      => api.get(`/vocabulary/${id}`),
  create:     (data)    => api.post('/vocabulary', data),
  update:     (id, data)=> api.put(`/vocabulary/${id}`, data),
  remove:     (id)      => api.delete(`/vocabulary/${id}`),
  extract:    (text)    => api.post('/vocabulary/extract', { text }),
  lookup:     (word, lang) => api.get('/vocabulary/lookup', { params: { word, lang } }),
  translate:  (word, target) => api.get('/vocabulary/translate', { params: { word, target } }),
}

export const revisionService = {
  generate:   (wordIds) => api.post('/revision/generate', { wordIds }),
  getDue:     ()        => api.get('/revision/due'),
  submit:     (data)    => api.post('/revision/submit', data),
  evaluate:   (data)    => api.post('/ai/evaluate', data),
}

export const analyticsService = {
  getGrowth:   () => api.get('/analytics/growth'),
  getAccuracy: () => api.get('/analytics/accuracy'),
  getRIS:      () => api.get('/analytics/ris'),
  getActivity: () => api.get('/analytics/activity'),
  exportPDF:   () => api.get('/profile/export', { responseType: 'blob' }),
}
