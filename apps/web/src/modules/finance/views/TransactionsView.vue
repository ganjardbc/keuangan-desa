<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import StatsCards from '../components/StatsCards.vue'
import TransactionForm from '../components/TransactionForm.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'

const financeStore = useFinanceStore()
const authStore = useAuthStore()

// Dialog states
const isDialogOpen = ref(false)
const editData = ref<any>(null)

// Filter & pagination states
const searchQuery = ref('')
const selectedType = ref('semua')
const selectedCategory = ref('Semua Kategori')
const first = ref(0)
const rows = ref(10)

const types = [
  { label: 'Semua Transaksi', value: 'semua' },
  { label: 'Pemasukan (Kas Masuk)', value: 'pemasukan' },
  { label: 'Pengeluaran (Kas Keluar)', value: 'pengeluaran' },
]

// Extract unique categories dynamically
const categories = computed(() => {
  const cats = new Set(financeStore.transactions.map((t) => t.category))
  return ['Semua Kategori', ...Array.from(cats)]
})

// Filter logic
const filteredTransactions = computed(() => {
  return financeStore.transactions.filter((tx) => {
    const matchesSearch =
      !searchQuery.value ||
      tx.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType =
      selectedType.value === 'semua' || tx.type === selectedType.value
    const matchesCategory =
      selectedCategory.value === 'Semua Kategori' ||
      tx.category === selectedCategory.value

    return matchesSearch && matchesType && matchesCategory
  })
})

// Paginated slice
const paginatedTransactions = computed(() => {
  const start = first.value
  const end = first.value + rows.value
  return filteredTransactions.value.slice(start, end)
})

// Reset pagination on filter changes
watch([searchQuery, selectedType, selectedCategory], () => {
  first.value = 0
})

onMounted(() => {
  financeStore.fetchTransactions()
  financeStore.fetchStats()
})

const openAddDialog = () => {
  editData.value = null
  isDialogOpen.value = true
}

const handleEdit = (tx: any) => {
  editData.value = tx
  isDialogOpen.value = true
}

const handleDelete = async (tx: any) => {
  if (
    confirm(
      `Apakah Anda yakin ingin menghapus transaksi "${tx.title}"? Saldo kas akan disesuaikan otomatis.`,
    )
  ) {
    await financeStore.deleteTransaction(tx.id)
  }
}

const handleSaved = () => {
  isDialogOpen.value = false
  editData.value = null
}

