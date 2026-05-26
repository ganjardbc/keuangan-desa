<script setup lang="ts">
import { useFinanceStore } from '../stores/finance'
import Card from 'primevue/card'

const financeStore = useFinanceStore()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Saldo Kas -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-600"
            >Total Saldo Kas</span
          >
          <span class="p-2 rounded-lg bg-violet-50 text-violet-600">
            <i class="pi pi-briefcase text-lg"></i>
          </span>
        </div>
        <p class="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
          {{ formatCurrency(financeStore.totalSaldo) }}
        </p>
        <span class="text-xs text-slate-500 mt-2 block"
          >Akumulasi saldo tunai & bank</span
        >
      </template>
    </Card>

    <!-- Pemasukan -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-600"
            >Total Pemasukan</span
          >
          <span class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <i class="pi pi-arrow-up text-lg"></i>
          </span>
        </div>
        <p class="text-3xl font-extrabold text-emerald-600 mt-4 tracking-tight">
          {{ formatCurrency(financeStore.totalPemasukan) }}
        </p>
        <span class="text-xs text-slate-500 mt-2 block"
          >Total pemasukan bulan ini</span
        >
      </template>
    </Card>

    <!-- Pengeluaran -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-600"
            >Total Pengeluaran</span
          >
          <span class="p-2 rounded-lg bg-rose-50 text-rose-600">
            <i class="pi pi-arrow-down text-lg"></i>
          </span>
        </div>
        <p class="text-3xl font-extrabold text-rose-600 mt-4 tracking-tight">
          {{ formatCurrency(financeStore.totalPengeluaran) }}
        </p>
        <span class="text-xs text-slate-500 mt-2 block"
          >Total pengeluaran bulan ini</span
        >
      </template>
    </Card>
  </section>
</template>
