import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../../../lib/axios'

export interface JenisIuran {
  id: string
  name: string
  defaultAmount: number
  period: string
}

export const useJenisIuranStore = defineStore('jenis-iuran', () => {
  const jenisIuranList = ref<JenisIuran[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchJenisIuran() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/jenis-iuran')
      jenisIuranList.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat jenis iuran.'
    } finally {
      loading.value = false
    }
  }

  async function addJenisIuran(data: Omit<JenisIuran, 'id'>) {
    loading.value = true
    try {
      await api.post('/jenis-iuran', data)
      await fetchJenisIuran()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal membuat jenis iuran.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateJenisIuran(id: string, data: Partial<JenisIuran>) {
    loading.value = true
    try {
      await api.put(`/jenis-iuran/${id}`, data)
      await fetchJenisIuran()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal memperbarui jenis iuran.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteJenisIuran(id: string) {
    loading.value = true
    try {
      await api.delete(`/jenis-iuran/${id}`)
      await fetchJenisIuran()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal menghapus jenis iuran.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    jenisIuranList,
    loading,
    error,
    fetchJenisIuran,
    addJenisIuran,
    updateJenisIuran,
    deleteJenisIuran,
  }
})
