<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWargaStore, type Warga } from '../stores/warga'
import { useJenisIuranStore } from '../../../modules/finance/stores/jenis-iuran'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Paginator from 'primevue/paginator'

const wargaStore = useWargaStore()
const jenisIuranStore = useJenisIuranStore()
const authStore = useAuthStore()

// State Dialogs
const isWargaDialogOpen = ref(false)
const isIuranDialogOpen = ref(false)
const isEditing = ref(false)
const currentWargaId = ref<string | null>(null)
const first = ref(0)
const rows = ref(9)
const searchQuery = ref('')

// Warga Form State
const name = ref('')
const houseNumber = ref('')
const phoneNumber = ref('')
const status = ref('sudah_bayar')

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
const selectedJenisIuranId = ref('')
const customAmount = ref<number | null>(null)

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
  name.value = ''
  houseNumber.value = ''
  phoneNumber.value = ''
  status.value = 'sudah_bayar'
  isWargaDialogOpen.value = true
}

const openEditWargaDialog = (warga: Warga) => {
  isEditing.value = true
  currentWargaId.value = warga.id
  name.value = warga.name
  houseNumber.value = warga.houseNumber
  phoneNumber.value = warga.phoneNumber || ''
  status.value = warga.status
  isWargaDialogOpen.value = true
}

const handleSaveWarga = async () => {
  if (!name.value || !houseNumber.value) return

  const payload = {
    name: name.value,
    houseNumber: houseNumber.value,
    phoneNumber: phoneNumber.value || undefined,
    status: status.value,
  }

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
  mappedIuran.value = warga.iuranBulanan || []
  selectedJenisIuranId.value = ''
  customAmount.value = null
  isIuranDialogOpen.value = true
}

const handleAddIuranMapping = async () => {
  if (!currentWargaId.value || !selectedJenisIuranId.value) return

  const success = await wargaStore.assignIuran(currentWargaId.value, {
    jenisIuranId: selectedJenisIuranId.value,
    customAmount: customAmount.value,
  })

  if (success) {
    // Refresh local mapped list
    const updatedWarga = wargaStore.wargaList.find(
      (w) => w.id === currentWargaId.value,
    )
    if (updatedWarga) {
      mappedIuran.value = updatedWarga.iuranBulanan || []
    }
    selectedJenisIuranId.value = ''
    customAmount.value = null
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
      }
    }
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
    <template #actions>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto"
      >
        <div class="relative flex items-center">
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
          label="Tambah Warga"
          icon="pi pi-plus"
          @click="openAddWargaDialog"
        />
      </div>
    </template>

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
                  class="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none flex-shrink-0"
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

  <!-- Dialog Add/Edit Warga -->
  <Dialog
    v-model:visible="isWargaDialogOpen"
    :header="isEditing ? 'Edit Data Warga' : 'Tambah Warga Baru'"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Lengkap</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Budi Santoso"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nomor Rumah</label
        >
        <InputText
          v-model="houseNumber"
          placeholder="Contoh: A-12"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nomor Telp / WhatsApp</label
        >
        <InputText
          v-model="phoneNumber"
          placeholder="Contoh: 08123456789"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Status Iuran</label
        >
        <Select
          v-model="status"
          :options="statuses"
          placeholder="Pilih Status"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2">
              <i
                :class="`pi ${getStatusConfig(slotProps.value).icon} text-xs ${getStatusConfig(slotProps.value).text}`"
              />
              <span class="font-medium text-slate-700 text-xs">{{
                getStatusConfig(slotProps.value).label
              }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <i
                :class="`pi ${getStatusConfig(slotProps.option).icon} text-xs ${getStatusConfig(slotProps.option).text}`"
              />
              <span class="font-medium text-slate-700 text-xs">{{
                getStatusConfig(slotProps.option).label
              }}</span>
            </div>
          </template>
        </Select>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-end mt-6">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="isWargaDialogOpen = false"
        />
        <Button label="Simpan" @click="handleSaveWarga" />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Manage Iuran Mapping -->
  <Dialog
    v-model:visible="isIuranDialogOpen"
    header="Kelola Iuran Warga"
    modal
    class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Add New Mapping Form -->
      <div
        class="bg-violet-50 border border-violet-100 p-4 rounded-xl space-y-4"
      >
        <p class="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Hubungkan ke Iuran Baru
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-slate-500 uppercase tracking-wider"
              >Jenis Iuran</label
            >
            <Select
              v-model="selectedJenisIuranId"
              :options="jenisIuranStore.jenisIuranList"
              option-value="id"
              option-label="name"
              placeholder="Pilih Iuran"
              class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-slate-500 uppercase tracking-wider"
              >Tarif Kustom (Opsional Rp)</label
            >
            <InputNumber
              v-model="customAmount"
              placeholder="Gunakan default jika kosong"
              mode="currency"
              currency="IDR"
              locale="id-ID"
              :min="0"
              class="w-full"
              input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs"
            />
          </div>
        </div>
        <Button
          label="Petakan Iuran"
          icon="pi pi-plus"
          size="small"
          class="w-full"
          @click="handleAddIuranMapping"
        />
      </div>

      <!-- Mapped Iuran List -->
      <div>
        <p
          class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
        >
          Iuran yang Diikuti:
        </p>
        <div class="divide-y divide-slate-100">
          <div
            v-for="mapping in mappedIuran"
            :key="mapping.id"
            class="flex items-center justify-between py-3 first:pt-0"
          >
            <div>
              <p class="text-sm font-semibold text-slate-900">
                {{ mapping.jenisIuran.name }}
              </p>
              <p class="text-xs text-slate-500">
                Nominal:
                <span class="text-violet-600 font-bold">
                  {{
                    formatCurrency(
                      mapping.customAmount ?? mapping.jenisIuran.defaultAmount,
                    )
                  }}
                </span>
                <span
                  v-if="mapping.customAmount"
                  class="text-[10px] text-emerald-600 ml-1"
                  >(Tarif Kustom)</span
                >
              </p>
            </div>
            <Button
              icon="pi pi-times"
              severity="danger"
              outlined
              size="small"
              title="Hapus Pemetaan"
              @click="handleRemoveIuranMapping(mapping.jenisIuranId)"
            />
          </div>

          <div
            v-if="mappedIuran.length === 0"
            class="text-center p-6 text-slate-400 text-xs"
          >
            Warga ini belum mengikuti iuran apapun.
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        label="Tutup"
        severity="secondary"
        @click="isIuranDialogOpen = false"
      />
    </template>
  </Dialog>
</template>
