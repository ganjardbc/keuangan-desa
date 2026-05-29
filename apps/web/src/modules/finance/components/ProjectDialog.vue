<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'

const props = defineProps<{
  isEditing: boolean
  project: any
  statuses: string[]
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: {
      name: string
      budgetLimit: number
      status?: 'PERENCANAAN' | 'BERJALAN' | 'SELESAI'
      startDate?: string
      endDate?: string
    },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const name = ref('')
const budgetLimit = ref<number | null>(0)
const status = ref<'PERENCANAAN' | 'BERJALAN' | 'SELESAI'>('PERENCANAAN')
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)

watch(
  [() => props.project, () => props.isEditing, visible],
  ([newProject, newIsEditing, isOpen]) => {
    if (!isOpen) return
    if (newIsEditing && newProject) {
      name.value = newProject.name
      budgetLimit.value = newProject.budgetLimit
      status.value = newProject.status
      startDate.value = newProject.startDate
        ? new Date(newProject.startDate)
        : null
      endDate.value = newProject.endDate ? new Date(newProject.endDate) : null
    } else {
      name.value = ''
      budgetLimit.value = 0
      status.value = 'PERENCANAAN'
      startDate.value = null
      endDate.value = null
    }
  },
  { immediate: true },
)

const formatDateToISOString = (d: Date | null) => {
  if (!d) return undefined
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split('T')[0]
}

const handleSaveSubmit = () => {
  if (!name.value || !budgetLimit.value) return
  emit('save', {
    name: name.value,
    budgetLimit: budgetLimit.value,
    status: props.isEditing ? status.value : undefined,
    startDate: formatDateToISOString(startDate.value),
    endDate: formatDateToISOString(endDate.value),
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
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
          @click="visible = false"
        />
        <Button label="Simpan" @click="handleSaveSubmit" />
      </div>
    </template>
  </Dialog>
</template>
