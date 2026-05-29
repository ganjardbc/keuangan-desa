<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWargaStore } from '../stores/warga'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import { useFinanceStore } from '../../finance/stores/finance'
import { useJenisIuranStore } from '../../finance/stores/jenis-iuran'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Paginator from 'primevue/paginator'

// Import new Dialog components
import PaymentDialog from '../components/PaymentDialog.vue'
import BulkPaymentDialog from '../components/BulkPaymentDialog.vue'
import BulkAllPaymentDialog from '../components/BulkAllPaymentDialog.vue'
import WaPreviewDialog from '../components/WaPreviewDialog.vue'

const wargaStore = useWargaStore()
const authStore = useAuthStore()
const financeStore = useFinanceStore()
const jenisIuranStore = useJenisIuranStore()

// Error states
const errorMessage = ref('')
const bulkAllErrorMessage = ref('')

// Bulk Payment State (Single Resident)
const isBulkPaymentDialogOpen = ref(false)
const bulkSelectedWarga = ref<any>(null)

// Bulk All Payment State (All Residents)
const isBulkAllPaymentDialogOpen = ref(false)

// Filters
const selectedYear = ref(new Date().getFullYear())
const years = [2024, 2025, 2026, 2027, 2028]
const searchQuery = ref('')
const first = ref(0)
const rows = ref(9)

// Unified Dialog State
const isPaymentDialogOpen = ref(false)
const selectedWarga = ref<any>(null)
const selectedMonth = ref<number | null>(null)

const submitLoading = ref(false)

// WhatsApp Preview/Receipt States
const isWaPreviewOpen = ref(false)
const selectedWaPayment = ref<any>(null)
const selectedWaWarga = ref<any>(null)
const selectedWaMonth = ref<number | null>(null)
const selectedWaYear = ref<number>(new Date().getFullYear())

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

// Fetch data
const loadData = async () => {
  await wargaStore.fetchRekapIuran(selectedYear.value)
  await financeStore.fetchKasAccounts()
  await jenisIuranStore.fetchJenisIuran()
}

onMounted(() => {
  loadData()
})

watch(searchQuery, () => {
  first.value = 0
})

watch(selectedYear, () => {
  first.value = 0
  loadData()
})

// Computed Filtered List
const filteredRekapList = computed(() => {
  if (!searchQuery.value) {
    return wargaStore.rekapList
  }
  const q = searchQuery.value.toLowerCase()
  return wargaStore.rekapList.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.houseNumber.toLowerCase().includes(q),
  )
})

const paginatedRekapList = computed(() => {
  const start = first.value
  const end = first.value + rows.value
  return filteredRekapList.value.slice(start, end)
})

const getWargaStats = (warga: any) => {
  let paidCount = 0
  let requiredCount = 0

  monthsList.forEach((m) => {
    const status = getMonthStatus(warga, m.value)
    if (status.code === 'PAID') {
      paidCount++
      requiredCount++
    } else if (status.code === 'PARTIAL') {
      requiredCount++
    } else if (status.code === 'UNPAID') {
      requiredCount++
    }
  })

  const percentage = requiredCount > 0 ? (paidCount / requiredCount) * 100 : 0
  return {
    paidCount,
    requiredCount,
    percentage,
  }
}

// Helpers to get month info for a warga
const getMonthData = (warga: any, monthVal: number) => {
  return (
    warga.months.find((m: any) => m.month === monthVal) || {
      isPaid: false,
      payments: [],
    }
  )
}

const getMonthStatus = (warga: any, monthVal: number) => {
  const totalDues = warga.iuranBulanan?.length || 0
  const monthData = getMonthData(warga, monthVal)
  const paidCount = monthData.payments?.length || 0

  if (totalDues === 0)
    return { label: 'Bebas', severity: 'secondary', code: 'FREE' }
  if (paidCount === 0)
    return { label: 'Belum', severity: 'danger', code: 'UNPAID' }
  if (paidCount < totalDues)
    return {
      label: `${paidCount}/${totalDues}`,
      severity: 'warn',
      code: 'PARTIAL',
    }
  return { label: 'Lunas', severity: 'success', code: 'PAID' }
}