const resetFilter = () => {
  searchQuery.value = ''
  selectedType.value = 'semua'
  selectedCategory.value = 'Semua Kategori'
  first.value = 0
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
  <TemplateList
    title="Kelola Kas & Transaksi"
    description="Pencatatan mutasi kas masuk, kas keluar, dan detail penyesuaian"
  >
    <template #actions>
      <Button
        v-if="authStore.hasPermission('transaction:create')"
        label="Catat Transaksi"
        icon="pi pi-plus"
        @click="openAddDialog"
      />
    </template>
    <div class="space-y-6">
      <!-- Stats Cards Summary -->
      <StatsCards />

      <!-- Filter Panel -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      >
        <div class="relative flex items-center flex-1">
          <InputGroup>
            <InputText
              v-model="searchQuery"
              placeholder="Cari transaksi..."
              fluid
            />
            <InputGroupAddon>
              <i class="pi pi-search text-slate-400" />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <!-- Type Filter -->
          <Select
            v-model="selectedType"
            :options="types"
            option-label="label"
            option-value="value"
            placeholder="Pilih Tipe"
            class="!border-slate-200 focus:!border-violet-500 focus:!ring-violet-500/20 rounded-xl shadow-sm min-w-[160px]"
          />

          <!-- Category Filter -->
          <Select
            v-model="selectedCategory"
            :options="categories"
            placeholder="Pilih Kategori"
            class="!border-slate-200 focus:!border-violet-500 focus:!ring-violet-500/20 rounded-xl shadow-sm min-w-[160px]"
          />
        </div>
      </div>

      <!-- Skeleton Loading cards while fetching -->
      <div v-if="financeStore.loading" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse flex items-center justify-between p-4 gap-4 shadow-xs"
        >
          <div class="flex items-center gap-4 flex-1">
            <div class="h-10 w-10 bg-slate-200 rounded-xl"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-1/3"></div>
              <div class="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-5 bg-slate-200 rounded w-24"></div>
        </div>
      </div>

      <!-- Transaction Card List -->
      <div v-else-if="filteredTransactions.length > 0" class="space-y-3">
        <div
          v-for="tx in paginatedTransactions"
          :key="tx.id"
          class="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 gap-4"
        >
          <!-- Icon & Content details -->
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <div
              :class="
                tx.type === 'pemasukan'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                  : 'bg-rose-50 text-rose-600 border border-rose-100/50'
              "
              class="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <i
                :class="
                  tx.type === 'pemasukan'
                    ? 'pi pi-arrow-down-left'
                    : 'pi pi-arrow-up-right'
                "
                class="text-sm font-bold"
              ></i>
            </div>
            <div class="min-w-0 overflow-hidden">
              <p
                class="text-sm font-bold text-slate-800 line-clamp-1"
                :title="tx.title"
              >
                {{ tx.title }}
              </p>
              <div
                class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500"
              >
                <span class="flex items-center gap-1 select-none">
                  <i class="pi pi-calendar text-[9px]"></i>
                  {{ tx.date }}
                </span>
                <span v-if="tx.kasAccount" class="flex items-center gap-1">
                  <i class="pi pi-wallet text-[9px]"></i>
                  {{ tx.kasAccount.name }}
                </span>
                <span
                  class="flex items-center gap-1 font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/50 select-none"
                >
                  <i class="pi pi-tag text-[8px]"></i>
                  {{ tx.category }}
                </span>
              </div>
            </div>
          </div>

          <!-- Amount & Actions -->
          <div
            class="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-50"
          >
            <span
              :class="
                tx.type === 'pemasukan' ? 'text-emerald-650' : 'text-rose-600'
              "
              class="text-sm font-extrabold tracking-tight select-none"
            >
              {{ tx.type === 'pemasukan' ? '+' : '-' }}
              {{ formatCurrency(tx.amount) }}
            </span>

            <!-- Actions -->
            <div
              v-if="authStore.hasPermission('transaction:create')"
              class="flex gap-1.5 flex-shrink-0"
            >
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                size="small"
                title="Edit Transaksi"
                @click="handleEdit(tx)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                title="Hapus Transaksi"
                @click="handleDelete(tx)"
              />
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <Paginator
          v-model:first="first"
          v-model:rows="rows"
          :total-records="filteredTransactions.length"
          :rows-per-page-options="[5, 10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          class="mt-6 !bg-transparent !border-0"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-slate-100 rounded-2xl shadow-sm animate-fade-in"
      >
        <div
          class="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 select-none"
        >
          <i class="pi pi-search text-2xl"></i>
        </div>
        <h3 class="text-sm font-semibold text-slate-900">
          Transaksi tidak ditemukan
        </h3>
        <p class="text-xs text-slate-500 mt-1 max-w-xs">
          Tidak ada catatan mutasi kas yang cocok dengan kriteria filter Anda.
          Coba reset pencarian atau ganti kategori.
        </p>
        <Button
          v-if="
            searchQuery ||
            selectedType !== 'semua' ||
            selectedCategory !== 'Semua Kategori'
          "
          label="Reset Filter"
          severity="secondary"
          size="small"
          class="mt-4 cursor-pointer rounded-xl"
          @click="resetFilter"
        />
      </div>
    </div>
  </TemplateList>

  <!-- Unified Dialog Form -->
  <Dialog
    v-model:visible="isDialogOpen"
    :header="editData ? 'Ubah Transaksi' : 'Catat Transaksi Baru'"
    modal
    :dismissable-mask="true"
    class="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl text-slate-900 animate-fade-in"
  >
    <TransactionForm
      :edit-data="editData"
      @saved="handleSaved"
      @cancel="isDialogOpen = false"
    />
  </Dialog>
</template>
