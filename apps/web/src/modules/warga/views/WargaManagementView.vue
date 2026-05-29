<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWargaStore, type Warga } from '../stores/warga'
import { useJenisIuranStore } from '../../../modules/finance/stores/jenis-iuran'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Paginator from 'primevue/paginator'

// Import new Dialog components
import WargaDialog from '../components/WargaDialog.vue'
import IuranMappingDialog from '../components/IuranMappingDialog.vue'
import BulkIuranMappingDialog from '../components/BulkIuranMappingDialog.vue'

const wargaStore = useWargaStore()
const jenisIuranStore = useJenisIuranStore()
const authStore = useAuthStore()

// State Dialogs
const isWargaDialogOpen = ref(false)
const isIuranDialogOpen = ref(false)
const isBulkIuranDialogOpen = ref(false)
const isEditing = ref(false)
const currentWargaId = ref<string | null>(null)
const selectedWarga = ref<Warga | null>(null)
const first = ref(0)
const rows = ref(9)
const searchQuery = ref('')
const bulkErrorMessage = ref<string | null>(null)

const statuses = ['sudah_bayar', 'belum_bayar', 'menunggak']

const statusConfig: Record<
  string,
  { label: string; text: string; bg: string; icon: string }
> = {
  sudah_bayar: {
    label: 'Lunas',
    text: '!text-emerald-700',
    bg: '!bg-emerald-50/80 !border-emerald-200/60',
    icon: 'pi-check-circle',
  },
  belum_bayar: {
    label: 'Belum Bayar',
    text: '!text-amber-700',
    bg: '!bg-amber-50/80 !border-amber-200/60',
    icon: 'pi-exclamation-circle',
  },
  menunggak: {
    label: 'Menunggak',
    text: '!text-rose-700',
    bg: '!bg-rose-50/80 !border-rose-200/60',
    icon: 'pi-exclamation-triangle',
  },
}

const getStatusConfig = (status: string) => {
  return (
    statusConfig[status] || {
      label: status,
      text: '!text-slate-600',
      bg: '!bg-slate-50 !border-slate-200',
      icon: 'pi-circle',
    }
  )
}

// Iuran Mapping Dialog State
const mappedIuran = ref<any[]>([])

watch(searchQuery, () => {
  first.value = 0
})

const filteredWargaList = computed(() => {
  if (!searchQuery.value) {
    return wargaStore.wargaList
  }
  const q = searchQuery.value.toLowerCase()
  return wargaStore.wargaList.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.houseNumber.toLowerCase().includes(q),
  )
})

const paginatedWargaList = computed(() => {
  const start = first.value
  const end = first.value + rows.value
  return filteredWargaList.value.slice(start, end)
})

onMounted(() => {
  wargaStore.fetchWarga()
  jenisIuranStore.fetchJenisIuran()
})

const openAddWargaDialog = () => {
  isEditing.value = false
  currentWargaId.value = null
  selectedWarga.value = null
  isWargaDialogOpen.value = true
}

const openEditWargaDialog = (warga: Warga) => {
  isEditing.value = true
  currentWargaId.value = warga.id
  selectedWarga.value = warga
  isWargaDialogOpen.value = true
}

const handleSaveWarga = async (payload: {
  name: string
  houseNumber: string
  phoneNumber: string
  status: string
}) => {
  let success = false
  if (isEditing.value && currentWargaId.value) {
    success = await wargaStore.updateWarga(currentWargaId.value, payload)
  } else {
    success = await wargaStore.addWarga(payload)
  }

  if (success) {
    isWargaDialogOpen.value = false
  }
}

const handleDeleteWarga = async (id: string) => {
  if (
    confirm(
      'Apakah Anda yakin ingin menghapus data warga ini? Riwayat iuran warga ini juga akan terhapus secara permanen.',
    )
  ) {
    await wargaStore.deleteWarga(id)
  }
}

// Iuran Mapping Actions
const openIuranMappingDialog = (warga: Warga) => {
  currentWargaId.value = warga.id
  selectedWarga.value = warga
  mappedIuran.value = warga.iuranBulanan || []
  isIuranDialogOpen.value = true
}

