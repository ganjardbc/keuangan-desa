<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWargaStore, type Warga } from '../stores/warga'
import { useJenisIuranStore } from '../../../modules/finance/stores/jenis-iuran'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

const wargaStore = useWargaStore()
const jenisIuranStore = useJenisIuranStore()
const authStore = useAuthStore()

// State Dialogs
const isWargaDialogOpen = ref(false)
const isIuranDialogOpen = ref(false)
const isEditing = ref(false)
const currentWargaId = ref<string | null>(null)
const first = ref(0)

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
      <Button
        v-if="authStore.hasPermission('warga:write')"
        label="Tambah Warga"
        icon="pi pi-plus"
        @click="openAddWargaDialog"
      />
    </template>

    <!-- Residents List Table -->
    <DataTable
      v-model:first="first"
      :value="wargaStore.wargaList"
      responsive-layout="scroll"
      class="w-full shadow-sm rounded-lg overflow-hidden"
      :paginator="true"
      :rows="10"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      :rows-per-page-options="[5, 10, 20, 50]"
    >
      <!-- No. Column -->
      <Column
        header="No."
        class="!border-slate-100 !p-3 w-12 text-center text-xs font-semibold text-slate-500"
      >
        <template #body="slotProps">
          {{ first + slotProps.index + 1 }}
        </template>
      </Column>

      <Column field="name" header="Nama Warga" class="!border-slate-100">
        <template #body="slotProps">
          <div>
            <p class="text-sm font-semibold text-slate-900">
              {{ slotProps.data.name }}
            </p>
            <p class="text-xs text-slate-500">
              Telp: {{ slotProps.data.phoneNumber || '-' }}
            </p>
          </div>
        </template>
      </Column>

      <Column field="houseNumber" header="No. Rumah" class="!border-slate-100">
        <template #body="slotProps">
          <span
            class="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700"
          >
            {{ slotProps.data.houseNumber }}
          </span>
        </template>
      </Column>

      <Column field="status" header="Status" class="!border-slate-100">
        <template #body="slotProps">
          <Tag
            :value="getStatusConfig(slotProps.data.status).label"
            :icon="`pi ${getStatusConfig(slotProps.data.status).icon}`"
            :class="[
              'border text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs',
              getStatusConfig(slotProps.data.status).bg,
              getStatusConfig(slotProps.data.status).text,
            ]"
          />
        </template>
      </Column>

      <Column header="Iuran Diikuti" class="!border-slate-100 max-w-[20rem]">
        <template #body="slotProps">
          <div class="flex flex-wrap gap-1">
            <Tag
              v-for="item in slotProps.data.iuranBulanan"
              :key="item.id"
              :value="`${item.jenisIuran.name} (${formatCurrency(item.customAmount ?? item.jenisIuran.defaultAmount)})`"
              severity="secondary"
              class="!bg-slate-100 !text-slate-600 text-[9px]"
            />
            <span
              v-if="
                !slotProps.data.iuranBulanan ||
                slotProps.data.iuranBulanan.length === 0
              "
              class="text-xs text-slate-400"
            >
              Belum ikut iuran
            </span>
          </div>
        </template>
      </Column>

      <Column
        v-if="authStore.hasPermission('warga:write')"
        header="Aksi"
        class="!border-slate-100 text-right"
        header-class="text-right"
      >
        <template #body="slotProps">
          <div class="flex items-center justify-end gap-2">
            <Button
              icon="pi pi-cog"
              severity="info"
              text
              size="small"
              title="Kelola Iuran Warga"
              @click="openIuranMappingDialog(slotProps.data)"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              size="small"
              title="Edit Profil"
              @click="openEditWargaDialog(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              title="Hapus Warga"
              @click="handleDeleteWarga(slotProps.data.id)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
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
