<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const financeStore = useFinanceStore()
const authStore = useAuthStore()

const monthNum = parseInt(route.query.month as string, 10)
const yearNum = parseInt(route.query.year as string, 10)
const readyToPrint = ref(false)

const monthsFull = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]
const monthName = monthsFull[monthNum - 1]

onMounted(async () => {
  await financeStore.fetchTransactions()
  readyToPrint.value = true

  // Set up listeners to redirect after print dialog is closed
  window.addEventListener('afterprint', goBack)

  // Trigger print after rendering
  setTimeout(() => {
    window.print()
  }, 800)
})

const goBack = () => {
  window.removeEventListener('afterprint', goBack)
  router.push('/dashboard/overview')
}

const triggerPrint = () => {
  window.print()
}

const tenantName = computed(() => {
  const user = authStore.user as any
  return user?.tenant?.name || 'KasKita Komunitas'
})

const tenantAddress = computed(() => {
  const user = authStore.user as any
  return user?.tenant?.address || 'Kecamatan Setempat'
})

// Filtered transactions for report
const reportTransactions = computed(() => {
  return financeStore.transactions.filter((t) => {
    if (!t.date) return false
    const parts = t.date.split('-') // YYYY-MM-DD
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    return m === monthNum && y === yearNum
  })
})

const totalPemasukan = computed(() => {
  return reportTransactions.value
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalPengeluaran = computed(() => {
  return reportTransactions.value
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0)
})

const saldoKas = computed(() => {
  return totalPemasukan.value - totalPengeluaran.value
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
  const parts = dateStr.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
</script>

<template>
  <div
    class="print-container bg-white text-black min-h-screen p-8 sm:p-12 max-w-4xl mx-auto border border-slate-200 print:border-none print:p-0"
  >
    <!-- Non-Printable Action Bar -->
    <div
      class="no-print flex items-center justify-between mb-8 pb-4 border-b border-slate-250"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-print text-slate-500"></i>
        <span class="text-xs text-slate-500 font-semibold"
          >Tinjauan Laporan Keuangan (Printer-Friendly)</span
        >
      </div>
      <div class="flex items-center gap-2">
        <Button
          label="Kembali ke Dashboard"
          severity="secondary"
          text
          size="small"
          @click="goBack"
        />
        <Button
          label="Cetak Ulang"
          icon="pi pi-print"
          size="small"
          @click="triggerPrint"
        />
      </div>
    </div>

    <!-- Printable Area -->
    <div class="space-y-8 font-serif">
      <!-- Kop Surat Resmi -->
      <div class="text-center border-b-4 border-double border-black pb-4">
        <h1 class="text-lg font-bold uppercase tracking-wide">
          Laporan Pertanggungjawaban Kas Keuangan
        </h1>
        <div
          v-if="authStore.user?.tenant?.pdfHeaderTemplate"
          class="text-sm font-semibold whitespace-pre-line mt-2 leading-relaxed"
        >
          {{ authStore.user.tenant.pdfHeaderTemplate }}
        </div>
        <div v-else>
          <h2 class="text-xl font-black uppercase tracking-wider mt-1">
            {{ tenantName }}
          </h2>
          <p class="text-xs italic mt-0.5">Alamat: {{ tenantAddress }}</p>
        </div>
      </div>

      <!-- Report Metadata -->
      <div class="flex justify-between items-end text-sm">
        <div>
          <p>
            <span class="font-bold">Periode Laporan:</span> {{ monthName }}
            {{ yearNum }}
          </p>
          <p>
            <span class="font-bold">Dibuat Oleh:</span>
            {{ authStore.user?.name }} (Bendahara)
          </p>
        </div>
        <div class="text-right">
          <p>
            <span class="font-bold">Tanggal Cetak:</span>
            {{
              new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            }}
          </p>
        </div>
      </div>

      <!-- Financial Ledger Table -->
      <table class="w-full border-collapse border border-black text-xs">
        <thead>
          <tr class="bg-slate-100 text-center font-bold">
            <th class="border border-black p-2 w-8">No</th>
            <th class="border border-black p-2 w-24">Tanggal</th>
            <th class="border border-black p-2">Keterangan / Uraian</th>
            <th class="border border-black p-2 w-28">Kategori</th>
            <th class="border border-black p-2 w-28 text-right">
              Pemasukan (Rp)
            </th>
            <th class="border border-black p-2 w-28 text-right">
              Pengeluaran (Rp)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in reportTransactions" :key="t.id">
            <td class="border border-black p-2 text-center">{{ idx + 1 }}</td>
            <td class="border border-black p-2 text-center font-mono">
              {{ formatDate(t.date) }}
            </td>
            <td class="border border-black p-2">{{ t.title }}</td>
            <td class="border border-black p-2 text-center">
              {{ t.category }}
            </td>
            <td class="border border-black p-2 text-right font-mono">
              {{ t.type === 'pemasukan' ? formatCurrency(t.amount) : '-' }}
            </td>
            <td class="border border-black p-2 text-right font-mono">
              {{ t.type === 'pengeluaran' ? formatCurrency(t.amount) : '-' }}
            </td>
          </tr>
          <tr v-if="reportTransactions.length === 0">
            <td
              colspan="6"
              class="border border-black p-6 text-center italic text-slate-500"
            >
              Tidak ada data transaksi keuangan tercatat untuk periode ini.
            </td>
          </tr>
          <!-- Summary Rows -->
          <tr class="font-bold bg-slate-50">
            <td
              colspan="4"
              class="border border-black p-2 text-right uppercase"
            >
              Total Pemasukan Bulan Ini
            </td>
            <td class="border border-black p-2 text-right font-mono">
              {{ formatCurrency(totalPemasukan) }}
            </td>
            <td class="border border-black p-2 text-center font-mono">-</td>
          </tr>
          <tr class="font-bold bg-slate-50">
            <td
              colspan="4"
              class="border border-black p-2 text-right uppercase"
            >
              Total Pengeluaran Bulan Ini
            </td>
            <td class="border border-black p-2 text-center font-mono">-</td>
            <td class="border border-black p-2 text-right font-mono">
              {{ formatCurrency(totalPengeluaran) }}
            </td>
          </tr>
          <tr class="font-bold bg-slate-100">
            <td
              colspan="4"
              class="border border-black p-2 text-right uppercase"
            >
              Sisa / Saldo Bersih Bulanan
            </td>
            <td
              colspan="2"
              class="border border-black p-2 text-right font-mono"
              :class="saldoKas >= 0 ? 'text-black' : 'text-rose-700'"
            >
              {{ formatCurrency(saldoKas) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures Block -->
      <div class="grid grid-cols-2 gap-8 text-center pt-8 text-sm">
        <div class="space-y-16">
          <p>Mengetahui,<br /><span class="font-bold">Ketua RT / RW</span></p>
          <div>
            <p class="border-b border-black w-48 mx-auto"></p>
            <p class="text-xs text-slate-500 mt-1">Nama Jelas & Tanda Tangan</p>
          </div>
        </div>
        <div class="space-y-16">
          <p>
            Dilaporkan Oleh,<br /><span class="font-bold"
              >Bendahara Desa / RT</span
            >
          </p>
          <div>
            <p class="border-b border-black w-48 mx-auto font-bold">
              {{ authStore.user?.name }}
            </p>
            <p class="text-xs text-slate-500 mt-1">Bendahara KasKita</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-container {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    background: white !important;
    color: black !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
}
</style>