// Dialog Actions
const openPaymentDialog = (warga: any, monthVal: number) => {
  selectedWarga.value = warga
  selectedMonth.value = monthVal
  if (financeStore.kasAccounts.length === 0) {
    financeStore.fetchKasAccounts()
  }
  isPaymentDialogOpen.value = true
}

const handlePay = async ({
  jenisIuranId,
  amountPaid,
  kasAccountId,
}: {
  jenisIuranId: string
  amountPaid: number
  kasAccountId: string
}) => {
  if (!selectedWarga.value || selectedMonth.value === null) return

  submitLoading.value = true
  const success = await wargaStore.payIuran(selectedWarga.value.id, {
    jenisIuranId,
    month: selectedMonth.value,
    year: selectedYear.value,
    amountPaid,
    kasAccountId,
  })

  if (success) {
    await loadData()
    // Refresh selectedWarga reference to show updated payments list
    selectedWarga.value = wargaStore.rekapList.find(
      (w) => w.id === selectedWarga.value.id,
    )
    isPaymentDialogOpen.value = false
  }
  submitLoading.value = false
}

// Bulk Payment (Single Resident)
const openBulkPaymentDialog = (warga: any) => {
  bulkSelectedWarga.value = warga
  errorMessage.value = ''

  if (financeStore.kasAccounts.length === 0) {
    financeStore.fetchKasAccounts()
  }

  isBulkPaymentDialogOpen.value = true
}

const handleBulkPay = async ({
  payments,
  kasAccountId,
}: {
  payments: any[]
  kasAccountId: string
}) => {
  if (!bulkSelectedWarga.value) return

  submitLoading.value = true
  errorMessage.value = ''

  const success = await wargaStore.payIuranBulk(bulkSelectedWarga.value.id, {
    payments,
    kasAccountId: kasAccountId || undefined,
  })

  if (success) {
    await loadData()
    isBulkPaymentDialogOpen.value = false
    bulkSelectedWarga.value = null
  } else {
    errorMessage.value =
      wargaStore.error || 'Gagal merekam pembayaran iuran massal.'
  }
  submitLoading.value = false
}

// Bulk All Payment (Multi Resident)
const bulkAllIuranOptions = computed(() => {
  return jenisIuranStore.jenisIuranList.filter((ji) => ji.period === 'BULANAN')
})

const openBulkAllPaymentDialog = () => {
  bulkAllErrorMessage.value = ''
  if (financeStore.kasAccounts.length === 0) {
    financeStore.fetchKasAccounts()
  }
  isBulkAllPaymentDialogOpen.value = true
}

const handleBulkAllPay = async ({
  wargaIds,
  jenisIuranId,
  month,
  kasAccountId,
}: {
  wargaIds: string[]
  jenisIuranId: string
  month: number
  kasAccountId: string
}) => {
  submitLoading.value = true
  bulkAllErrorMessage.value = ''

  const success = await wargaStore.payIuranBulkAll({
    wargaIds,
    jenisIuranId,
    month,
    year: selectedYear.value,
    kasAccountId: kasAccountId || undefined,
  })

  if (success) {
    await loadData()
    isBulkAllPaymentDialogOpen.value = false
  } else {
    bulkAllErrorMessage.value =
      wargaStore.error || 'Gagal merekam pembayaran massal warga.'
  }
  submitLoading.value = false
}

// WhatsApp Preview
const triggerWhatsAppPreview = ({ payment }: { payment: any }) => {
  selectedWaPayment.value = payment
  selectedWaWarga.value = selectedWarga.value
  selectedWaMonth.value = selectedMonth.value
  selectedWaYear.value = selectedYear.value
  isWaPreviewOpen.value = true
}

const receiptTemplate = computed(() => {
  return authStore.user?.tenant?.waReceiptTemplate || ''
})

