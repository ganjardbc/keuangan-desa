<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinanceStore, type KasAccount } from '../stores/finance'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'

const financeStore = useFinanceStore()
const authStore = useAuthStore()

// State Dialog
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)

// Confirm Delete State
const isConfirmDeleteOpen = ref(false)
const deleteAccountId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

// State Form
const name = ref('')
const accountNumber = ref('')
const balance = ref<number | null>(0)

// Luxury credit-card gradients for visual variety
const gradients = [
  'from-violet-600 to-indigo-800 shadow-indigo-500/20',
  'from-teal-600 to-emerald-800 shadow-emerald-500/20',
  'from-cyan-600 to-blue-800 shadow-blue-500/20',
  'from-rose-600 to-orange-700 shadow-rose-500/20',
]

onMounted(() => {
  financeStore.fetchKasAccounts()
})

const openAddDialog = () => {
  isEditing.value = false
  currentId.value = null
  name.value = ''
  accountNumber.value = ''
  balance.value = 0
  isDialogOpen.value = true
}

const openEditDialog = (account: KasAccount) => {
  isEditing.value = true
  currentId.value = account.id
  name.value = account.name
  accountNumber.value = account.accountNumber || ''
  balance.value = account.balance
  isDialogOpen.value = true
}

const handleSave = async () => {
  if (!name.value) return

  const payload = {
    name: name.value,
    accountNumber: accountNumber.value || undefined,
    balance: balance.value ?? 0,
  }

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
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="(account, idx) in financeStore.kasAccounts"
        :key="account.id"
        class="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br border border-white/10 flex flex-col justify-between h-48 group hover:scale-[1.02] transition-all duration-300"
        :class="gradients[idx % gradients.length]"
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
            class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

      <!-- Empty State -->
      <div
        v-if="financeStore.kasAccounts.length === 0"
        class="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500"
      >
        <i class="pi pi-wallet text-4xl mb-3 block text-slate-400"></i>
        Belum ada akun kas atau rekening terdaftar.
      </div>
    </div>
  </TemplateList>

  <!-- Dialog Add/Edit Account -->
  <Dialog
    v-model:visible="isDialogOpen"
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
          @click="isDialogOpen = false"
        />
        <Button label="Simpan" @click="handleSave" />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Konfirmasi Hapus -->
  <Dialog
    v-model:visible="isConfirmDeleteOpen"
    header="Konfirmasi Hapus"
    modal
    class="w-full max-w-sm bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="pt-4 flex flex-col items-center text-center gap-3">
      <div
        class="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600"
      >
        <i class="pi pi-exclamation-triangle text-xl"></i>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900">Apakah Anda yakin?</p>
        <p class="text-xs text-slate-500 leading-relaxed">
          Tindakan ini akan menghapus akun kas secara permanen. Akun yang
          memiliki riwayat transaksi tidak dapat dihapus.
        </p>
      </div>
      <p v-if="deleteError" class="text-xs text-rose-600 font-semibold mt-2">
        {{ deleteError }}
      </p>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-center mt-6 w-full">
        <Button
          label="Batal"
          severity="secondary"
          text
          class="w-full"
          @click="isConfirmDeleteOpen = false"
        />
        <Button
          label="Hapus"
          severity="danger"
          class="w-full"
          @click="confirmDelete"
        />
      </div>
    </template>
  </Dialog>
</template>
