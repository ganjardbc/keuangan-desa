import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../../../lib/axios'

export interface ProyekKegiatan {
  id: string
  name: string
  budgetLimit: number
  status: 'PERENCANAAN' | 'BERJALAN' | 'SELESAI'
  startDate?: string
  endDate?: string
  spent: number
  remaining: number
  transactions?: any[]
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProyekKegiatan[]>([])
  const currentProject = ref<ProyekKegiatan | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/proyek-kegiatan')
      projects.value = response.data
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal memuat proyek kegiatan.'
    } finally {
      loading.value = false
    }
  }

  async function fetchProjectById(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/proyek-kegiatan/${id}`)
      currentProject.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat detail proyek.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createProject(data: {
    name: string
    budgetLimit: number
    startDate?: string
    endDate?: string
  }) {
    loading.value = true
    try {
      await api.post('/proyek-kegiatan', data)
      await fetchProjects()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal membuat proyek kegiatan.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProject(
    id: string,
    data: {
      name?: string
      budgetLimit?: number
      status?: string
      startDate?: string
      endDate?: string
    },
  ) {
    loading.value = true
    try {
      await api.put(`/proyek-kegiatan/${id}`, data)
      await fetchProjects()
      if (currentProject.value && currentProject.value.id === id) {
        await fetchProjectById(id)
      }
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal memperbarui proyek kegiatan.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(id: string) {
    loading.value = true
    try {
      await api.delete(`/proyek-kegiatan/${id}`)
      await fetchProjects()
      return true
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Gagal menghapus proyek kegiatan.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
  }
})
