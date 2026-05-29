<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectStore, type ProyekKegiatan } from '../stores/project'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'

// Import new Dialog components
import ProjectDialog from '../components/ProjectDialog.vue'
import ProjectDetailsDialog from '../components/ProjectDetailsDialog.vue'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog.vue'

const projectStore = useProjectStore()
const authStore = useAuthStore()

// State Dialogs
const isProjectDialogOpen = ref(false)
const isDetailsDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const selectedProject = ref<ProyekKegiatan | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteProjectId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

const statuses = ['PERENCANAAN', 'BERJALAN', 'SELESAI']

// Search filter
const searchQuery = ref('')

const projectFirst = ref(0)
const projectRows = ref(6)

const paginatedProjects = computed(() => {
  const start = projectFirst.value
  const end = projectFirst.value + projectRows.value
  return filteredProjects.value.slice(start, end)
})

watch(searchQuery, () => {
  projectFirst.value = 0
})

onMounted(() => {
  projectStore.fetchProjects()
})

const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectStore.projects
  const q = searchQuery.value.toLowerCase()
  return projectStore.projects.filter((p) => p.name.toLowerCase().includes(q))
})

const openAddDialog = () => {
  isEditing.value = false
  currentId.value = null
  selectedProject.value = null
  isProjectDialogOpen.value = true
}

const openEditDialog = (project: ProyekKegiatan) => {
  isEditing.value = true
  currentId.value = project.id
  selectedProject.value = project
  isProjectDialogOpen.value = true
}

const openDetailsDialog = async (project: ProyekKegiatan) => {
  await projectStore.fetchProjectById(project.id)
  isDetailsDialogOpen.value = true
}

const handleSave = async (payload: {
  name: string
  budgetLimit: number
  status?: 'PERENCANAAN' | 'BERJALAN' | 'SELESAI'
  startDate?: string
  endDate?: string
}) => {
  let success = false
  if (isEditing.value && currentId.value) {
    success = await projectStore.updateProject(currentId.value, payload)
  } else {
    success = await projectStore.createProject(payload)
  }

  if (success) {
    isProjectDialogOpen.value = false
  }
}

const triggerDelete = (id: string) => {
  deleteProjectId.value = id
  deleteError.value = null
  isConfirmDeleteOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteProjectId.value) return
  deleteError.value = null
  const success = await projectStore.deleteProject(deleteProjectId.value)
  if (success) {
    isConfirmDeleteOpen.value = false
    deleteProjectId.value = null
  } else {
    deleteError.value = projectStore.error || 'Gagal menghapus proyek.'
  }
}

// Helpers
const getPercentSpent = (project: ProyekKegiatan) => {
  if (project.budgetLimit <= 0) return 0
  return Math.min(100, Math.round((project.spent / project.budgetLimit) * 100))
}

const getProgressBarColor = (percent: number) => {
  if (percent < 70) return 'bg-emerald-500'
  if (percent < 90) return 'bg-amber-500'
  return 'bg-rose-500'
}

const getStatusSeverity = (statusVal: string) => {
  switch (statusVal) {
    case 'PERENCANAAN':
      return 'secondary'
    case 'BERJALAN':
      return 'info'
    case 'SELESAI':
      return 'success'
    default:
      return 'secondary'
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

const formatDate = (dateVal?: string) => {
  if (!dateVal) return '-'
  return new Date(dateVal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <TemplateList
    title="Anggaran Kegiatan & Proyek"
    description="Kelola rencana anggaran biaya (RAB) dan serapan dana aktual proyek desa"
  >
    <template #actions>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchQuery" placeholder="Cari proyek..." fluid />
      </IconField>
      <Button
        v-if="authStore.hasPermission('transaction:create')"
        label="Buat Proyek"
        icon="pi pi-plus"
        @click="openAddDialog"
      />
    </template>

    <!-- Project List Grid -->
    <div v-if="paginatedProjects.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="project in paginatedProjects" :key="project.id">
          <template #content>
            <!-- Status Tag & Action Row -->
            <div class="flex items-center justify-between">
              <Tag
                :value="project.status"
                :severity="getStatusSeverity(project.status)"
                class="text-[9px] font-bold"
              />

              <div class="flex gap-1.5" @click.stop>
                <Button
                  icon="pi pi-eye"
                  severity="secondary"
                  size="small"
                  @click="openDetailsDialog(project)"
                />
                <Button
                  v-if="authStore.hasPermission('transaction:create')"
                  icon="pi pi-pencil"
                  severity="secondary"
                  size="small"
                  @click="openEditDialog(project)"
                />
                <Button
                  v-if="authStore.hasPermission('transaction:create')"
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  @click.stop="triggerDelete(project.id)"
                />
              </div>
            </div>

            <!-- Project Title & Dates -->
            <h3
              class="text-base font-bold text-slate-900 mt-4 tracking-wide truncate"
            >
              {{ project.name }}
            </h3>
            <p
              class="text-[10px] text-slate-500 mt-1 font-semibold flex items-center gap-1"
            >
              <i class="pi pi-calendar text-[9px]"></i>
              {{ formatDate(project.startDate) }} s.d.
              {{ formatDate(project.endDate) }}
            </p>

            <!-- Budget Progress Visualization -->
            <div class="mt-6 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500">Anggaran Terpakai</span>
                <span class="font-bold text-slate-900"
                  >{{ getPercentSpent(project) }}%</span
                >
              </div>

              <!-- Custom Progress Bar -->
              <div
                class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200"
              >
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="getProgressBarColor(getPercentSpent(project))"
                  :style="{ width: getPercentSpent(project) + '%' }"
                ></div>
              </div>

              <!-- Budget Details -->
              <div class="flex items-center justify-between text-[11px] pt-1">
                <span class="text-slate-600 font-semibold">{{
                  formatCurrency(project.spent)
                }}</span>
                <span class="text-slate-500"
                  >Limit: {{ formatCurrency(project.budgetLimit) }}</span
                >
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Pagination -->
      <Paginator
        v-model:first="projectFirst"
        v-model:rows="projectRows"
        :total-records="filteredProjects.length"
        :rows-per-page-options="[3, 6, 9, 12]"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        class="mt-6 !bg-transparent !border-0"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500"
    >
      <i class="pi pi-chart-bar text-4xl mb-3 block text-slate-400"></i>
      Belum ada proyek kegiatan terdaftar.
    </div>
  </TemplateList>

  <!-- Project Dialog -->
  <ProjectDialog
    v-model:visible="isProjectDialogOpen"
    :is-editing="isEditing"
    :project="selectedProject"
    :statuses="statuses"
    @save="handleSave"
  />

  <!-- Project Details Dialog -->
  <ProjectDetailsDialog
    v-model:visible="isDetailsDialogOpen"
    :project="projectStore.currentProject"
  />

  <!-- Confirm Delete Dialog -->
  <ConfirmDeleteDialog
    v-model:visible="isConfirmDeleteOpen"
    title="Apakah Anda yakin?"
    description="Tindakan ini akan menghapus proyek kegiatan secara permanen. Proyek yang sudah memiliki transaksi terikat tidak dapat dihapus."
    :error-message="deleteError"
    @confirm="confirmDelete"
  />
</template>