// Calculated metrics for KPI Cards
const stats = computed(() => {
  let totalCollected = 0
  let totalRequiredDues = 0
  let totalPaidDues = 0
  let paidMonthsCount = 0
  let partialMonthsCount = 0
  let unpaidMonthsCount = 0
  let freeMonthsCount = 0

  wargaStore.rekapList.forEach((w: any) => {
    const mappedDuesCount = w.iuranBulanan?.length || 0

    monthsList.forEach((m) => {
      const monthData = getMonthData(w, m.value)
      const monthStatus = getMonthStatus(w, m.value)

      // Sum up cash collected
      if (monthData.payments) {
        monthData.payments.forEach((p: any) => {
          totalCollected += p.amountPaid || 0
        })
      }

      if (monthStatus.code === 'PAID') {
        paidMonthsCount++
      } else if (monthStatus.code === 'PARTIAL') {
        partialMonthsCount++
      } else if (monthStatus.code === 'UNPAID') {
        unpaidMonthsCount++
      } else if (monthStatus.code === 'FREE') {
        freeMonthsCount++
      }

      if (mappedDuesCount > 0) {
        totalRequiredDues += mappedDuesCount
        totalPaidDues += monthData.payments?.length || 0
      }
    })
  })

  const complianceRate =
    totalRequiredDues > 0 ? (totalPaidDues / totalRequiredDues) * 100 : 0

  return {
    totalCollected,
    complianceRate,
    paidMonthsCount,
    partialMonthsCount,
    unpaidMonthsCount,
    freeMonthsCount,
    totalRequiredDues,
    totalPaidDues,
  }
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

// Generate payment details tooltip text
const getTooltipText = (warga: any, monthVal: number) => {
  const monthData = getMonthData(warga, monthVal)
  if (!monthData.payments || monthData.payments.length === 0) {
    return 'Belum ada pembayaran'
  }
  return monthData.payments
    .map(
      (p: any) =>
        `${p.jenisIuranName}: Lunas (${formatCurrency(p.amountPaid)})`,
    )
    .join('\n')
}
</script>

<template>
  <TemplateList
    title="Matriks Rekapitulasi Iuran"
    description="Pencatatan & pemantauan status iuran bulanan warga per tahun"
  >
    <!-- Toolbar -->
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto"
    >
      <div class="relative flex-1 flex items-center">
        <InputGroup>
          <InputText
            v-model="searchQuery"
            placeholder="Cari warga / no. rumah..."
            fluid
          />
          <InputGroupAddon>
            <i class="pi pi-search text-slate-400" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <Select
          v-model="selectedYear"
          placeholder="Pilih Tahun"
          :options="years"
          fluid
          class="min-w-[120px]"
        />
        <Button
          v-if="authStore.hasPermission('warga:write')"
          label="Bayar Massal"
          icon="pi pi-users"
          severity="primary"
          fluid
          class="min-w-[170px]"
          @click="openBulkAllPaymentDialog"
        />
      </div>
    </div>

    <!-- KPI/Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      <!-- Total Collected Card -->
      <div
        class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group"
      >
        <div
          class="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:scale-110 transition-transform duration-500 select-none"
        >
          <i class="pi pi-wallet text-8xl"></i>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors"
        >
          <i class="pi pi-wallet text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Total Dana Terkumpul
          </p>
          <h3 class="text-lg font-bold text-slate-800 mt-1 truncate">
            {{ formatCurrency(stats.totalCollected) }}
          </h3>
          <p class="text-[10px] text-slate-500 mt-0.5">
            Tahun Anggaran {{ selectedYear }}
          </p>
        </div>
      </div>

      <!-- Compliance Rate Card -->
      <div
        class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group"
      >
        <div
          class="absolute -right-4 -bottom-4 text-primary-500/5 group-hover:scale-110 transition-transform duration-500 select-none"
        >
          <i class="pi pi-percentage text-8xl"></i>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors"
        >
          <i class="pi pi-percentage text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Tingkat Kepatuhan
          </p>
          <div class="flex items-baseline gap-2 mt-1">
            <h3 class="text-lg font-bold text-slate-800">
              {{ stats.complianceRate.toFixed(1) }}%
            </h3>
            <span class="text-[9px] font-medium text-slate-500"
              >({{ stats.totalPaidDues }}/{{
                stats.totalRequiredDues
              }}
              iuran)</span
            >
          </div>
          <div
            class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden"
          >
            <div
              class="bg-gradient-to-r from-primary-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              :style="{ width: `${stats.complianceRate}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Paid Months Card -->
      <div
        class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group"
      >
        <div
          class="absolute -right-4 -bottom-4 text-teal-500/5 group-hover:scale-110 transition-transform duration-500 select-none"
        >
          <i class="pi pi-calendar-plus text-8xl"></i>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors"
        >
          <i class="pi pi-calendar text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Status Lunas (Bulan)
          </p>
          <h3 class="text-lg font-bold text-slate-800 mt-1">
            {{ stats.paidMonthsCount }}
            <span class="text-[10px] font-normal text-slate-500"
              >Bulan-Warga</span
            >
          </h3>
          <p
            class="text-[10px] text-teal-600 font-semibold flex items-center gap-1 mt-0.5"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
            Pembayaran penuh
          </p>
        </div>
      </div>

      <!-- Unpaid Months Card -->
      <div
        class="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group"
      >
        <div
          class="absolute -right-4 -bottom-4 text-rose-500/5 group-hover:scale-110 transition-transform duration-500 select-none"
        >
          <i class="pi pi-exclamation-circle text-8xl"></i>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors"
        >
          <i class="pi pi-info-circle text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Tunggakan Tersisa
          </p>
          <h3 class="text-lg font-bold text-rose-600 mt-1">
            {{ stats.unpaidMonthsCount }}
            <span class="text-[10px] font-normal text-slate-500"
              >Belum Bayar</span
            >
          </h3>
          <p
            v-if="stats.partialMonthsCount > 0"
            class="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            {{ stats.partialMonthsCount }} warga bayar sebagian
          </p>
          <p v-else class="text-[10px] text-slate-500 mt-0.5">
            Perlu ditindaklanjuti
          </p>
        </div>
      </div>
    </div>

    <!-- Legend / Keterangan -->
    <div
      class="flex-1 flex flex-wrap gap-x-6 gap-y-2.5 items-center justify-start"
    >
      <span
        class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 select-none"
        >Keterangan Status:</span
      >
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <span
          class="w-3.5 h-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500"
        >
          <i class="pi pi-check text-[8px] font-bold"></i>
        </span>
        <span class="font-medium">Lunas</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <span
          class="w-3.5 h-3.5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500"
        >
          <i class="pi pi-exclamation-circle text-[8px] font-bold"></i>
        </span>
        <span class="font-medium">Sebagian</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <span
          class="w-3.5 h-3.5 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500"
        >
          <i class="pi pi-plus text-[8px] font-bold"></i>
        </span>
        <span class="font-medium">Belum Bayar</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <span
          class="w-3.5 h-3.5 rounded-md bg-slate-50 border border-slate-200"
        ></span>
        <span class="font-medium">Bebas Iuran</span>
      </div>
    </div>

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
        <!-- Card header skeleton -->
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-slate-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
        <!-- Card progress skeleton -->
        <div class="space-y-2 pt-2">
          <div class="h-3 bg-slate-200 rounded w-1/4"></div>
          <div class="h-2 bg-slate-200 rounded w-full"></div>
        </div>
        <!-- Card grid skeleton -->
        <div class="grid grid-cols-4 gap-2 pt-2">
          <div
            v-for="j in 12"
            :key="j"
            class="h-11 bg-slate-200 rounded-xl"
          ></div>
        </div>
      </div>
    </div>

    <!-- Warga Cards Container -->
    <div v-else-if="filteredRekapList.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="warga in paginatedRekapList"
          :key="warga.id"
          class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group"
        >
          <!-- Card Header -->
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <!-- Initials circle avatar -->
              <div
                class="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none flex-shrink-0"
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
                <p class="text-[10px] text-slate-500 font-mono">
                  No. Rumah: {{ warga.houseNumber }}
                </p>
              </div>
            </div>

            <!-- Dues completed percentage badge -->
            <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                :class="[
                  getWargaStats(warga).percentage === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : getWargaStats(warga).percentage > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100',
                ]"
              >
                {{ getWargaStats(warga).paidCount }}/{{
                  getWargaStats(warga).requiredCount
                }}
                Lunas
              </span>
              <Button
                v-if="
                  authStore.hasPermission('warga:write') &&
                  getWargaStats(warga).percentage < 100
                "
                icon="pi pi-bolt"
                label="Bayar Cepat"
                size="small"
                outlined
                severity="help"
                class="!text-[9px] !px-2 !py-0.5 !h-6 !rounded-full"
                title="Catat Pembayaran Banyak Bulan Sekaligus"
                @click="openBulkPaymentDialog(warga)"
              />
            </div>
          </div>

          <!-- Compliance progress bar -->
          <div class="mb-4">
            <div
              class="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="
                  getWargaStats(warga).percentage === 100
                    ? 'bg-emerald-500'
                    : 'bg-primary-600'
                "
                :style="{ width: `${getWargaStats(warga).percentage}%` }"
              ></div>
            </div>
          </div>

          <!-- 12 Months Mini Grid (4 columns x 3 rows) -->
          <div class="grid grid-cols-4 gap-2">
            <Button
              v-for="m in monthsList"
              :key="m.value"
              :title="getTooltipText(warga, m.value)"
              :disabled="getMonthStatus(warga, m.value).code === 'FREE'"
              class="!py-2 !px-1 !rounded-xl !border !text-center !transition-all !select-none !font-bold !text-[10px] !flex !flex-col !items-center !justify-center !gap-1 !shadow-sm active:!scale-95 !duration-150 !shadow-none"
              :class="[
                getMonthStatus(warga, m.value).code === 'FREE'
                  ? '!bg-slate-50 !border-slate-100 !text-slate-400 !cursor-not-allowed !opacity-50'
                  : getMonthStatus(warga, m.value).code === 'UNPAID'
                    ? '!bg-rose-50 !border-rose-100 hover:!bg-rose-100 hover:!border-rose-200 !text-rose-600 !cursor-pointer'
                    : getMonthStatus(warga, m.value).code === 'PARTIAL'
                      ? '!bg-amber-50 !border-amber-100 hover:!bg-amber-100 hover:!border-amber-200 !text-amber-600 !cursor-pointer'
                      : '!bg-emerald-50 !border-emerald-100 hover:!bg-emerald-100 hover:!border-emerald-200 !text-emerald-600 !cursor-pointer',
              ]"
              @click="openPaymentDialog(warga, m.value)"
            >
              <span class="text-[9px] font-bold opacity-80 select-none">{{
                m.name
              }}</span>
              <span class="inline-flex items-center justify-center h-4">
                <i
                  v-if="getMonthStatus(warga, m.value).code === 'PAID'"
                  class="pi pi-check text-[9px] text-emerald-600"
                ></i>
                <span
                  v-else-if="getMonthStatus(warga, m.value).code === 'PARTIAL'"
                  class="text-[9px] text-amber-600 font-extrabold select-none"
                >
                  {{ getMonthStatus(warga, m.value).label }}
                </span>
                <i
                  v-else-if="getMonthStatus(warga, m.value).code === 'UNPAID'"
                  class="pi pi-plus text-[8px] text-rose-500"
                ></i>
                <span
                  v-else
                  class="text-[8px] text-slate-400 font-normal select-none"
                  >-</span
                >
              </span>
            </Button>
          </div>
        </div>
      </div>

      <!-- Custom Pagination -->
      <Paginator
        v-model:first="first"
        v-model:rows="rows"
        :total-records="filteredRekapList.length"
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

  <!-- Dialog Components -->
  <PaymentDialog
    v-model:visible="isPaymentDialogOpen"
    :warga="selectedWarga"
    :month="selectedMonth"
    :year="selectedYear"
    :kas-accounts="financeStore.kasAccounts"
    :loading="submitLoading"
    :has-write-permission="authStore.hasPermission('warga:write')"
    @pay="handlePay"
    @send-wa="triggerWhatsAppPreview"
  />

  <BulkPaymentDialog
    v-model:visible="isBulkPaymentDialogOpen"
    :warga="bulkSelectedWarga"
    :year="selectedYear"
    :kas-accounts="financeStore.kasAccounts"
    :loading="submitLoading"
    :error-message="errorMessage"
    @pay="handleBulkPay"
  />

  <BulkAllPaymentDialog
    v-model:visible="isBulkAllPaymentDialogOpen"
    :rekap-list="wargaStore.rekapList"
    :iuran-options="bulkAllIuranOptions"
    :kas-accounts="financeStore.kasAccounts"
    :year="selectedYear"
    :loading="submitLoading"
    :error-message="bulkAllErrorMessage"
    @pay="handleBulkAllPay"
  />

  <WaPreviewDialog
    v-model:visible="isWaPreviewOpen"
    :payment="selectedWaPayment"
    :warga="selectedWaWarga"
    :month="selectedWaMonth"
    :year="selectedWaYear"
    :receipt-template="receiptTemplate"
  />
</template>
