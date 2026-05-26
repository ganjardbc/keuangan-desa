import axios from 'axios'
import { useAuthStore } from '../modules/auth/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030',
})

let routerInstance: any = null

export function registerRouter(router: any) {
  routerInstance = router
}

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle 401/403 globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const authStore = useAuthStore()

    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        authStore.logout()
        if (routerInstance) {
          routerInstance.push('/login')
        } else {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        if (routerInstance) {
          routerInstance.push('/unauthorized')
        } else {
          window.location.href = '/unauthorized'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
