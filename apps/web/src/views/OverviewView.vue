<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../modules/auth/stores/auth'
import { useFinanceStore } from '../modules/finance/stores/finance'
import { useWargaStore } from '../modules/warga/stores/warga'
import StatsCards from '../modules/finance/components/StatsCards.vue'
import TemplateList from '../components/TemplateList.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Chart from 'primevue/chart'

const authStore = useAuthStore()
const financeStore = useFinanceStore()
const wargaStore = useWargaStore()
const router = useRouter()

// Print Dialog State
const isPrintDialogOpen = ref(false)
const printMonth = ref(new Date().getMonth() + 1)
const printYear = ref(new Date().getFullYear())

const months = [
  { value: 1, name: 'Januari' },
  { value: 2, name: 'Februari' },
  { value: 3, name: 'Maret' },
  { value: 4, name: 'April' },
  { value: 5, name: 'Mei' },
  { value: 6, name: 'Juni' },
  { value: 7, name: 'Juli' },
  { value: 8, name: 'Agustus' },
  { value: 9, name: 'September' },
  { value: 10, name: 'Oktober' },
  { value: 11, name: 'November' },
  { value: 12, name: 'Desember' },
]
const years = [2024, 2025, 2026, 2027, 2028]

onMounted(() => {
  financeStore.fetchTransactions()
  financeStore.fetchStats()
  wargaStore.fetchWarga()
})

const handlePrint = () => {
  isPrintDialogOpen.value = false
  router.push({
    path: '/dashboard/print-report',
    query: {
      month: printMonth.value,
      year: printYear.value,
    },
  })
}

// Helper to format currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

// --- Chart Data Computations ---

// 1. Monthly Income vs Expenses (Bar Chart)
const barChartData = computed(() => {
  const txs = financeStore.transactions

  // Group by month for current year
  const currentYear = new Date().getFullYear()
  const monthlyIn = Array(12).fill(0)
  const monthlyOut = Array(12).fill(0)

  txs.forEach((t) => {
    if (!t.date) return
    const dateObj = new Date(t.date)
    if (dateObj.getFullYear() === currentYear) {
      const month = dateObj.getMonth() // 0-11
      if (t.type.toLowerCase() === 'pemasukan') {
        monthlyIn[month] += t.amount
      } else {
        monthlyOut[month] += t.amount
      }
    }
  })

  // Get active months (months that have data or the last 6 months)
  const labels = months.map((m) => m.name)

  return {
    labels,
    datasets: [
      {
        label: 'Pemasukan',
        backgroundColor: '#8b5cf6', // violet-500
        borderColor: '#8b5cf6',
        data: monthlyIn,
        borderRadius: 8,
      },
      {
        label: 'Pengeluaran',
        backgroundColor: '#f43f5e', // rose-500
        borderColor: '#f43f5e',
        data: monthlyOut,
        borderRadius: 8,
      },
    ],
  }
})

// 2. Kategori Pengeluaran & Pemasukan (Doughnut Chart)
const doughnutChartData = computed(() => {
  const txs = financeStore.transactions
  const categoryMap: { [key: string]: number } = {}

  txs.forEach((t) => {
    const cat = t.category || 'Lain-lain'
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount
  })

  const labels = Object.keys(categoryMap)
  const data = Object.values(categoryMap)

  // Color palette for categories
  const colors = [
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f59e0b', // amber-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
  ]

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, labels.length),
        hoverBackgroundColor: colors.slice(0, labels.length),
      },
    ],
  }
})

// Chart Options
const barChartOptions = {
  maintainAspectRatio: false,
  aspectRatio: 0.8,
  plugins: {
    legend: {
      labels: {
        color: '#475569',
        font: { family: 'Inter', weight: '600', size: 12 },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { family: 'Inter' } },
      grid: { display: false },
    },
    y: {
      ticks: { color: '#64748b', font: { family: 'Inter' } },
      grid: { color: '#f1f5f9' },
    },
  },
}

const doughnutChartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#475569',
        font: { family: 'Inter', weight: '500', size: 11 },
      },
    },
  },
}

// Summary Metrics
const totalWargaCount = computed(() => wargaStore.wargaList.length)
const activeWargaCount = computed(
  () => wargaStore.wargaList.filter((w) => w.isActive).length,
)
</script>

