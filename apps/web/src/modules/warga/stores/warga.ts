import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../../../lib/axios'

export interface Warga {
  id: string
  name: string
  houseNumber: string
  phoneNumber?: string
  status: string
  isActive: boolean
  iuranBulanan?: any[]
}

export const useWargaStore = defineStore('warga', () => {
  const wargaList = ref<Warga[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const rekapList = ref<any[]>([])

  async function fetchWarga() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/warga')
      wargaList.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat data warga.'
    } finally {
      loading.value = false
    }
  }

  async function fetchRekapIuran(year: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/warga/rekap-iuran/${year}`)
      rekapList.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat rekap iuran.'
    } finally {
      loading.value = false
    }
  }

  async function payIuran(
    wargaId: string,
    paymentData: {
      jenisIuranId: string
      month: number
      year: number
      amountPaid: number
      kasAccountId?: string
    },
  ) {
    loading.value = true
    try {
      await api.post(`/warga/${wargaId}/pembayaran`, paymentData)
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal merekam pembayaran iuran.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function payIuranBulk(
    wargaId: string,
    bulkData: {
      payments: {
        jenisIuranId: string
        month: number
        year: number
        amountPaid: number
      }[]
      kasAccountId?: string
    },
  ) {
    loading.value = true
    try {
      await api.post(`/warga/${wargaId}/pembayaran/bulk`, bulkData)
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal merekam pembayaran iuran massal.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function payIuranBulkAll(bulkAllData: {
    wargaIds: string[]
    jenisIuranId: string
    month: number
    year: number
    kasAccountId?: string
  }) {
    loading.value = true
    try {
      await api.post(`/warga/pembayaran/bulk-all`, bulkAllData)
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message ||
        'Gagal merekam pembayaran iuran massal warga.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function addWarga(warga: Omit<Warga, 'id' | 'isActive'>) {
    loading.value = true
    try {
      await api.post('/warga', warga)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menambahkan warga.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateWarga(id: string, warga: Partial<Warga>) {
    loading.value = true
    try {
      await api.put(`/warga/${id}`, warga)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal mengedit warga.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteWarga(id: string) {
    loading.value = true
    try {
      await api.delete(`/warga/${id}`)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menghapus warga.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function toggleWargaStatus(id: string) {
    try {
      await api.patch(`/warga/${id}/toggle`, {})
      await fetchWarga()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal mengubah status.'
    }
  }

  async function assignIuran(
    wargaId: string,
    mapping: { jenisIuranId: string; customAmount?: number | null },
  ) {
    try {
      await api.post(`/warga/${wargaId}/iuran`, mapping)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memetakan iuran.'
      return false
    }
  }

  async function unassignIuran(wargaId: string, jenisIuranId: string) {
    try {
      await api.delete(`/warga/${wargaId}/iuran/${jenisIuranId}`)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menghapus pemetaan.'
      return false
    }
  }

  async function assignIuranBulk(bulkMapping: {
    wargaIds: string[]
    jenisIuranId: string
    customAmount?: number | null
  }) {
    loading.value = true
    try {
      await api.post(`/warga/iuran/bulk`, bulkMapping)
      await fetchWarga()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal memetakan iuran massal.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    wargaList,
    rekapList,
    loading,
    error,
    fetchWarga,
    fetchRekapIuran,
    payIuran,
    payIuranBulk,
    payIuranBulkAll,
    addWarga,
    updateWarga,
    deleteWarga,
    toggleWargaStatus,
    assignIuran,
    unassignIuran,
    assignIuranBulk,
  }
})
