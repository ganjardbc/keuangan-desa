<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

defineProps<{
  project: any
}>()

const visible = defineModel<boolean>('visible', { default: false })

const first = ref(0)

const getPercentSpent = (p: any) => {
  if (!p || p.budgetLimit <= 0) return 0
  return Math.min(100, Math.round((p.spent / p.budgetLimit) * 100))
}

const getProgressBarColor = (percent: number) => {
  if (percent < 70) return 'bg-emerald-500'
  if (percent < 90) return 'bg-amber-500'
  return 'bg-rose-500'
}

const getStatusSeverity = (statusVal: string) => {
  switch (statusVal) {
    case 'PERENCANAAN':
      return 'secondary'
    case 'BERJALAN':
      return 'info'
    case 'SELESAI':
      return 'success'
    default:
      return 'secondary'
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

const formatDate = (dateVal?: string) => {
  if (!dateVal) return '-'
  return new Date(dateVal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="project?.name || 'Detail Kegiatan'"
    modal
    class="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div v-if="project" class="space-y-6 pt-4">
      <!-- Budget serapan statistics card -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
          >
            Anggaran RAB
          </p>
          <p class="text-base font-extrabold text-slate-900 mt-1">
            {{ formatCurrency(project.budgetLimit) }}
          </p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold"
          >
            Aktual Belanja
          </p>
          <p class="text-base font-extrabold text-rose-600 mt-1">
            {{ formatCurrency(project.spent) }}
          </p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p
            class="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold"
          >
            Sisa Anggaran
          </p>
          <p class="text-base font-extrabold text-emerald-600 mt-1">
            {{ formatCurrency(project.remaining) }}
          </p>
        </div>
      </div>

      <!-- Progress status -->
      <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Status Serapan:</span>
            <Tag
              :value="project.status"
              :severity="getStatusSeverity(project.status)"
              class="text-[8px] font-bold"
            />
          </div>
          <span class="text-slate-600 font-mono text-[11px]"
            >{{ formatDate(project.startDate) }} s.d.
            {{ formatDate(project.endDate) }}</span
          >
        </div>

        <!-- Progress Bar inside dialog -->
        <div
          class="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="getProgressBarColor(getPercentSpent(project))"
            :style="{
              width: getPercentSpent(project) + '%',
            }"
          ></div>
        </div>
      </div>

      <!-- Mapped Dues / Transaction History List -->
      <div>
        <p
          class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
        >
          Daftar Pengeluaran Terikat:
        </p>

        <DataTable
          v-model:first="first"
          :value="project.transactions"
          responsive-layout="scroll"
          class="w-full text-left"
          table-style="min-width: 30rem"
          empty-message="Belum ada transaksi pengeluaran terikat ke proyek ini."
        >
          <!-- No. Column -->
          <Column
            header="No."
            class="!border-slate-100 !p-3 w-12 text-center text-xs font-semibold text-slate-500"
          >
            <template #body="slotProps">
              {{ first + slotProps.index + 1 }}
            </template>
          </Column>

          <Column
            field="title"
            header="Transaksi"
            class="!border-slate-100 !p-3"
          >
            <template #body="slotProps">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ slotProps.data.title }}
                </p>
                <p class="text-[10px] text-slate-500">
                  {{ slotProps.data.date }}
                </p>
              </div>
            </template>
          </Column>
          <Column
            field="category"
            header="Kategori"
            class="!border-slate-100 !p-3"
          >
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.category"
                severity="secondary"
                class="!bg-slate-100 !text-slate-600 text-[9px]"
              />
            </template>
          </Column>
          <Column
            field="amount"
            header="Jumlah"
            class="!border-slate-100 text-right !p-3"
            header-class="text-right"
          >
            <template #body="slotProps">
              <span class="text-sm font-bold text-rose-600">
                - {{ formatCurrency(slotProps.data.amount) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <Button label="Tutup" severity="secondary" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>
