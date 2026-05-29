<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'

const props = defineProps<{
  warga: any
  year: number
  kasAccounts: any[]
  loading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'pay', payload: { payments: any[]; kasAccountId: string }): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const bulkSelectedIurans = reactive<Record<string, boolean>>({})
const bulkKasAccountId = ref<string>('')

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

const getUnpaidIuransForMonth = (warga: any, monthVal: number) => {
  if (!warga) return []
  const monthData = getMonthData(warga, monthVal)
  const paidNames = monthData.payments.map((p: any) => p.jenisIuranName)
  return warga.iuranBulanan.filter(
    (ib: any) => !paidNames.includes(ib.jenisIuran.name),
  )
}

const bulkUnpaidMonthsList = computed(() => {
  if (!props.warga) return []
  return monthsList.filter((m) => {
    const unpaid = getUnpaidIuransForMonth(props.warga, m.value)
    return unpaid.length > 0
  })
})

const bulkSelectedCount = computed(() => {
  return Object.values(bulkSelectedIurans).filter(Boolean).length
})

const bulkTotalAmount = computed(() => {
  if (!props.warga) return 0
  let total = 0
  Object.entries(bulkSelectedIurans).forEach(([key, isChecked]) => {
    if (!isChecked) return
    const [monthValStr, iuranId] = key.split('-')
    const monthVal = parseInt(monthValStr, 10)
    const unpaid = getUnpaidIuransForMonth(props.warga, monthVal)
    const ib = unpaid.find((item: any) => item.jenisIuran.id === iuranId)
    if (ib) {
      total += ib.customAmount ?? ib.jenisIuran.defaultAmount
    }
  })
  return total
})

const isAllSelectedForMonth = (monthVal: number) => {
  if (!props.warga) return false
  const unpaid = getUnpaidIuransForMonth(props.warga, monthVal)
  return unpaid.every(
    (ib: any) => bulkSelectedIurans[`${monthVal}-${ib.jenisIuran.id}`],
  )
}

const toggleMonthAllIurans = (monthVal: number) => {
  if (!props.warga) return
  const unpaid = getUnpaidIuransForMonth(props.warga, monthVal)
  const allSelected = isAllSelectedForMonth(monthVal)
  unpaid.forEach((ib: any) => {
    bulkSelectedIurans[`${monthVal}-${ib.jenisIuran.id}`] = !allSelected
  })
}

const selectAllBulkIurans = () => {
  if (!props.warga) return
  for (let m = 1; m <= 12; m++) {
    const unpaid = getUnpaidIuransForMonth(props.warga, m)
    unpaid.forEach((ib: any) => {
      bulkSelectedIurans[`${m}-${ib.jenisIuran.id}`] = true
    })
  }
}

const selectUpToCurrentMonth = () => {
  if (!props.warga) return
  const currentMonthNum = new Date().getMonth() + 1
  for (let m = 1; m <= 12; m++) {
    const unpaid = getUnpaidIuransForMonth(props.warga, m)
    unpaid.forEach((ib: any) => {
      bulkSelectedIurans[`${m}-${ib.jenisIuran.id}`] = m <= currentMonthNum
    })
  }
}

const clearAllBulkIurans = () => {
  Object.keys(bulkSelectedIurans).forEach((key) => {
    bulkSelectedIurans[key] = false
  })
}

// Watch dialog open state or warga changing to initialize/reset values
watch(
  [() => props.warga, () => props.kasAccounts, visible],
  ([newWarga, newAccounts, isOpen]) => {
    if (!isOpen || !newWarga) return

    // Clear reactive object properties
    Object.keys(bulkSelectedIurans).forEach((key) => {
      delete bulkSelectedIurans[key]
    })

    for (let m = 1; m <= 12; m++) {
      const unpaid = getUnpaidIuransForMonth(newWarga, m)
      unpaid.forEach((ib: any) => {
        bulkSelectedIurans[`${m}-${ib.jenisIuran.id}`] = false
      })
    }

    if (newAccounts && newAccounts.length > 0 && !bulkKasAccountId.value) {
      bulkKasAccountId.value = newAccounts[0].id
    }
  },
  { immediate: true },
)

