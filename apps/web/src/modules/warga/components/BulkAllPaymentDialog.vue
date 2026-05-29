<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'

const props = defineProps<{
  rekapList: any[]
  iuranOptions: any[]
  kasAccounts: any[]
  year: number
  loading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  (
    e: 'pay',
    payload: {
      wargaIds: string[]
      jenisIuranId: string
      month: number
      kasAccountId: string
    },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const bulkAllSelectedIuranId = ref<string>('')
const bulkAllSelectedMonth = ref<number | null>(null)
const bulkAllKasAccountId = ref<string>('')
const bulkAllWargaChecklist = reactive<Record<string, boolean>>({})

const monthsList = [
  { value: 1, name: 'Jan', nameFull: 'Januari' },
  { value: 2, name: 'Feb', nameFull: 'Februari' },
  { value: 3, name: 'Mar', nameFull: 'Maret' },
  { value: 4, name: 'Apr', nameFull: 'April' },
  { value: 5, name: 'Mei', nameFull: 'Mei' },
  { value: 6, name: 'Jun', nameFull: 'Juni' },
  { value: 7, name: 'Jul', nameFull: 'Juli' },
  { value: 8, name: 'Agt', nameFull: 'Agustus' },
  { value: 9, name: 'Sep', nameFull: 'September' },
  { value: 10, name: 'Okt', nameFull: 'Oktober' },
  { value: 11, name: 'Nov', nameFull: 'November' },
  { value: 12, name: 'Des', nameFull: 'Desember' },
]

const getMonthData = (warga: any, monthVal: number) => {
  return (
    warga?.months?.find((m: any) => m.month === monthVal) || {
      isPaid: false,
      payments: [],
    }
  )
}

const unpaidWargaList = computed(() => {
  if (!bulkAllSelectedIuranId.value || bulkAllSelectedMonth.value === null)
    return []

  return props.rekapList.filter((warga) => {
    const isAssigned = warga.iuranBulanan.some(
      (ib: any) => ib.jenisIuran.id === bulkAllSelectedIuranId.value,
    )
    if (!isAssigned) return false

    const monthData = getMonthData(warga, bulkAllSelectedMonth.value!)
    const paidNames = monthData.payments.map((p: any) => p.jenisIuranName)
    const mapping = warga.iuranBulanan.find(
      (ib: any) => ib.jenisIuran.id === bulkAllSelectedIuranId.value,
    )
    return !paidNames.includes(mapping.jenisIuran.name)
  })
})

watch(unpaidWargaList, (newList) => {
  Object.keys(bulkAllWargaChecklist).forEach((key) => {
    delete bulkAllWargaChecklist[key]
  })
  newList.forEach((warga) => {
    bulkAllWargaChecklist[warga.id] = true
  })
})

const bulkAllSelectedCount = computed(() => {
  return Object.values(bulkAllWargaChecklist).filter(Boolean).length
})

const bulkAllTotalAmount = computed(() => {
  if (!bulkAllSelectedIuranId.value) return 0
  let total = 0
  unpaidWargaList.value.forEach((warga) => {
    if (bulkAllWargaChecklist[warga.id]) {
      const mapping = warga.iuranBulanan.find(
        (ib: any) => ib.jenisIuran.id === bulkAllSelectedIuranId.value,
      )
      if (mapping) {
        total += mapping.customAmount ?? mapping.jenisIuran.defaultAmount
      }
    }
  })
  return total
})

const isAllBulkAllWargaSelected = computed(() => {
  if (unpaidWargaList.value.length === 0) return false
  return unpaidWargaList.value.every((w) => bulkAllWargaChecklist[w.id])
})

const toggleBulkAllWargaSelection = () => {
  const allSelected = isAllBulkAllWargaSelected.value
  unpaidWargaList.value.forEach((w) => {
    bulkAllWargaChecklist[w.id] = !allSelected
  })
}

// Watch dialog visibility to initialize
watch(visible, (isOpen) => {
  if (!isOpen) return

  bulkAllSelectedMonth.value = new Date().getMonth() + 1 // Default to current month

  if (props.iuranOptions.length > 0) {
    bulkAllSelectedIuranId.value = props.iuranOptions[0].id
  } else {
    bulkAllSelectedIuranId.value = ''
  }

  if (props.kasAccounts.length > 0) {
    bulkAllKasAccountId.value = props.kasAccounts[0].id
  } else {
    bulkAllKasAccountId.value = ''
  }
})

// Also initialize if props are updated while dialog is already open
watch(
  [() => props.iuranOptions, () => props.kasAccounts],
  ([newIurans, newAccounts]) => {
    if (!visible.value) return
    if (!bulkAllSelectedIuranId.value && newIurans.length > 0) {
      bulkAllSelectedIuranId.value = newIurans[0].id
    }
    if (!bulkAllKasAccountId.value && newAccounts.length > 0) {
      bulkAllKasAccountId.value = newAccounts[0].id
    }
  },
)

const handleRecordBulkAllPaymentSubmit = () => {
  if (
    !bulkAllSelectedIuranId.value ||
    bulkAllSelectedMonth.value === null ||
    bulkAllSelectedCount.value === 0
  )
    return

  const selectedWargaIds = Object.entries(bulkAllWargaChecklist)
    .filter((entry) => entry[1])
    .map((entry) => entry[0])

  emit('pay', {
    wargaIds: selectedWargaIds,
    jenisIuranId: bulkAllSelectedIuranId.value,
    month: bulkAllSelectedMonth.value,
    kasAccountId: bulkAllKasAccountId.value,
  })
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
    header="Pencatatan Iuran Massal Warga"
    modal
    class="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Info Banner -->
      <div
        class="bg-primary-50/50 border border-primary-100 p-4 rounded-2xl flex items-start gap-3 relative overflow-hidden"
      >
        <div class="absolute -right-3 -top-3 text-primary-100/30 select-none">
          <i class="pi pi-users text-6xl"></i>
        </div>
        <i
          class="pi pi-info-circle text-primary-600 text-lg mt-0.5 flex-shrink-0"
        ></i>
        <div class="relative z-10 text-xs text-slate-600 leading-relaxed">
          <p class="font-bold text-primary-800 mb-0.5">
            Metode Bayar Cepat Massal
          </p>
          Mencatat pembayaran untuk satu jenis iuran bulanan bagi beberapa warga
          sekaligus pada periode terpilih. Sistem akan mendeteksi nominal kustom
          masing-masing warga secara otomatis.
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
          <p class="font-bold text-rose-800">
            Gagal Memproses Pembayaran Massal
          </p>
          <p class="mt-0.5">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Widescreen Layout: Left Column (Config & Summary) | Right Column (Residents Checklist Grid) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Left Side: Config & Summary -->
        <div class="md:col-span-5 space-y-4">
          <div
            class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm"
          >
            <h3
              class="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5"
            >
              <i class="pi pi-cog text-slate-400"></i>
              Konfigurasi Pembayaran
            </h3>

            <!-- Jenis Iuran -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Jenis Iuran Bulanan
              </label>
              <Select
                v-model="bulkAllSelectedIuranId"
                :options="iuranOptions"
                option-value="id"
                option-label="name"
                placeholder="Pilih Iuran"
                class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
              />
            </div>

            <!-- Bulan -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Pilih Bulan
              </label>
              <Select
                v-model="bulkAllSelectedMonth"
                :options="monthsList"
                option-value="value"
                option-label="nameFull"
                placeholder="Pilih Bulan"
                class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
              />
            </div>

            <!-- Akun Kas Penerima -->
            <div class="flex flex-col gap-1.5 pt-1">
              <label
                class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Akun Kas Penerima
              </label>
              <Select
                v-model="bulkAllKasAccountId"
                :options="kasAccounts"
                option-value="id"
                option-label="name"
                placeholder="Pilih Rekening Kas"
                class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
              />
            </div>
          </div>

          <!-- Total Summary Box -->
          <div
            v-if="bulkAllSelectedCount > 0"
            class="bg-primary-50/25 border border-primary-100 p-5 rounded-2xl space-y-4 shadow-sm"
          >
            <div class="flex items-center justify-between pt-1">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-500"
                  >Total Transaksi:</span
                >
                <span class="text-[10px] text-slate-400 font-medium"
                  >({{ bulkAllSelectedCount }} Warga Terpilih)</span
                >
              </div>
              <span class="text-lg font-extrabold text-primary-600">
                {{ formatCurrency(bulkAllTotalAmount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Side: Residents Checklist Grid -->
        <div class="md:col-span-7 flex flex-col space-y-3">
          <div class="flex items-center justify-between">
            <h4
              class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 select-none"
            >
              <i class="pi pi-user-check text-primary-500"></i>
              Daftar Warga Terhutang
            </h4>
            <Button
              v-if="unpaidWargaList.length > 0"
              type="button"
              severity="primary"
              link
              class="!text-[10px] !text-primary-600 !font-extrabold hover:!text-primary-800 !transition-colors !cursor-pointer !p-0"
              :label="isAllBulkAllWargaSelected ? 'Batal Semua' : 'Pilih Semua'"
              @click="toggleBulkAllWargaSelection"
            />
          </div>

          <!-- The Grid Container -->
          <div v-if="bulkAllSelectedIuranId && bulkAllSelectedMonth !== null">
            <div
              v-if="unpaidWargaList.length > 0"
              class="border border-slate-100 rounded-2xl max-h-[380px] overflow-y-auto bg-slate-50/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1"
            >
              <div
                v-for="warga in unpaidWargaList"
                :key="warga.id"
                class="flex items-start justify-between p-3.5 bg-white border rounded-2xl shadow-sm hover:border-primary-300 hover:shadow transition-all cursor-pointer relative group"
                :class="
                  bulkAllWargaChecklist[warga.id]
                    ? 'border-primary-500/50 bg-primary-50/5'
                    : 'border-slate-100'
                "
                @click="
                  bulkAllWargaChecklist[warga.id] =
                    !bulkAllWargaChecklist[warga.id]
                "
              >
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <div class="pt-0.5">
                    <Checkbox
                      v-model="bulkAllWargaChecklist[warga.id]"
                      :binary="true"
                      class="cursor-pointer"
                      @click.stop
                    />
                  </div>
                  <div class="min-w-0">
                    <p
                      class="font-extrabold text-slate-800 text-xs truncate group-hover:text-primary-700 transition-colors"
                    >
                      {{ warga.name }}
                    </p>
                    <span
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 mt-1"
                    >
                      Rumah: {{ warga.houseNumber }}
                    </span>
                  </div>
                </div>

                <span
                  class="font-bold text-slate-900 text-xs text-right pl-2 shrink-0"
                >
                  {{
                    formatCurrency(
                      warga.iuranBulanan.find(
                        (ib: any) =>
                          ib.jenisIuran.id === bulkAllSelectedIuranId,
                      )?.customAmount ??
                        warga.iuranBulanan.find(
                          (ib: any) =>
                            ib.jenisIuran.id === bulkAllSelectedIuranId,
                        )?.jenisIuran.defaultAmount ??
                        0,
                    )
                  }}
                </span>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="text-center py-16 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2 select-none"
            >
              <i class="pi pi-verified text-2xl text-emerald-600"></i>
              <span class="font-extrabold text-emerald-700 text-sm"
                >Semua Lunas!</span
              >
              <span class="text-slate-400 text-[10px]"
                >Seluruh warga telah melunasi iuran ini untuk periode
                tersebut.</span
              >
            </div>
          </div>

          <!-- Configuration Not Chosen State -->
          <div
            v-else
            class="text-center py-16 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2 select-none"
          >
            <i class="pi pi-calendar text-xl text-slate-300"></i>
            <span>Silakan tentukan Jenis Iuran dan Bulan terlebih dahulu.</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button label="Batal" severity="secondary" @click="visible = false" />
        <Button
          :loading="loading"
          label="Catat Pembayaran"
          icon="pi pi-credit-card"
          :disabled="!bulkAllSelectedCount"
          @click="handleRecordBulkAllPaymentSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
