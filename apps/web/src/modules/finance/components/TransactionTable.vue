<script setup lang="ts">
import { ref } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useAuthStore } from '../../auth/stores/auth'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const financeStore = useFinanceStore()
const authStore = useAuthStore()
const first = ref(0)

const emit = defineEmits(['edit', 'delete'])

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <DataTable
    v-model:first="first"
    :value="financeStore.transactions"
    responsive-layout="scroll"
    class="w-full shadow-sm rounded-lg overflow-hidden"
    :paginator="true"
    :rows="10"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
    :rows-per-page-options="[5, 10, 20, 50]"
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

    <Column field="title" header="Transaksi" class="!border-slate-100">
      <template #body="slotProps">
        <div class="flex items-center gap-3">
          <div
            :class="
              slotProps.data.type === 'pemasukan'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            "
            class="p-2 rounded-lg"
          >
            <i
              :class="
                slotProps.data.type === 'pemasukan'
                  ? 'pi pi-arrow-up'
                  : 'pi pi-arrow-down'
              "
              class="text-xs"
            ></i>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900">
              {{ slotProps.data.title }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-slate-500">{{
                slotProps.data.date
              }}</span>
              <span
                v-if="slotProps.data.kasAccount"
                class="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold"
              >
                {{ slotProps.data.kasAccount.name }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </Column>
    <Column field="category" header="Kategori" class="!border-slate-100">
      <template #body="slotProps">
        <Tag
          :value="slotProps.data.category"
          severity="secondary"
          class="!bg-slate-100 !text-slate-600"
        />
      </template>
    </Column>
    <Column
      field="amount"
      header="Jumlah"
      class="!border-slate-100 text-right"
      header-class="text-right"
    >
      <template #body="slotProps">
        <span
          :class="
            slotProps.data.type === 'pemasukan'
              ? 'text-emerald-600'
              : 'text-rose-600'
          "
          class="text-sm font-bold"
        >
          {{ slotProps.data.type === 'pemasukan' ? '+' : '-' }}
          {{ formatCurrency(slotProps.data.amount) }}
        </span>
      </template>
    </Column>
    <!-- Action Column for Editor Only -->
    <Column
      v-if="authStore.hasPermission('transaction:create')"
      header="Aksi"
      class="!border-slate-100 text-center w-32"
      header-class="text-center"
    >
      <template #body="slotProps">
        <div class="flex items-center justify-center gap-1.5">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            size="small"
            title="Edit Transaksi"
            @click="emit('edit', slotProps.data)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            title="Hapus Transaksi"
            @click="emit('delete', slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
