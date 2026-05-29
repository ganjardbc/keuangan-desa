<script setup lang="ts">
import Dialog from 'primevue/dialog'
import TransactionForm from './TransactionForm.vue'

defineProps<{
  editData: any
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const handleSaved = () => {
  visible.value = false
  emit('saved')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="editData ? 'Ubah Transaksi' : 'Catat Transaksi Baru'"
    modal
    :dismissable-mask="true"
    class="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl text-slate-900 animate-fade-in"
  >
    <TransactionForm
      :edit-data="editData"
      @saved="handleSaved"
      @cancel="visible = false"
    />
  </Dialog>
</template>
