<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

defineProps<{
  mappedIuran: any[]
  jenisIuranList: any[]
}>()

const emit = defineEmits<{
  (
    e: 'assign',
    payload: { jenisIuranId: string; customAmount: number | null },
  ): void
  (e: 'unassign', jenisIuranId: string): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const selectedJenisIuranId = ref('')
const customAmount = ref<number | null>(null)

watch(visible, (isOpen) => {
  if (isOpen) {
    selectedJenisIuranId.value = ''
    customAmount.value = null
  }
})

const handleAssignSubmit = () => {
  if (!selectedJenisIuranId.value) return
  emit('assign', {
    jenisIuranId: selectedJenisIuranId.value,
    customAmount: customAmount.value,
  })
  selectedJenisIuranId.value = ''
  customAmount.value = null
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
  <Dialog
    v-model:visible="visible"
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
              :options="jenisIuranList"
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
          @click="handleAssignSubmit"
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
              @click="emit('unassign', mapping.jenisIuranId)"
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
      <Button label="Tutup" severity="secondary" @click="visible = false" />
    </template>
  </Dialog>
</template>
