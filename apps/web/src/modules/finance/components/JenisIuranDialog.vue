<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'

const props = defineProps<{
  isEditing: boolean
  iuran: any
  periods: string[]
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: { name: string; defaultAmount: number; period: string },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const name = ref('')
const defaultAmount = ref<number | null>(null)
const period = ref('BULANAN')

watch(
  [() => props.iuran, () => props.isEditing, visible],
  ([newIuran, newIsEditing, isOpen]) => {
    if (!isOpen) return
    if (newIsEditing && newIuran) {
      name.value = newIuran.name
      defaultAmount.value = newIuran.defaultAmount
      period.value = newIuran.period
    } else {
      name.value = ''
      defaultAmount.value = null
      period.value = 'BULANAN'
    }
  },
  { immediate: true },
)

const handleSaveSubmit = () => {
  if (!name.value || !defaultAmount.value) return
  emit('save', {
    name: name.value,
    defaultAmount: defaultAmount.value,
    period: period.value,
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
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
          @click="visible = false"
        />
        <Button label="Simpan" @click="handleSaveSubmit" />
      </div>
    </template>
  </Dialog>
</template>
