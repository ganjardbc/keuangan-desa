<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useProjectStore, type ProyekKegiatan } from '../stores/project'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DatePicker from 'primevue/datepicker'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const projectStore = useProjectStore()
const authStore = useAuthStore()

// State Dialogs
const isProjectDialogOpen = ref(false)
const isDetailsDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteProjectId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

// Project Form State
const name = ref('')
const budgetLimit = ref<number | null>(0)
const status = ref<'PERENCANAAN' | 'BERJALAN' | 'SELESAI'>('PERENCANAAN')
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)

const statuses = ['PERENCANAAN', 'BERJALAN', 'SELESAI']

// Search filter
const searchQuery = ref('')

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
  name.value = ''
  budgetLimit.value = 0
  status.value = 'PERENCANAAN'
  startDate.value = null
  endDate.value = null
  isProjectDialogOpen.value = true
}

const openEditDialog = (project: ProyekKegiatan) => {
  isEditing.value = true
  currentId.value = project.id
  name.value = project.name
  budgetLimit.value = project.budgetLimit
  status.value = project.status
  startDate.value = project.startDate ? new Date(project.startDate) : null
  endDate.value = project.endDate ? new Date(project.endDate) : null
  isProjectDialogOpen.value = true
}

const openDetailsDialog = async (project: ProyekKegiatan) => {
  await projectStore.fetchProjectById(project.id)
  isDetailsDialogOpen.value = true
}

