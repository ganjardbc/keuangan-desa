import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../../../lib/axios'

export interface AuditLogEntry {
  id: string
  action: string
  details: string
  ipAddress: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export interface AuditLogPaginatedResult {
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const useAuditStore = defineStore('audit', () => {
  const logs = ref<AuditLogEntry[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const loading = ref(false)
  const actionTypes = ref<string[]>([])

  async function fetchAuditLogs(
    params: {
      page?: number
      limit?: number
      action?: string
      userId?: string
    } = {},
  ) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit))
      if (params.action) query.set('action', params.action)
      if (params.userId) query.set('userId', params.userId)

      const res = await api.get<AuditLogPaginatedResult>(
        `/audit-log?${query.toString()}`,
      )
      logs.value = res.data.data
      total.value = res.data.total
      totalPages.value = res.data.totalPages
      currentPage.value = res.data.page
    } catch (err) {
      console.error('Gagal memuat log audit:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchActionTypes() {
    try {
      const res = await api.get<string[]>('/audit-log/action-types')
      actionTypes.value = res.data
    } catch (err) {
      console.error('Gagal memuat action types:', err)
    }
  }

  return {
    logs,
    total,
    totalPages,
    currentPage,
    loading,
    actionTypes,
    fetchAuditLogs,
    fetchActionTypes,
  }
})
