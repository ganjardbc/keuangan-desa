<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'

const props = defineProps<{
  isEditing: boolean
  account: any
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: { name: string; accountNumber: string; balance: number },
  ): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const name = ref('')
const accountNumber = ref('')
const balance = ref<number | null>(0)

watch(
  [() => props.account, () => props.isEditing, visible],
  ([newAccount, newIsEditing, isOpen]) => {
    if (!isOpen) return
    if (newIsEditing && newAccount) {
      name.value = newAccount.name
      accountNumber.value = newAccount.accountNumber || ''
      balance.value = newAccount.balance
    } else {
      name.value = ''
      accountNumber.value = ''
      balance.value = 0
    }
  },
  { immediate: true },
)

const handleSaveSubmit = () => {
  if (!name.value) return
  emit('save', {
    name: name.value,
    accountNumber: accountNumber.value,
    balance: balance.value ?? 0,
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Edit Akun Kas' : 'Tambah Akun Kas Baru'"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <!-- Nama Akun Kas -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Akun Kas / Bank</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Bank Mandiri RT, Kas Tunai Bendahara"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Nomor Rekening -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nomor Rekening / Catatan (Opsional)</label
        >
        <InputText
          v-model="accountNumber"
          placeholder="Contoh: 123-00-123456-7 atau Kas Box"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
        />
      </div>

      <!-- Saldo Awal -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Saldo (Rp)</label
        >
        <InputNumber
          v-model="balance"
          placeholder="Contoh: 500000"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          :min="0"
          class="w-full"
          input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
        <p class="text-[10px] text-amber-600 leading-relaxed font-semibold">
          * Perhatian: Mengubah nominal saldo di sini akan merubah total kas
          secara langsung di luar pencatatan mutasi transaksi.
        </p>
      </div>
    </div>

    <!-- Footer Action -->
    <template #footer>
      <div class="flex items-center gap-3 justify-end mt-6">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="visible = false"
        />
        <Button label="Simpan" @click="handleSaveSubmit" />
      </div>
    </template>
  </Dialog>
</template>
