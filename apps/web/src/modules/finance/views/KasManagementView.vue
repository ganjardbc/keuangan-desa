<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFinanceStore, type KasAccount } from '../stores/finance'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'

// Import new Dialog components
import KasAccountDialog from '../components/KasAccountDialog.vue'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog.vue'

const financeStore = useFinanceStore()
const authStore = useAuthStore()

// State Dialogs
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const selectedAccount = ref<KasAccount | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteAccountId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

// Luxury credit-card gradients for visual variety
const gradients = [
  'from-violet-600 to-indigo-800 shadow-indigo-500/20',
  'from-teal-600 to-emerald-800 shadow-emerald-500/20',
  'from-cyan-600 to-blue-800 shadow-blue-500/20',
  'from-rose-600 to-orange-700 shadow-rose-500/20',
]

const first = ref(0)
const rows = ref(6)

const paginatedKasAccounts = computed(() => {
  const start = first.value
  const end = first.value + rows.value
  return financeStore.kasAccounts.slice(start, end)
})

onMounted(() => {
  financeStore.fetchKasAccounts()
})

const openAddDialog = () => {
  isEditing.value = false
  currentId.value = null
  selectedAccount.value = null
  isDialogOpen.value = true
}

const openEditDialog = (account: KasAccount) => {
  isEditing.value = true
  currentId.value = account.id
  selectedAccount.value = account
  isDialogOpen.value = true
}

const handleSave = async (payload: {
  name: string
  accountNumber: string
  balance: number
}) => {
  let success = false
  if (isEditing.value && currentId.value) {
    success = await financeStore.updateKasAccount(currentId.value, payload)
  } else {
    success = await financeStore.createKasAccount(payload)
  }

  if (success) {
    isDialogOpen.value = false
  }
}

const triggerDelete = (id: string) => {
  deleteAccountId.value = id
  deleteError.value = null
  isConfirmDeleteOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteAccountId.value) return
  deleteError.value = null
  const success = await financeStore.deleteKasAccount(deleteAccountId.value)
  if (success) {
    isConfirmDeleteOpen.value = false
    deleteAccountId.value = null
  } else {
    deleteError.value = financeStore.error || 'Gagal menghapus akun kas.'
  }
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
    title="Kelola Kas & Rekening"
    description="Atur akun kas fisik dan rekening bank desa"
  >
    <template #actions>
      <Button
        v-if="authStore.hasPermission('transaction:create')"
        label="Tambah Akun Kas"
        icon="pi pi-plus"
        @click="openAddDialog"
      />
    </template>

    <!-- Cards Grid -->
    <div v-if="paginatedKasAccounts.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="(account, idx) in paginatedKasAccounts"
          :key="account.id"
          class="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br border border-white/10 flex flex-col justify-between h-48 group hover:scale-[1.02] transition-all duration-300"
          :class="gradients[(first + idx) % gradients.length]"
        >
          <!-- Background Overlay Shapes for Glassmorphism -->
          <div
            class="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5 blur-xl group-hover:scale-150 transition-all duration-500"
          ></div>
          <div
            class="absolute -left-10 -bottom-10 w-24 h-24 rounded-full bg-black/10 blur-xl"
          ></div>

          <!-- Top Content -->
          <div class="flex items-start justify-between z-10">
            <div class="flex-1">
              <p
                class="text-xs text-white/70 uppercase tracking-widest font-semibold"
              >
                Akun Kas
              </p>
              <h3
                class="text-lg font-bold mt-1 tracking-wide truncate max-w-[15rem]"
              >
                {{ account.name }}
              </h3>
            </div>
            <div
              class="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"
            >
              <i class="pi pi-wallet text-white text-md"></i>
            </div>
          </div>

          <!-- Middle Content (Account Number) -->
          <div class="z-10 mt-2">
            <p class="text-xs font-mono tracking-widest text-white/60">
              {{ account.accountNumber || '•••• •••• ••••' }}
            </p>
          </div>

          <!-- Bottom Content -->
          <div class="flex items-end justify-between z-10 mt-4">
            <div>
              <p class="text-[10px] text-white/50 uppercase tracking-wider">
                Saldo Terkini
              </p>
              <p class="text-xl font-extrabold tracking-tight">
                {{ formatCurrency(account.balance) }}
              </p>
            </div>

            <!-- Edit & Delete Buttons (Editor Only) -->
            <div
              v-if="authStore.hasPermission('transaction:create')"
              class="flex gap-1.5"
            >
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                title="Edit Akun"
                @click.stop="openEditDialog(account)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                title="Hapus Akun"
                @click.stop="triggerDelete(account.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Paginator
        v-model:first="first"
        v-model:rows="rows"
        :total-records="financeStore.kasAccounts.length"
        :rows-per-page-options="[3, 6, 9, 12]"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        class="mt-6 !bg-transparent !border-0"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500"
    >
      <i class="pi pi-wallet text-4xl mb-3 block text-slate-400"></i>
      Belum ada akun kas atau rekening terdaftar.
    </div>
  </TemplateList>

  <!-- Kas Account Dialog -->
  <KasAccountDialog
    v-model:visible="isDialogOpen"
    :is-editing="isEditing"
    :account="selectedAccount"
    @save="handleSave"
  />

  <!-- Confirm Delete Dialog -->
  <ConfirmDeleteDialog
    v-model:visible="isConfirmDeleteOpen"
    :error-message="deleteError"
    @confirm="confirmDelete"
  />
</template>
