import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../../../lib/axios'

export interface KasAccount {
  id: string
  name: string
  accountNumber?: string
  balance: number
}

export interface Transaction {
  id: string
  type: 'pemasukan' | 'pengeluaran'
  title: string
  amount: number
  category: string
  date: string
  reference?: string
  kasAccountId?: string
  kasAccount?: KasAccount
  proyekKegiatanId?: string
}

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref<Transaction[]>([])
  const kasAccounts = ref<KasAccount[]>([])
  const stats = ref({ totalPemasukan: 0, totalPengeluaran: 0, totalSaldo: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalPemasukan = computed(() => stats.value.totalPemasukan)
  const totalPengeluaran = computed(() => stats.value.totalPengeluaran)
  const totalSaldo = computed(() => stats.value.totalSaldo)

  async function fetchTransactions() {
    loading.value = true
    try {
      const response = await api.get('/transactions')
      transactions.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat transaksi.'
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get('/transactions/stats')
      stats.value = response.data
    } catch (err: any) {
      console.error('Gagal memuat statistik keuangan:', err)
    }
  }

  async function fetchKasAccounts() {
    loading.value = true
    try {
      const response = await api.get('/kas-accounts')
      kasAccounts.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat akun kas.'
    } finally {
      loading.value = false
    }
  }

  async function createKasAccount(account: {
    name: string
    accountNumber?: string
    balance?: number
  }) {
    loading.value = true
    try {
      await api.post('/kas-accounts', account)
      await fetchKasAccounts()
      await fetchStats()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal membuat akun kas.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateKasAccount(
    id: string,
    account: { name: string; accountNumber?: string; balance?: number },
  ) {
    loading.value = true
    try {
      await api.put(`/kas-accounts/${id}`, account)
      await fetchKasAccounts()
      await fetchStats()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal mengupdate akun kas.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteKasAccount(id: string) {
    loading.value = true
    try {
      await api.delete(`/kas-accounts/${id}`)
      await fetchKasAccounts()
      await fetchStats()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menghapus akun kas.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function addTransaction(tx: Omit<Transaction, 'id' | 'date'>) {
    loading.value = true
    try {
      await api.post('/transactions', tx)
      await fetchTransactions()
      await fetchStats()
      await fetchKasAccounts()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menyimpan transaksi.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateTransaction(
    id: string,
    tx: Omit<Transaction, 'id' | 'date'>,
  ) {
    loading.value = true
    try {
      await api.put(`/transactions/${id}`, tx)
      await fetchTransactions()
      await fetchStats()
      await fetchKasAccounts()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal memperbarui transaksi.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteTransaction(id: string) {
    loading.value = true
    try {
      await api.delete(`/transactions/${id}`)
      await fetchTransactions()
      await fetchStats()
      await fetchKasAccounts()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal menghapus transaksi.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    transactions,
    kasAccounts,
    totalPemasukan,
    totalPengeluaran,
    totalSaldo,
    loading,
    error,
    fetchTransactions,
    fetchStats,
    fetchKasAccounts,
    createKasAccount,
    updateKasAccount,
    deleteKasAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  }
})
