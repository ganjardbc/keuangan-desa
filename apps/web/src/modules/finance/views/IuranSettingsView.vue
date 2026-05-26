<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useJenisIuranStore, type JenisIuran } from '../stores/jenis-iuran'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const jenisIuranStore = useJenisIuranStore()
const authStore = useAuthStore()

// State Dialog
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteIuranId = ref<string | null>(null)

// State Form
const name = ref('')
const defaultAmount = ref<number | null>(null)
const period = ref('BULANAN')

const periods = ['BULANAN', 'TAHUNAN', 'INSIDENTAL']

onMounted(() => {
  jenisIuranStore.fetchJenisIuran()
})

const openAddDialog = () => {
  isEditing.value = false
  currentId.value = null
  name.value = ''
  defaultAmount.value = null
  period.value = 'BULANAN'
  isDialogOpen.value = true
}

const openEditDialog = (item: JenisIuran) => {
  isEditing.value = true
  currentId.value = item.id
  name.value = item.name
  defaultAmount.value = item.defaultAmount
  period.value = item.period
  isDialogOpen.value = true
}

const handleSave = async () => {
  if (!name.value || !defaultAmount.value) return

  const payload = {
    name: name.value,
    defaultAmount: defaultAmount.value,
    period: period.value,
  }

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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="item in jenisIuranStore.jenisIuranList" :key="item.id">
        <template #content>
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >Kategori Iuran</span
            >
            <Tag :value="item.period" severity="info" class="text-[10px]" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mt-4">{{ item.name }}</h3>
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

      <div
        v-if="jenisIuranStore.jenisIuranList.length === 0"
        class="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500"
      >
        <i class="pi pi-info-circle text-3xl mb-3 block"></i>
        Belum ada jenis iuran terkonfigurasi.
      </div>
    </div>
  </TemplateList>

  <!-- Dialog Add/Edit -->
  <Dialog
    v-model:visible="isDialogOpen"
    :header="isEditing ? 'Edit Kategori Iuran' : 'Tambah Kategori Iuran'"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Iuran</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Iuran Kebersihan Bulanan"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nominal Standar (Rp)</label
        >
        <InputNumber
          v-model="defaultAmount"
          placeholder="Contoh: 50000"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          :min="0"
          class="w-full"
          input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Periode Tagihan</label
        >
        <Select
          v-model="period"
          :options="periods"
          placeholder="Pilih Periode"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-end mt-6">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="isDialogOpen = false"
        />
        <Button label="Simpan" @click="handleSave" />
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
          Tindakan ini akan menghapus jenis iuran ini beserta pemetaan iuran
          warga yang bersangkutan secara permanen.
        </p>
      </div>
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
