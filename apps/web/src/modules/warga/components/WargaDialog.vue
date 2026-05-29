<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'

const props = defineProps<{
  warga: any
  isEditing: boolean
  statuses: string[]
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: {
      name: string
      houseNumber: string
      phoneNumber: string
      status: string
    },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const name = ref('')
const houseNumber = ref('')
const phoneNumber = ref('')
const status = ref('sudah_bayar')

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

watch(
  [() => props.warga, () => props.isEditing, visible],
  ([newWarga, newIsEditing, isOpen]) => {
    if (!isOpen) return
    if (newIsEditing && newWarga) {
      name.value = newWarga.name
      houseNumber.value = newWarga.houseNumber
      phoneNumber.value = newWarga.phoneNumber || ''
      status.value = newWarga.status
    } else {
      name.value = ''
      houseNumber.value = ''
      phoneNumber.value = ''
      status.value = 'sudah_bayar'
    }
  },
  { immediate: true },
)

const handleSave = () => {
  if (!name.value || !houseNumber.value) return
  emit('save', {
    name: name.value,
    houseNumber: houseNumber.value,
    phoneNumber: phoneNumber.value,
    status: status.value,
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
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
          @click="visible = false"
        />
        <Button label="Simpan" @click="handleSave" />
      </div>
    </template>
  </Dialog>
</template>
