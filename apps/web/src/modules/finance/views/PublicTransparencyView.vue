<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../../lib/axios'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const route = useRoute()
const tenantCode = route.params.tenantCode as string

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<any>(null)

onMounted(async () => {
  try {
    const response = await api.get(`/public/transparansi/${tenantCode}`)
    data.value = response.data
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Gagal memuat transparansi keuangan desa.'
  } finally {
    loading.value = false
  }
})

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
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased p-4 sm:p-6 pb-12"
  >
    <!-- Header -->
    <div class="max-w-3xl mx-auto flex items-center gap-3 mb-8 mt-4">
      <div
        class="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
      >
        <i class="pi pi-verified text-white text-lg"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold text-slate-900 tracking-tight">
          KasKita Transparansi
        </h1>
        <p class="text-xs text-slate-500">Portal Publik Keuangan Warga</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="max-w-3xl mx-auto bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-4"
    >
      <i class="pi pi-exclamation-triangle text-rose-600 text-3xl"></i>
      <h3 class="text-base font-bold text-rose-600">Terjadi Kendala</h3>
      <p class="text-xs text-slate-500 leading-relaxed">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="loading"
      class="max-w-3xl mx-auto text-center py-20 space-y-3"
    >
      <i class="pi pi-spinner pi-spin text-violet-600 text-3xl"></i>
      <p class="text-xs text-slate-500 font-semibold tracking-wider uppercase">
        Memuat Laporan Transparansi...
      </p>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-3xl mx-auto space-y-6">
      <!-- Village Title Card -->
      <Card>
        <template #content>
          <div
            class="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-violet-500/5 blur-xl"
          ></div>
          <span
            class="text-[9px] bg-violet-50 border border-violet-100 text-violet-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest"
            >Informasi Terbuka</span
          >
          <h2 class="text-xl font-extrabold text-slate-900 mt-3 leading-tight">
            Keuangan Desa / RT {{ data.villageName }}
          </h2>
          <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Data disajikan secara langsung dari buku besar kas digital untuk
            keterbukaan informasi dan pertanggungjawaban publik.
          </p>
        </template>
      </Card>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Saldo Kas -->
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <span
                class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                >Saldo Kas Saat Ini</span
              >
              <span
                class="h-6 w-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600"
                ><i class="pi pi-wallet text-xs"></i
              ></span>
            </div>
            <p class="text-lg font-black text-slate-900 mt-3 truncate">
              {{ formatCurrency(data.stats.totalSaldo) }}
            </p>
          </template>
        </Card>

        <!-- Total Pemasukan -->
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <span
                class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                >Total Pemasukan</span
              >
              <span
                class="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600"
                ><i class="pi pi-arrow-up-right text-xs"></i
              ></span>
            </div>
            <p class="text-lg font-black text-indigo-600 mt-3 truncate">
              {{ formatCurrency(data.stats.totalPemasukan) }}
            </p>
          </template>
        </Card>

        <!-- Total Pengeluaran -->
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <span
                class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                >Total Pengeluaran</span
              >
              <span
                class="h-6 w-6 rounded bg-rose-50 flex items-center justify-center text-rose-600"
                ><i class="pi pi-arrow-down-left text-xs"></i
              ></span>
            </div>
            <p class="text-lg font-black text-rose-600 mt-3 truncate">
              {{ formatCurrency(data.stats.totalPengeluaran) }}
            </p>
          </template>
        </Card>
      </div>

      <!-- Mutasi Kas Terbaru -->
      <Card>
        <template #title>
          <div class="px-5 pt-4">
            <h3
              class="text-sm font-bold text-slate-900 uppercase tracking-wider"
            >
              Mutasi Kas Terbaru
            </h3>
            <p class="text-[10px] text-slate-500 mt-0.5">
              Daftar 15 mutasi pemasukan & pengeluaran kas paling baru
            </p>
          </div>
        </template>
        <template #content>
          <div class="divide-y divide-slate-100">
            <div
              v-for="(t, idx) in data.recentTransactions"
              :key="idx"
              class="flex items-center justify-between p-4"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="
                    t.type === 'pemasukan'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  "
                  class="p-2 rounded-lg"
                >
                  <i
                    :class="
                      t.type === 'pemasukan'
                        ? 'pi pi-arrow-up'
                        : 'pi pi-arrow-down'
                    "
                    class="text-[10px]"
                  ></i>
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-900">
                    {{ t.title }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[9px] text-slate-500 font-mono">{{
                      formatDate(t.date)
                    }}</span>
                    <span class="text-[9px] text-slate-500">•</span>
                    <Tag
                      :value="t.category"
                      severity="secondary"
                      class="!bg-slate-100 !text-slate-600 text-[8px]"
                    />
                  </div>
                </div>
              </div>
              <div class="text-right">
                <span
                  :class="
                    t.type === 'pemasukan'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  "
                  class="text-xs font-bold font-mono"
                >
                  {{ t.type === 'pemasukan' ? '+' : '-' }}
                  {{ formatCurrency(t.amount) }}
                </span>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="data.recentTransactions.length === 0"
              class="text-center p-8 text-slate-400 text-xs"
            >
              Belum ada mutasi keuangan kas tercatat.
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
