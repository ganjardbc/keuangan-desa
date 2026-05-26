<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import StatsCards from '../components/StatsCards.vue'
import TransactionTable from '../components/TransactionTable.vue'
import TransactionForm from '../components/TransactionForm.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const financeStore = useFinanceStore()
const authStore = useAuthStore()

// Dialog states
const isDialogOpen = ref(false)
const editData = ref<any>(null)

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

      <!-- Transactions Table -->
      <TransactionTable @edit="handleEdit" @delete="handleDelete" />
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
