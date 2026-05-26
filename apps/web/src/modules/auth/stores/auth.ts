import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../../../lib/axios'

export interface User {
  id: string
  email: string
  name: string
  role: string
  permissions?: string[]
  tenant?: {
    id: string
    name: string
    code?: string
    address?: string
    waReceiptTemplate?: string
    pdfHeaderTemplate?: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')!)
      : null,
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || 'WARGA')
  const isBendahara = computed(() => userRole.value === 'BENDAHARA')

  const userPermissions = computed(() => user.value?.permissions || [])

  const hasPermission = (permission: string) => {
    if (userRole.value === 'SUPER_ADMIN') {
      return true
    }
    return userPermissions.value.includes(permission)
  }

  async function login(email: string, pass: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/login', { email, pass })
      token.value = response.data.access_token
      user.value = response.data.user

      localStorage.setItem('token', token.value!)
      localStorage.setItem('user', JSON.stringify(user.value!))
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Login gagal, periksa kredensial Anda.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(payload: {
    email: string
    pass: string
    name: string
    isNewTenant: boolean
    tenantCode?: string
    newTenantName?: string
    newTenantAddress?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/register', payload)
      token.value = response.data.access_token
      user.value = response.data.user

      localStorage.setItem('token', token.value!)
      localStorage.setItem('user', JSON.stringify(user.value!))
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message ||
        'Registrasi gagal, mohon periksa kembali input Anda.'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    isBendahara,
    userPermissions,
    hasPermission,
    login,
    register,
    logout,
  }
})
