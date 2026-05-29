<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useJenisIuranStore, type JenisIuran } from '../stores/jenis-iuran'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'

// Import new Dialog components
import JenisIuranDialog from '../components/JenisIuranDialog.vue'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog.vue'

const jenisIuranStore = useJenisIuranStore()
const authStore = useAuthStore()

// State Dialog
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const selectedIuran = ref<JenisIuran | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteIuranId = ref<string | null>(null)

const periods = ['BULANAN', 'TAHUNAN', 'INSIDENTAL']

const first = ref(0)
const rows = ref(6)

const paginatedJenisIuranList = computed(() => {
  const start = first.value
  const end = first.value + rows.value
  return jenisIuranStore.jenisIuranList.slice(start, end)
})

onMounted(() => {
  jenisIuranStore.fetchJenisIuran()
})

const openAddDialog = () => {
  isEditing.value = false
  currentId.value = null
  selectedIuran.value = null
  isDialogOpen.value = true
}

const openEditDialog = (item: JenisIuran) => {
  isEditing.value = true
  currentId.value = item.id
  selectedIuran.value = item
  isDialogOpen.value = true
}

const handleSave = async (payload: {
  name: string
  defaultAmount: number
  period: string
}) => {
  let success = false
  if (isEditing.value && currentId.value) {
    success = await jenisIuranStore.updateJenisIuran(currentId.value, payload)
  } else {
    success = await jenisIuranStore.addJenisIuran(payload)
  }

  if (success) {
    isDialogOpen.value = false
  }
}

const triggerDelete = (id: string) => {
  deleteIuranId.value = id
  isConfirmDeleteOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteIuranId.value) return
  await jenisIuranStore.deleteJenisIuran(deleteIuranId.value)
  isConfirmDeleteOpen.value = false
  deleteIuranId.value = null
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <TemplateList
    title="Konfigurasi Jenis Iuran"
    description="Atur kategori pungutan iuran wajib warga"
  >
    <template #actions>
      <Button
        v-if="authStore.hasPermission('warga:write')"
        label="Tambah Iuran"
        icon="pi pi-plus"
        @click="openAddDialog"
      />
    </template>

    <!-- Grid of Tariffs -->
    <div v-if="paginatedJenisIuranList.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="item in paginatedJenisIuranList" :key="item.id">
          <template #content>
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Kategori Iuran</span
              >
              <Tag :value="item.period" severity="info" class="text-[10px]" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mt-4">
              {{ item.name }}
            </h3>
            <p class="text-2xl font-extrabold text-violet-600 mt-2">
              {{ formatCurrency(item.defaultAmount) }}
            </p>

            <div
              v-if="authStore.hasPermission('warga:write')"
              class="flex items-center gap-2 mt-6 border-t border-slate-100 pt-4"
            >
              <Button
                icon="pi pi-pencil"
                label="Edit"
                severity="secondary"
                outlined
                size="small"
                class="w-full"
                @click="openEditDialog(item)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                @click="triggerDelete(item.id)"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Pagination -->
      <Paginator
        v-model:first="first"
        v-model:rows="rows"
        :total-records="jenisIuranStore.jenisIuranList.length"
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
      <i class="pi pi-info-circle text-3xl mb-3 block"></i>
      Belum ada jenis iuran terkonfigurasi.
    </div>
  </TemplateList>

  <!-- Jenis Iuran Dialog -->
  <JenisIuranDialog
    v-model:visible="isDialogOpen"
    :is-editing="isEditing"
    :iuran="selectedIuran"
    :periods="periods"
    @save="handleSave"
  />

  <!-- Confirm Delete Dialog -->
  <ConfirmDeleteDialog
    v-model:visible="isConfirmDeleteOpen"
    title="Apakah Anda yakin?"
    description="Tindakan ini akan menghapus jenis iuran ini beserta pemetaan iuran warga yang bersangkutan secara permanen."
    :error-message="null"
    @confirm="confirmDelete"
  />
</template>