const handleSave = async () => {
  if (!name.value || !budgetLimit.value) return

  const formatDateToISOString = (d: Date | null) => {
    if (!d) return undefined
    const offset = d.getTimezoneOffset()
    const localDate = new Date(d.getTime() - offset * 60 * 1000)
    return localDate.toISOString().split('T')[0]
  }

  const payload = {
    name: name.value,
    budgetLimit: budgetLimit.value,
    status: isEditing.value ? status.value : undefined,
    startDate: formatDateToISOString(startDate.value),
    endDate: formatDateToISOString(endDate.value),
  }

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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="project in filteredProjects"
        :key="project.id"
        @click="openDetailsDialog(project)"
      >
        <template #content>
          <!-- Status Tag & Action Row -->
          <div class="flex items-center justify-between">
            <Tag
              :value="project.status"
              :severity="getStatusSeverity(project.status)"
              class="text-[9px] font-bold"
            />

            <div
              v-if="authStore.hasPermission('transaction:create')"
              class="flex gap-1.5"
              @click.stop
            >
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                @click="openEditDialog(project)"
              />
              <Button
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

      <!-- Empty State -->
      <div
        v-if="filteredProjects.length === 0"
        class="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500"
      >
        <i class="pi pi-chart-bar text-4xl mb-3 block text-slate-400"></i>
        Belum ada proyek kegiatan terdaftar.
      </div>
    </div>
  </TemplateList>

  <!-- Dialog Add/Edit Project -->
  <Dialog
    v-model:visible="isProjectDialogOpen"
    :header="isEditing ? 'Edit Proyek Kegiatan' : 'Buat Proyek Kegiatan Baru'"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <!-- Nama Kegiatan -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Kegiatan</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Pentas Seni Kemerdekaan RI"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Limit Anggaran -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Limit Anggaran (RAB Rp)</label
        >
        <InputNumber
          v-model="budgetLimit"
          placeholder="Contoh: 1500000"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          :min="1"
          class="w-full"
          input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Status (Only Editable on Edit) -->
      <div v-if="isEditing" class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Status Proyek</label
        >
        <Select
          v-model="status"
          :options="statuses"
          placeholder="Pilih Status"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Dates Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >Tgl Mulai</label
          >
          <DatePicker
            v-model="startDate"
            date-format="yy-mm-dd"
            placeholder="Pilih Tanggal"
            class="w-full"
            input-class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm p-2.5 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >Tgl Selesai</label
          >
          <DatePicker
            v-model="endDate"
            date-format="yy-mm-dd"
            placeholder="Pilih Tanggal"
            class="w-full"
            input-class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm p-2.5 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-end mt-6">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="isProjectDialogOpen = false"
        />
        <Button label="Simpan" @click="handleSave" />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Project Details & Transaction Log -->
  <Dialog
    v-model:visible="isDetailsDialogOpen"
    :header="projectStore.currentProject?.name || 'Detail Kegiatan'"
    modal
    class="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div v-if="projectStore.currentProject" class="space-y-6 pt-4">
      <!-- Budget serapan statistics card -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
          >
            Anggaran RAB
          </p>
          <p class="text-base font-extrabold text-slate-900 mt-1">
            {{ formatCurrency(projectStore.currentProject.budgetLimit) }}
          </p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold"
          >
            Aktual Belanja
          </p>
          <p class="text-base font-extrabold text-rose-600 mt-1">
            {{ formatCurrency(projectStore.currentProject.spent) }}
          </p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold"
          >
            Sisa Anggaran
          </p>
          <p class="text-base font-extrabold text-emerald-600 mt-1">
            {{ formatCurrency(projectStore.currentProject.remaining) }}
          </p>
        </div>
      </div>

      <!-- Progress status -->
      <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Status Serapan:</span>
            <Tag
              :value="projectStore.currentProject.status"
              :severity="getStatusSeverity(projectStore.currentProject.status)"
              class="text-[8px] font-bold"
            />
          </div>
          <span class="text-slate-600 font-mono text-[11px]"
            >{{ formatDate(projectStore.currentProject.startDate) }} s.d.
            {{ formatDate(projectStore.currentProject.endDate) }}</span
          >
        </div>

        <!-- Progress Bar inside dialog -->
        <div
          class="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="
              getProgressBarColor(getPercentSpent(projectStore.currentProject))
            "
            :style="{
              width: getPercentSpent(projectStore.currentProject) + '%',
            }"
          ></div>
        </div>
      </div>

      <!-- Mapped Dues / Transaction History List -->
      <div>
        <p
          class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
        >
          Daftar Pengeluaran Terikat:
        </p>

        <DataTable
          :value="projectStore.currentProject.transactions"
          responsive-layout="scroll"
          class="w-full text-left"
          table-style="min-width: 30rem"
          empty-message="Belum ada transaksi pengeluaran terikat ke proyek ini."
        >
          <Column
            field="title"
            header="Transaksi"
            class="!border-slate-100 !p-3"
          >
            <template #body="slotProps">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ slotProps.data.title }}
                </p>
                <p class="text-[10px] text-slate-500">
                  {{ slotProps.data.date }}
                </p>
              </div>
            </template>
          </Column>
          <Column
            field="category"
            header="Kategori"
            class="!border-slate-100 !p-3"
          >
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.category"
                severity="secondary"
                class="!bg-slate-100 !text-slate-600 text-[9px]"
              />
            </template>
          </Column>
          <Column
            field="amount"
            header="Jumlah"
            class="!border-slate-100 text-right !p-3"
            header-class="text-right"
          >
            <template #body="slotProps">
              <span class="text-sm font-bold text-rose-600">
                - {{ formatCurrency(slotProps.data.amount) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <Button
          label="Tutup"
          severity="secondary"
          @click="isDetailsDialogOpen = false"
        />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Konfirmasi Hapus -->
  <Dialog
    v-model:visible="isConfirmDeleteOpen"
    header="Konfirmasi Hapus"
    modal
    class="w-full max-w-sm bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="pt-4 flex flex-col items-center text-center gap-3">
      <div
        class="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600"
      >
        <i class="pi pi-exclamation-triangle text-xl"></i>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900">Apakah Anda yakin?</p>
        <p class="text-xs text-slate-500 leading-relaxed">
          Tindakan ini akan menghapus proyek kegiatan secara permanen. Proyek
          yang sudah memiliki transaksi terikat tidak dapat dihapus.
        </p>
      </div>
      <p v-if="deleteError" class="text-xs text-rose-600 font-semibold mt-2">
        {{ deleteError }}
      </p>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-center mt-6 w-full">
        <Button
          label="Batal"
          severity="secondary"
          text
          class="w-full"
          @click="isConfirmDeleteOpen = false"
        />
        <Button
          label="Hapus"
          severity="danger"
          class="w-full"
          @click="confirmDelete"
        />
      </div>
    </template>
  </Dialog>
</template>