const handleRecordBulkPaymentSubmit = () => {
  if (!props.warga || bulkSelectedCount.value === 0) return

  const paymentsToSend: any[] = []
  Object.entries(bulkSelectedIurans).forEach(([key, isChecked]) => {
    if (!isChecked) return
    const [monthValStr, iuranId] = key.split('-')
    const monthVal = parseInt(monthValStr, 10)
    const unpaid = getUnpaidIuransForMonth(props.warga, monthVal)
    const ib = unpaid.find((item: any) => item.jenisIuran.id === iuranId)
    if (ib) {
      paymentsToSend.push({
        jenisIuranId: iuranId,
        month: monthVal,
        year: props.year,
        amountPaid: ib.customAmount ?? ib.jenisIuran.defaultAmount,
      })
    }
  })

  emit('pay', {
    payments: paymentsToSend,
    kasAccountId: bulkKasAccountId.value,
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
    :header="`Pencatatan Iuran Cepat: ${warga?.name || ''}`"
    modal
    class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Resident Info Summary -->
      <div
        class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden"
      >
        <div class="absolute -right-3 -top-3 text-slate-100 select-none">
          <i class="pi pi-bolt text-6xl"></i>
        </div>
        <div class="relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Warga & No. Rumah
          </p>
          <p class="font-bold text-slate-800 text-sm mt-0.5">
            {{ warga?.name }}
          </p>
          <p class="text-xs text-slate-500 font-mono mt-0.5">
            Rumah: No. {{ warga?.houseNumber }}
          </p>
        </div>
        <div class="text-right relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Jumlah Terpilih
          </p>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100 mt-1"
          >
            <i class="pi pi-check-square text-[10px]"></i>
            {{ bulkSelectedCount }} Iuran
          </span>
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
          <p class="font-bold text-rose-800">Gagal Menyimpan Pembayaran</p>
          <p class="mt-0.5">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap gap-2">
        <Button
          label="Centang Semua"
          icon="pi pi-check-square"
          severity="secondary"
          size="small"
          outlined
          class="!rounded-xl text-xs"
          @click="selectAllBulkIurans"
        />
        <Button
          label="Centang s.d. Bulan Ini"
          icon="pi pi-calendar"
          severity="secondary"
          size="small"
          outlined
          class="!rounded-xl text-xs"
          @click="selectUpToCurrentMonth"
        />
        <Button
          v-if="bulkSelectedCount > 0"
          label="Batal"
          icon="pi pi-times"
          severity="danger"
          size="small"
          outlined
          class="!rounded-xl text-xs"
          @click="clearAllBulkIurans"
        />
      </div>

      <!-- Scrollable List of Months with Unpaid Mappings -->
      <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        <div
          v-for="m in bulkUnpaidMonthsList"
          :key="m.value"
          class="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div
            class="flex items-center justify-between mb-3 border-b border-slate-200/50 pb-2"
          >
            <span
              class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5"
            >
              <i class="pi pi-calendar text-[10px] text-slate-400"></i>
              {{ m.name }} {{ year }}
            </span>
            <Button
              type="button"
              severity="primary"
              link
              class="!text-[10px] !text-primary-600 !font-extrabold hover:!text-primary-800 !transition-colors !cursor-pointer !p-0"
              :label="
                isAllSelectedForMonth(m.value) ? 'Batal Centang' : 'Pilih Semua'
              "
              @click="toggleMonthAllIurans(m.value)"
            />
          </div>

          <div class="space-y-2">
            <div
              v-for="ib in getUnpaidIuransForMonth(warga, m.value)"
              :key="ib.jenisIuran.id"
              class="flex items-center justify-between text-xs py-1"
            >
              <label
                class="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none"
              >
                <Checkbox
                  v-model="bulkSelectedIurans[`${m.value}-${ib.jenisIuran.id}`]"
                  :binary="true"
                  class="cursor-pointer"
                />
                <span class="font-medium text-slate-800">{{
                  ib.jenisIuran.name
                }}</span>
              </label>
              <span class="font-bold text-slate-900">{{
                formatCurrency(ib.customAmount ?? ib.jenisIuran.defaultAmount)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Selection & Total Summary -->
      <div
        v-if="bulkSelectedCount > 0"
        class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm"
      >
        <!-- Account Dropdown -->
        <div class="flex flex-col gap-1.5">
          <label
            class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            Akun Kas Penerima
          </label>
          <Select
            v-model="bulkKasAccountId"
            :options="kasAccounts"
            option-value="id"
            option-label="name"
            placeholder="Pilih Rekening Kas"
            class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
          />
        </div>

        <!-- Total Calculation -->
        <div
          class="flex items-center justify-between pt-2 border-t border-slate-200/50"
        >
          <span class="text-xs font-bold text-slate-500"
            >Total Belanja Iuran:</span
          >
          <span class="text-base font-extrabold text-primary-600">
            {{ formatCurrency(bulkTotalAmount) }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="bg-slate-50 border border-slate-200 border-dashed p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2 select-none"
      >
        <i class="pi pi-check-square text-lg text-slate-300"></i>
        <p class="text-xs text-slate-500">
          Silakan centang bulan/iuran yang ingin dibayar di atas.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button label="Batal" severity="secondary" @click="visible = false" />
        <Button
          :loading="loading"
          label="Catat Pembayaran"
          icon="pi pi-credit-card"
          :disabled="!bulkSelectedCount"
          @click="handleRecordBulkPaymentSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