const handleAddIuranMapping = async ({
  jenisIuranId,
  customAmount,
}: {
  jenisIuranId: string
  customAmount: number | null
}) => {
  if (!currentWargaId.value) return

  const success = await wargaStore.assignIuran(currentWargaId.value, {
    jenisIuranId,
    customAmount,
  })

  if (success) {
    // Refresh local mapped list
    const updatedWarga = wargaStore.wargaList.find(
      (w) => w.id === currentWargaId.value,
    )
    if (updatedWarga) {
      mappedIuran.value = updatedWarga.iuranBulanan || []
      selectedWarga.value = updatedWarga
    }
  }
}

const handleRemoveIuranMapping = async (jenisIuranId: string) => {
  if (!currentWargaId.value) return
  if (confirm('Lepaskan iuran ini dari warga?')) {
    const success = await wargaStore.unassignIuran(
      currentWargaId.value,
      jenisIuranId,
    )
    if (success) {
      const updatedWarga = wargaStore.wargaList.find(
        (w) => w.id === currentWargaId.value,
      )
      if (updatedWarga) {
        mappedIuran.value = updatedWarga.iuranBulanan || []
        selectedWarga.value = updatedWarga
      }
    }
  }
}

// Bulk Iuran Mapping Actions
const openBulkIuranMappingDialog = () => {
  bulkErrorMessage.value = null
  isBulkIuranDialogOpen.value = true
}

