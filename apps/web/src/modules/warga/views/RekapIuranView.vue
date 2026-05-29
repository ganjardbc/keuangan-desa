<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWargaStore } from '../stores/warga'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Paginator from 'primevue/paginator'

const wargaStore = useWargaStore()
const authStore = useAuthStore()

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
const selectedMonthName = computed(() => {
  if (selectedMonth.value === null) return ''
  return monthsList.find((m) => m.value === selectedMonth.value)?.nameFull || ''
})

// New Payment Form State
const selectedIuranId = ref<string>('')
const amountPaid = ref<number>(0)
const submitLoading = ref(false)

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
  selectedIuranId.value = ''
  amountPaid.value = 0

  // Set default form values if there are unpaid iurans
  const unpaid = unpaidIurans.value
  if (unpaid.length > 0) {
    selectedIuranId.value = unpaid[0].jenisIuran.id
    amountPaid.value =
      unpaid[0].customAmount ?? unpaid[0].jenisIuran.defaultAmount
  }

  isPaymentDialogOpen.value = true
}

// Compute unpaid iurans for the selected month
const unpaidIurans = computed(() => {
  if (!selectedWarga.value || selectedMonth.value === null) return []
  const monthData = getMonthData(selectedWarga.value, selectedMonth.value)
  const paidIuranNames = monthData.payments.map((p: any) => p.jenisIuranName)

  return selectedWarga.value.iuranBulanan.filter(
    (ib: any) => !paidIuranNames.includes(ib.jenisIuran.name),
  )
})

// Watch selected iuran and update amount automatically
watch(selectedIuranId, (newId) => {
  if (!newId || !selectedWarga.value) return
  const mapping = selectedWarga.value.iuranBulanan.find(
    (ib: any) => ib.jenisIuran.id === newId,
  )
  if (mapping) {
    amountPaid.value = mapping.customAmount ?? mapping.jenisIuran.defaultAmount
  }
})

