<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

const props = defineProps<{
  wargaList: any[]
  jenisIuranList: any[]
  loading?: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: {
      wargaIds: string[]
      jenisIuranId: string
      customAmount: number | null
    },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const selectedJenisIuranId = ref('')
const customAmount = ref<number | null>(null)
const selectedWargaChecklist = reactive<Record<string, boolean>>({})
const modalSearchQuery = ref('')

const filteredModalWargaList = computed(() => {
  if (!modalSearchQuery.value) return props.wargaList
  const q = modalSearchQuery.value.toLowerCase()
  return props.wargaList.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.houseNumber.toLowerCase().includes(q),
  )
})

const selectedCount = computed(() => {
  return Object.values(selectedWargaChecklist).filter(Boolean).length
})

const isAllSelected = computed(() => {
  if (filteredModalWargaList.value.length === 0) return false
  return filteredModalWargaList.value.every((w) => selectedWargaChecklist[w.id])
})

const toggleAllSelection = () => {
  const allSelected = isAllSelected.value
  filteredModalWargaList.value.forEach((w) => {
    selectedWargaChecklist[w.id] = !allSelected
  })
}

// Reset/Initialize modal state on open
watch(visible, (isOpen) => {
  if (!isOpen) return
  selectedJenisIuranId.value = ''
  customAmount.value = null
  modalSearchQuery.value = ''

  // Clear and default select all warga
  Object.keys(selectedWargaChecklist).forEach((key) => {
    delete selectedWargaChecklist[key]
  })
  props.wargaList.forEach((w) => {
    selectedWargaChecklist[w.id] = true
  })
})

const handleSaveSubmit = () => {
  if (!selectedJenisIuranId.value || selectedCount.value === 0) return

  const selectedWargaIds = Object.entries(selectedWargaChecklist)
    .filter((entry) => entry[1])
    .map((entry) => entry[0])

  emit('save', {
    wargaIds: selectedWargaIds,
    jenisIuranId: selectedJenisIuranId.value,
    customAmount: customAmount.value,
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Hubungkan Iuran Massal"
    modal
    class="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Info Banner -->
      <div
        class="bg-primary-50/50 border border-primary-100 p-4 rounded-2xl flex items-start gap-3 relative overflow-hidden"
      >
        <div class="absolute -right-3 -top-3 text-primary-100/30 select-none">
          <i class="pi pi-cog text-6xl"></i>
        </div>
        <i
          class="pi pi-info-circle text-primary-600 text-lg mt-0.5 flex-shrink-0"
        ></i>
        <div class="relative z-10 text-xs text-slate-600 leading-relaxed">
          <p class="font-bold text-primary-800 mb-0.5">
            Petakan Iuran Massal Warga
          </p>
          Menghubungkan satu jenis iuran bulanan bagi beberapa warga sekaligus.
          Anda juga dapat menetapkan nominal kustom (tarif khusus) bagi warga
          terpilih.
        </div>
      </div>

      <!-- Error Message Banner -->
      <div
        v-if="errorMessage"
        class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm"
      >
        <i
          class="pi pi-exclamation-circle text-base text-rose-600 mt-0.5 flex-shrink-0"
        ></i>
        <div class="flex-1">
          <p class="font-bold text-rose-800">Gagal Memproses Pemetaan Iuran</p>
          <p class="mt-0.5">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Grid layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Left Column: Iuran Config -->
        <div class="md:col-span-5 space-y-4">
          <div
            class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm"
          >
            <h3
              class="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5"
            >
              <i class="pi pi-cog text-slate-400"></i>
              Konfigurasi Iuran
            </h3>

            <!-- Select Jenis Iuran -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Kategori Iuran
              </label>
              <Select
                v-model="selectedJenisIuranId"
                :options="jenisIuranList"
                option-value="id"
                option-label="name"
                placeholder="Pilih Iuran"
                class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
              />
            </div>

            <!-- Custom Amount -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Nominal Tarif Kustom (Rp)
              </label>
              <InputNumber
                v-model="customAmount"
                placeholder="Gunakan default iuran jika kosong"
                mode="currency"
                currency="IDR"
                locale="id-ID"
                :min="0"
                class="w-full"
                input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
              />
            </div>
          </div>

          <!-- Total Summary Box -->
          <div
            v-if="selectedCount > 0 && selectedJenisIuranId"
            class="bg-primary-50/25 border border-primary-100 p-5 rounded-2xl space-y-4 shadow-sm"
          >
            <div class="flex items-center justify-between pt-1">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-500">Penerima:</span>
                <span class="text-[10px] text-slate-400 font-medium"
                  >({{ selectedCount }} Warga Terpilih)</span
                >
              </div>
              <span class="text-xs font-extrabold text-primary-700">
                Pencatatan Massal
              </span>
            </div>

            <Button
              :loading="loading"
              label="Petakan Iuran Massal"
              icon="pi pi-check"
              fluid
              @click="handleSaveSubmit"
            />
          </div>
        </div>

        <!-- Right Column: Warga Checklist -->
        <div class="md:col-span-7 flex flex-col space-y-3">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <h4
              class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 select-none"
            >
              <i class="pi pi-user-check text-primary-500"></i>
              Daftar Penerima
            </h4>
            <div class="flex items-center gap-3">
              <Button
                v-if="filteredModalWargaList.length > 0"
                type="button"
                severity="primary"
                link
                class="!text-[10px] !text-primary-600 !font-extrabold hover:!text-primary-800 !transition-colors !cursor-pointer !p-0"
                :label="isAllSelected ? 'Batal Semua' : 'Pilih Semua'"
                @click="toggleAllSelection"
              />
            </div>
          </div>

          <!-- Search filter for dialog warga list -->
          <div class="relative flex items-center">
            <InputGroup>
              <InputText
                v-model="modalSearchQuery"
                placeholder="Cari nama / no. rumah warga..."
                class="!text-xs !p-2 rounded-xl"
              />
              <InputGroupAddon class="!p-2">
                <i class="pi pi-search text-slate-400 text-xs" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <!-- Residents grid checklist -->
          <div
            v-if="filteredModalWargaList.length > 0"
            class="border border-slate-100 rounded-2xl max-h-[350px] overflow-y-auto bg-slate-50/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1"
          >
            <div
              v-for="warga in filteredModalWargaList"
              :key="warga.id"
              class="flex items-start justify-between p-3 bg-white border rounded-2xl shadow-sm hover:border-primary-300 hover:shadow transition-all cursor-pointer relative group"
              :class="
                selectedWargaChecklist[warga.id]
                  ? 'border-primary-500/50 bg-primary-50/5'
                  : 'border-slate-100'
              "
              @click="
                selectedWargaChecklist[warga.id] =
                  !selectedWargaChecklist[warga.id]
              "
            >
              <div class="flex items-start gap-2.5 flex-1 min-w-0">
                <div class="pt-0.5">
                  <Checkbox
                    v-model="selectedWargaChecklist[warga.id]"
                    :binary="true"
                    class="cursor-pointer"
                    @click.stop
                  />
                </div>
                <div class="min-w-0">
                  <p
                    class="font-bold text-slate-850 text-xs truncate group-hover:text-primary-700 transition-colors"
                  >
                    {{ warga.name }}
                  </p>
                  <span
                    class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-bold text-slate-500 mt-1"
                  >
                    Rumah: {{ warga.houseNumber }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-center py-16 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2 select-none"
          >
            <i class="pi pi-search text-xl text-slate-300"></i>
            <span>Tidak ada warga yang cocok dengan pencarian Anda.</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <Button label="Batal" severity="secondary" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>