const handleBulkIuranMappingSave = async (payload: {
  wargaIds: string[]
  jenisIuranId: string
  customAmount: number | null
}) => {
  bulkErrorMessage.value = null
  const success = await wargaStore.assignIuranBulk(payload)
  if (success) {
    isBulkIuranDialogOpen.value = false
  } else {
    bulkErrorMessage.value =
      wargaStore.error || 'Gagal memetakan iuran secara massal.'
  }
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
    title="Kelola Data Warga"
    description="Atur profil penduduk, nomor rumah, dan pemetaan iuran bulanan"
  >
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto"
    >
      <div class="relative flex-1 flex items-center">
        <InputGroup>
          <InputText
            v-model="searchQuery"
            fluid
            placeholder="Cari warga / no. rumah..."
          />
          <InputGroupAddon>
            <i class="pi pi-search text-slate-400" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <Button
        v-if="authStore.hasPermission('warga:write')"
        label="Iuran Massal"
        icon="pi pi-cog"
        severity="secondary"
        @click="openBulkIuranMappingDialog"
      />
      <Button
        v-if="authStore.hasPermission('warga:write')"
        label="Tambah Warga"
        icon="pi pi-plus"
        @click="openAddWargaDialog"
      />
    </div>

    <!-- Skeleton Cards while loading -->
    <div
      v-if="wargaStore.loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white border border-slate-100 p-5 rounded-2xl animate-pulse space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 w-2/3">
            <div class="h-10 w-10 rounded-full bg-slate-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-full"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
          <div class="h-6 bg-slate-200 rounded-full w-16"></div>
        </div>
        <div class="space-y-2 pt-2">
          <div class="h-3 bg-slate-200 rounded w-1/4"></div>
          <div class="h-6 bg-slate-200 rounded-lg w-full"></div>
        </div>
        <div class="space-y-2 pt-2">
          <div class="h-3 bg-slate-200 rounded w-1/3"></div>
          <div class="flex gap-2">
            <div class="h-5 bg-slate-200 rounded w-16"></div>
            <div class="h-5 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-50">
          <div class="h-8 w-8 bg-slate-200 rounded-xl"></div>
          <div class="h-8 w-8 bg-slate-200 rounded-xl"></div>
          <div class="h-8 w-8 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Warga Cards Container -->
    <div v-else-if="filteredWargaList.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="warga in paginatedWargaList"
          :key="warga.id"
          class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <!-- Header: Initials + Name + Status Tag -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Avatar Initials -->
                <div
                  class="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none flex-shrink-0"
                >
                  {{ warga.name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <h4
                    class="text-sm font-bold text-slate-800 truncate"
                    :title="warga.name"
                  >
                    {{ warga.name }}
                  </h4>
                  <p
                    v-if="warga.phoneNumber"
                    class="text-[10px] text-slate-400 flex items-center mt-0.5"
                  >
                    <i class="pi pi-phone text-[9px] mr-1"></i>
                    {{ warga.phoneNumber }}
                  </p>
                  <p v-else class="text-[10px] text-slate-400 italic mt-0.5">
                    Tidak ada nomor telepon
                  </p>
                </div>
              </div>

              <!-- Status Tag -->
              <div class="flex-shrink-0">
                <Tag
                  :value="getStatusConfig(warga.status).label"
                  :icon="`pi ${getStatusConfig(warga.status).icon}`"
                  :class="[
                    'border text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs',
                    getStatusConfig(warga.status).bg,
                    getStatusConfig(warga.status).text,
                  ]"
                />
              </div>
            </div>

            <!-- House Details -->
            <div
              class="bg-slate-50 border border-slate-100/60 rounded-xl px-3 py-2 flex items-center justify-between mb-4"
            >
              <span
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >Nomor Rumah</span
              >
              <span
                class="font-mono text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 shadow-3xs font-semibold"
              >
                {{ warga.houseNumber }}
              </span>
            </div>

            <!-- List of followed iurans -->
            <div class="space-y-1.5 mb-4">
              <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >
                Iuran Diikuti
              </p>
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="item in warga.iuranBulanan"
                  :key="item.id"
                  :value="`${item.jenisIuran.name} (${formatCurrency(item.customAmount ?? item.jenisIuran.defaultAmount)})`"
                  severity="secondary"
                  class="!bg-slate-100 !text-slate-600 text-[9px] !font-medium"
                />
                <span
                  v-if="!warga.iuranBulanan || warga.iuranBulanan.length === 0"
                  class="text-xs text-slate-400 italic block py-0.5"
                >
                  Belum mengikuti iuran apapun
                </span>
              </div>
            </div>
          </div>

          <!-- Actions Footer (For Bendahara/Write permissions) -->
          <div
            v-if="authStore.hasPermission('warga:write')"
            class="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-50"
          >
            <Button
              icon="pi pi-cog"
              severity="info"
              outlined
              size="small"
              title="Kelola Iuran Warga"
              @click="openIuranMappingDialog(warga)"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              size="small"
              title="Edit Profil"
              @click="openEditWargaDialog(warga)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              size="small"
              title="Hapus Warga"
              @click="handleDeleteWarga(warga.id)"
            />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Paginator
        v-model:first="first"
        v-model:rows="rows"
        :total-records="filteredWargaList.length"
        :rows-per-page-options="[6, 9, 12, 24, 48]"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        class="mt-6 !bg-transparent !border-0"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
    >
      <div
        class="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 select-none"
      >
        <i class="pi pi-search text-2xl"></i>
      </div>
      <h3 class="text-sm font-semibold text-slate-900">
        Data warga tidak ditemukan
      </h3>
      <p class="text-xs text-slate-500 mt-1 max-w-xs">
        Tidak ada warga atau nomor rumah yang cocok dengan "{{ searchQuery }}".
        Coba cari dengan kata kunci lain.
      </p>
      <Button
        v-if="searchQuery"
        label="Reset Pencarian"
        severity="secondary"
        size="small"
        class="mt-4"
        @click="searchQuery = ''"
      />
    </div>
  </TemplateList>

  <!-- Dialog Components -->
  <WargaDialog
    v-model:visible="isWargaDialogOpen"
    :warga="selectedWarga"
    :is-editing="isEditing"
    :statuses="statuses"
    @save="handleSaveWarga"
  />

  <IuranMappingDialog
    v-model:visible="isIuranDialogOpen"
    :mapped-iuran="mappedIuran"
    :jenis-iuran-list="jenisIuranStore.jenisIuranList"
    @assign="handleAddIuranMapping"
    @unassign="handleRemoveIuranMapping"
  />

  <BulkIuranMappingDialog
    v-model:visible="isBulkIuranDialogOpen"
    :warga-list="wargaStore.wargaList"
    :jenis-iuran-list="jenisIuranStore.jenisIuranList"
    :loading="wargaStore.loading"
    :error-message="bulkErrorMessage"
    @save="handleBulkIuranMappingSave"
  />
</template>