<template>
  <TemplateList
    title="Analitik & Ringkasan Keuangan"
    description="Visualisasi statistik pemasukan, pengeluaran, dan kas desa terkini"
  >
    <template #actions>
      <Button
        label="Kelola Transaksi"
        icon="pi pi-list"
        @click="router.push('/dashboard/transactions')"
      />
      <Button
        v-if="authStore.hasPermission('report:export')"
        label="Cetak Laporan"
        icon="pi pi-print"
        severity="secondary"
        @click="isPrintDialogOpen = true"
      />
    </template>

    <div class="space-y-6">
      <!-- Modular Stats Section -->
      <StatsCards />

      <!-- Chart Analytics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Monthly Bar Chart (Span 2) -->
        <div
          class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 class="text-sm font-bold text-slate-900 mb-1">
              Tren Kas Bulanan ({{ new Date().getFullYear() }})
            </h3>
            <p class="text-[11px] text-slate-500 mb-4">
              Perbandingan total pemasukan dan pengeluaran warga per bulan.
            </p>
          </div>
          <div class="h-80 w-full">
            <Chart
              type="bar"
              :data="barChartData"
              :options="barChartOptions"
              class="h-full w-full"
            />
          </div>
        </div>

        <!-- Kategori Doughnut Chart (Span 1) -->
        <div
          class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 class="text-sm font-bold text-slate-900 mb-1">
              Porsi Kategori Keuangan
            </h3>
            <p class="text-[11px] text-slate-500 mb-4">
              Distribusi alokasi dana berdasarkan kategori transaksi.
            </p>
          </div>
          <div class="h-64 w-full flex items-center justify-center">
            <Chart
              type="doughnut"
              :data="doughnutChartData"
              :options="doughnutChartOptions"
              class="h-full w-full"
            />
          </div>
        </div>
      </div>

      <!-- Quick Stats Summary Table -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"
        >
          <div
            class="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg"
          >
            <i class="pi pi-users"></i>
          </div>
          <div class="flex-1 w-full overflow-hidden">
            <p
              class="text-[10px] text-slate-400 uppercase font-bold tracking-wider"
            >
              Total Warga Terdaftar
            </p>
            <h4 class="text-xl font-bold text-slate-900 mt-0.5">
              {{ totalWargaCount }} Jiwa
            </h4>
            <p
              class="text-xs text-emerald-500 font-semibold mt-0.5 flex items-center"
            >
              <i class="pi pi-check-circle text-xs mr-2"></i
              >{{ activeWargaCount }} Aktif
            </p>
          </div>
        </div>

        <div
          class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"
        >
          <div
            class="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg"
          >
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="flex-1 w-full overflow-hidden">
            <p
              class="text-[10px] text-slate-400 uppercase font-bold tracking-wider"
            >
              Rasio Pemasukan
            </p>
            <h4 class="text-xl font-bold text-slate-900 mt-0.5">
              {{
                financeStore.totalPemasukan
                  ? Math.round(
                      (financeStore.totalPemasukan /
                        (financeStore.totalPemasukan +
                          financeStore.totalPengeluaran)) *
                        100,
                    )
                  : 0
              }}%
            </h4>
            <p class="text-[10px] text-slate-500 mt-0.5">
              Dari total perputaran kas desa
            </p>
          </div>
        </div>

        <div
          class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"
        >
          <div
            class="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg"
          >
            <i class="pi pi-info-circle"></i>
          </div>
          <div class="flex-1 w-full overflow-hidden">
            <p
              class="text-[10px] text-slate-400 uppercase font-bold tracking-wider"
            >
              Mutasi Terakhir
            </p>
            <h4 class="text-sm font-bold text-slate-900 mt-1 truncate">
              {{
                financeStore.transactions[0]
                  ? financeStore.transactions[0].title
                  : 'Belum ada transaksi'
              }}
            </h4>
            <p class="text-[10px] text-slate-500 mt-0.5">
              {{
                financeStore.transactions[0]
                  ? `${financeStore.transactions[0].type === 'pemasukan' ? '+' : '-'} ${formatCurrency(financeStore.transactions[0].amount)}`
                  : '-'
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </TemplateList>

  <!-- Dialog Cetak Laporan -->
  <Dialog
    v-model:visible="isPrintDialogOpen"
    header="Cetak Laporan Bulanan"
    modal
    class="w-full max-w-sm bg-white border border-slate-200 rounded-2xl text-slate-900 animate-fade-in"
  >
    <div class="space-y-4 pt-4">
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Pilih Bulan</label
        >
        <Select
          v-model="printMonth"
          :options="months"
          option-value="value"
          option-label="name"
          placeholder="Pilih Bulan"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Pilih Tahun</label
        >
        <Select
          v-model="printYear"
          :options="years"
          placeholder="Pilih Tahun"
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
          @click="isPrintDialogOpen = false"
        />
        <Button label="Cetak" icon="pi pi-print" @click="handlePrint" />
      </div>
    </template>
  </Dialog>
</template>