const handleRecordPayment = async () => {
  if (
    !selectedWarga.value ||
    !selectedMonth.value ||
    !selectedIuranId.value ||
    amountPaid.value <= 0
  )
    return

  submitLoading.value = true
  const success = await wargaStore.payIuran(selectedWarga.value.id, {
    jenisIuranId: selectedIuranId.value,
    month: selectedMonth.value,
    year: selectedYear.value,
    amountPaid: amountPaid.value,
  })

  if (success) {
    await loadData()
    // Refresh selectedWarga reference to show updated payments list
    selectedWarga.value = wargaStore.rekapList.find(
      (w) => w.id === selectedWarga.value.id,
    )

    // Reset or update selected iuran
    const unpaid = unpaidIurans.value
    if (unpaid.length > 0) {
      selectedIuranId.value = unpaid[0].jenisIuran.id
      amountPaid.value =
        unpaid[0].customAmount ?? unpaid[0].jenisIuran.defaultAmount
    } else {
      selectedIuranId.value = ''
      amountPaid.value = 0
    }
  }
  submitLoading.value = false
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// --- WhatsApp Notification Helpers ---

// WhatsApp Preview States
const isWaPreviewOpen = ref(false)
const waPreviewText = ref('')
const waTargetPhone = ref('')
const waTargetWarga = ref<any>(null)

/**
 * Normalizes Indonesian phone number to WhatsApp international format (62xxx).
 * Returns empty string if phoneNumber is empty/null.
 */
const formatWhatsAppNumber = (phone?: string | null): string => {
  if (!phone) return ''
  // Strip all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

/**
 * Compiles custom template from tenant or default and opens Preview Dialog.
 */
const triggerWhatsAppPreview = (
  payment: any,
  warga: any,
  month: number | null,
  year: number,
) => {
  const monthName =
    monthsList.find((m) => m.value === month)?.nameFull || `Bulan ${month}`
  const paidDate = payment.paidAt
    ? formatDate(payment.paidAt)
    : new Date().toLocaleDateString('id-ID')

  const defaultTemplate = [
    `🧾 *KUITANSI PEMBAYARAN IURAN*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Nama Warga  :* {nama}`,
    `🏠 *No. Rumah   :* {houseNumber}`,
    `📅 *Periode     :* {periode}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Jenis Iuran :* {jenisIuran}`,
    `💰 *Jumlah Bayar:* {jumlah}`,
    `📆 *Tgl Bayar   :* {tglBayar}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `✅ _Pembayaran ini sah dan telah dicatat dalam sistem keuangan RT/RW._`,
    `_Terima kasih atas partisipasi Bapak/Ibu._ 🙏`,
  ].join('\n')

  const template = authStore.user?.tenant?.waReceiptTemplate || defaultTemplate

  // Replace placeholders
  const message = template
    .replace(/{nama}/g, warga.name)
    .replace(/{houseNumber}/g, warga.houseNumber)
    .replace(/{periode}/g, `${monthName} ${year}`)
    .replace(/{jenisIuran}/g, payment.jenisIuranName)
    .replace(/{jumlah}/g, formatCurrency(payment.amountPaid))
    .replace(/{tglBayar}/g, paidDate)

  waPreviewText.value = message
  waTargetPhone.value = warga.phoneNumber || ''
  waTargetWarga.value = warga
  isWaPreviewOpen.value = true
}

/**
 * Composes a WhatsApp receipt message and opens wa.me URL.
 */
const sendWhatsAppReceipt = () => {
  const encodedMessage = encodeURIComponent(waPreviewText.value)
  const phoneNumber = formatWhatsAppNumber(waTargetPhone.value)
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`

  window.open(url, '_blank', 'noopener,noreferrer')
  isWaPreviewOpen.value = false
}

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
    <template #actions>
      <div class="flex items-center gap-2">
        <Select
          v-model="selectedYear"
          placeholder="Pilih Tahun"
          :options="years"
          fluid
          class="!border-slate-200 focus:!border-violet-500 focus:!ring-violet-500/20 rounded-xl shadow-sm min-w-[120px]"
        />
      </div>
      <div class="relative flex items-center">
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
    </template>

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
          class="absolute -right-4 -bottom-4 text-violet-500/5 group-hover:scale-110 transition-transform duration-500 select-none"
        >
          <i class="pi pi-percentage text-8xl"></i>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors"
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
              class="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
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
    <div class="flex flex-wrap gap-x-6 gap-y-2.5 items-center justify-start">
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
                class="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none flex-shrink-0"
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
            <div class="text-right flex-shrink-0">
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
                    : 'bg-violet-600'
                "
                :style="{ width: `${getWargaStats(warga).percentage}%` }"
              ></div>
            </div>
          </div>

          <!-- 12 Months Mini Grid (4 columns x 3 rows) -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="m in monthsList"
              :key="m.value"
              :title="getTooltipText(warga, m.value)"
              :disabled="getMonthStatus(warga, m.value).code === 'FREE'"
              class="py-2 px-1 rounded-xl border text-center transition-all select-none font-bold text-[10px] flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 duration-150"
              :class="[
                getMonthStatus(warga, m.value).code === 'FREE'
                  ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                  : getMonthStatus(warga, m.value).code === 'UNPAID'
                    ? 'bg-rose-50 border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-600 cursor-pointer'
                    : getMonthStatus(warga, m.value).code === 'PARTIAL'
                      ? 'bg-amber-50 border-amber-100 hover:bg-amber-100 hover:border-amber-200 text-amber-600 cursor-pointer'
                      : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-600 cursor-pointer',
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
            </button>
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

  <!-- Dialog Unified Payment Info & Action -->
  <Dialog
    v-model:visible="isPaymentDialogOpen"
    :header="`Status Iuran: ${selectedWarga?.name || ''}`"
    modal
    class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Metadata Badge-like layout -->
      <div
        class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden"
      >
        <div class="absolute -right-3 -top-3 text-slate-100 select-none">
          <i class="pi pi-user-edit text-6xl"></i>
        </div>
        <div class="relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Warga & No. Rumah
          </p>
          <p class="font-bold text-slate-800 text-sm mt-0.5">
            {{ selectedWarga?.name }}
          </p>
          <p class="text-xs text-slate-500 font-mono mt-0.5">
            Rumah: No. {{ selectedWarga?.houseNumber }}
          </p>
        </div>
        <div class="text-right relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Periode Tagihan
          </p>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100 mt-1"
          >
            <i class="pi pi-calendar text-[10px]"></i>
            {{ selectedMonthName }} {{ selectedYear }}
          </span>
        </div>
      </div>

      <!-- History/List of Payments in selected month -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4
            class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none"
          >
            <i class="pi pi-check-circle text-emerald-500"></i>
            Iuran Terbayar Bulan Ini
          </h4>
          <span
            v-if="selectedWarga && selectedMonth !== null"
            class="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100"
          >
            {{ getMonthData(selectedWarga, selectedMonth).payments.length }}
            Terbayar
          </span>
        </div>

        <div v-if="selectedWarga && selectedMonth !== null">
          <div
            v-if="
              getMonthData(selectedWarga, selectedMonth).payments.length > 0
            "
            class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm"
          >
            <div
              v-for="p in getMonthData(selectedWarga, selectedMonth).payments"
              :key="p.id"
              class="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-slate-800 truncate">
                    {{ p.jenisIuranName }}
                  </p>
                  <span
                    class="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100/50 flex items-center gap-0.5"
                  >
                    <i class="pi pi-check text-[8px]"></i> Lunas
                  </span>
                </div>
                <p
                  class="text-[10px] text-slate-400 flex items-center gap-1 mt-1"
                >
                  <i class="pi pi-calendar text-[10px]"></i>
                  Tgl Bayar: {{ formatDate(p.paidAt) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <span class="text-sm font-extrabold text-slate-900">{{
                    formatCurrency(p.amountPaid)
                  }}</span>
                </div>
                <!-- WhatsApp Receipt Button (Bendahara only) -->
                <button
                  v-if="authStore.hasPermission('warga:write')"
                  :title="
                    selectedWarga?.phoneNumber
                      ? `Kirim kuitansi ke ${selectedWarga.phoneNumber}`
                      : 'Kirim kuitansi (pilih kontak manual)'
                  "
                  class="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-90 border border-emerald-100/50"
                  @click="
                    triggerWhatsAppPreview(
                      p,
                      selectedWarga,
                      selectedMonth,
                      selectedYear,
                    )
                  "
                >
                  <i class="pi pi-whatsapp text-sm"></i>
                </button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-center py-8 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2 select-none"
          >
            <i class="pi pi-inbox text-lg text-slate-300"></i>
            <span>Belum ada iuran yang terbayar di bulan ini.</span>
          </div>
        </div>
      </div>

      <!-- Payment input (Only visible to users with warga:write permission and if there are unpaid iurans) -->
      <div
        v-if="authStore.hasPermission('warga:write') && unpaidIurans.length > 0"
        class="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h4
            class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 select-none"
          >
            <i class="pi pi-plus-circle text-violet-500"></i>
            Catat Pembayaran Baru
          </h4>
          <span
            class="text-[9px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-100"
          >
            {{ unpaidIurans.length }} Belum Bayar
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Select Dues -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >Pilih Jenis Iuran</label
            >
            <Select
              v-model="selectedIuranId"
              :options="unpaidIurans"
              option-value="jenisIuran.id"
              option-label="jenisIuran.name"
              placeholder="Pilih Iuran"
              class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-violet-500 focus:!ring-violet-500/20"
            />
          </div>

          <!-- Amount Input -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >Jumlah Dibayar (Rp)</label
            >
            <InputNumber
              v-model="amountPaid"
              mode="currency"
              currency="IDR"
              locale="id-ID"
              :min="0"
              class="w-full"
              input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs shadow-sm focus:!border-violet-500 focus:!ring-violet-500/20"
            />
          </div>
        </div>

        <Button
          :loading="submitLoading"
          label="Catat Pembayaran"
          icon="pi pi-credit-card"
          size="small"
          class="w-full !py-2.5 !rounded-xl !bg-violet-600 hover:!bg-violet-700 !border-0 text-white font-bold shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all active:scale-98"
          @click="handleRecordPayment"
        />
      </div>

      <div
        v-else-if="unpaidIurans.length === 0"
        class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center flex items-center justify-center gap-2 shadow-sm select-none"
      >
        <i class="pi pi-verified text-lg text-emerald-600"></i>
        <p class="text-xs text-emerald-700 font-bold">
          Semua iuran terhubung untuk bulan ini telah dilunasi!
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4 border-t border-slate-100">
        <Button
          label="Tutup"
          severity="secondary"
          class="hover:bg-slate-100 text-slate-600 border-slate-200 !rounded-xl !py-2"
          @click="isPaymentDialogOpen = false"
        />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Preview & Edit WhatsApp Message -->
  <Dialog
    v-model:visible="isWaPreviewOpen"
    header="Pratinjau Kuitansi WhatsApp"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <!-- Target Phone Number -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >Nomor Tujuan WhatsApp</label
        >
        <div class="relative flex items-center">
          <InputText
            v-model="waTargetPhone"
            placeholder="Contoh: 08123456789"
            class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs pl-8 shadow-sm focus:!border-emerald-500 focus:!ring-emerald-500/20"
          />
          <i class="pi pi-phone absolute left-3 text-slate-400 text-xs"></i>
        </div>
        <p class="text-[9px] text-slate-400 leading-tight">
          Kosongkan nomor jika ingin memicu WhatsApp share picker manual (pilih
          kontak di aplikasi).
        </p>
      </div>

      <!-- WhatsApp Preview Mockup Window -->
      <div
        class="flex flex-col border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <!-- Mockup WhatsApp Header -->
        <div
          class="bg-[#075e54] text-white px-4 py-2.5 flex items-center gap-2.5 select-none"
        >
          <div
            class="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-white/10 flex-shrink-0"
          >
            <i class="pi pi-user text-sm text-white"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h5 class="text-xs font-bold leading-tight truncate">
              {{ waTargetWarga?.name || 'Warga' }}
            </h5>
            <p class="text-[8px] text-emerald-200 leading-none">Online</p>
          </div>
          <div class="flex gap-3 text-white/80">
            <i class="pi pi-video text-xs"></i>
            <i class="pi pi-phone text-xs"></i>
            <i class="pi pi-ellipsis-v text-xs"></i>
          </div>
        </div>

        <!-- Mockup WhatsApp Body / Chat Area -->
        <div
          class="bg-[#efeae2] p-4 min-h-[220px] flex flex-col justify-end relative overflow-y-auto"
        >
          <!-- Chat Bubble -->
          <div
            class="bg-[#dcf8c6] border border-[#c1e8a8] text-slate-800 rounded-2xl rounded-tr-none p-3 max-w-[85%] self-end shadow-sm text-[11px] font-sans whitespace-pre-wrap leading-relaxed relative"
          >
            <div
              class="absolute -right-2 top-0 border-[6px] border-transparent border-l-[#dcf8c6] border-t-[#dcf8c6]"
            ></div>

            <!-- Real editable Textarea inside the bubble so they can interact directly -->
            <textarea
              v-model="waPreviewText"
              rows="8"
              class="w-full bg-transparent border-0 resize-none p-0 focus:ring-0 focus:outline-none text-[11px] font-mono leading-relaxed text-slate-800"
              placeholder="Tulis pesan kuitansi di sini..."
            ></textarea>

            <div
              class="text-right text-[8px] text-slate-500 mt-1 flex items-center justify-end gap-1 select-none"
            >
              <span>{{
                new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }}</span>
              <i class="pi pi-check text-[8px] text-[#34b7f1]"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          label="Batal"
          severity="secondary"
          text
          class="!text-slate-500 hover:!bg-slate-100 !rounded-xl !py-2"
          @click="isWaPreviewOpen = false"
        />
        <Button
          label="Kirim ke WhatsApp"
          icon="pi pi-whatsapp"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-0 text-white font-bold !rounded-xl !py-2 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all active:scale-98"
          @click="sendWhatsAppReceipt"
        />
      </div>
    </template>
  </Dialog>
</template>
