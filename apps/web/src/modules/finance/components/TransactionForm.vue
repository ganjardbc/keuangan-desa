<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useProjectStore } from '../stores/project'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'

const props = defineProps<{
  editData?: any
}>()

const emit = defineEmits(['saved', 'cancel'])

const financeStore = useFinanceStore()
const projectStore = useProjectStore()

// State Form
const title = ref('')
const amount = ref<number | null>(null)
const type = ref<'pemasukan' | 'pengeluaran'>('pemasukan')
const category = ref('')
const kasAccountId = ref('')
const proyekKegiatanId = ref('')

// Categories
const categories = {
  pemasukan: [
    'Iuran Warga',
    'Donasi',
    'Bantuan Pemerintah',
    'Penyewaan',
    'Lain-lain',
  ],
  pengeluaran: [
    'Operasional',
    'Fasilitas Umum',
    'Sosial/Santunan',
    'Kegiatan Warga',
    'Lain-lain',
  ],
}

const typeOptions = ref([
  { label: 'Pemasukan', value: 'pemasukan' },
  { label: 'Pengeluaran', value: 'pengeluaran' },
])

onMounted(async () => {
  await financeStore.fetchKasAccounts()
  await projectStore.fetchProjects()
  loadEditData()
})

const loadEditData = () => {
  if (props.editData) {
    title.value = props.editData.title
    amount.value = props.editData.amount
    type.value = props.editData.type
    category.value = props.editData.category
    kasAccountId.value = props.editData.kasAccountId || ''
    proyekKegiatanId.value = props.editData.proyekKegiatanId || ''
  } else {
    resetForm()
  }
}

watch(
  () => props.editData,
  () => {
    loadEditData()
  },
  { deep: true },
)

const activeProjects = computed(() => {
  return projectStore.projects.filter((p) => p.status !== 'SELESAI')
})

// Reset form
const resetForm = () => {
  title.value = ''
  amount.value = null
  category.value = ''
  proyekKegiatanId.value = ''
  if (financeStore.kasAccounts.length > 0) {
    kasAccountId.value = financeStore.kasAccounts[0].id
  } else {
    kasAccountId.value = ''
  }
}

// Submit transaction
const submitTransaction = async () => {
  if (!title.value || !amount.value || !category.value || !kasAccountId.value)
    return

  const payload = {
    type: type.value,
    title: title.value,
    amount: amount.value,
    category: category.value,
    kasAccountId: kasAccountId.value,
    proyekKegiatanId:
      type.value === 'pengeluaran' && proyekKegiatanId.value
        ? proyekKegiatanId.value
        : undefined,
  }

  let success = false
  if (props.editData?.id) {
    success = await financeStore.updateTransaction(props.editData.id, payload)
  } else {
    success = await financeStore.addTransaction(payload)
  }

  if (success) {
    emit('saved')
    resetForm()
  }
}
</script>

<template>
  <div>
    <form class="space-y-5 px-2" @submit.prevent="submitTransaction">
      <!-- Type Tab Selector -->
      <SelectButton
        v-model="type"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        fluid
        @change="category = ''"
      />

      <!-- Deskripsi -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Deskripsi</label
        >
        <InputText
          v-model="title"
          placeholder="Contoh: Iuran Warga Blok C"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Jumlah (IDR) -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Jumlah (Rp)</label
        >
        <InputNumber
          v-model="amount"
          placeholder="Contoh: 150000"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          :min="0"
          class="w-full"
          input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Rekening Kas -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Rekening Kas</label
        >
        <Select
          v-model="kasAccountId"
          :options="financeStore.kasAccounts"
          option-value="id"
          option-label="name"
          placeholder="Pilih Rekening Kas"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Hubungkan ke Proyek (Pengeluaran Only) -->
      <div
        v-if="type === 'pengeluaran' && activeProjects.length > 0"
        class="flex flex-col gap-2"
      >
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Hubungkan ke Proyek (Opsional)</label
        >
        <Select
          v-model="proyekKegiatanId"
          :options="activeProjects"
          option-value="id"
          option-label="name"
          placeholder="Pilih Proyek Kegiatan"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
        />
      </div>

      <!-- Kategori -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Kategori</label
        >
        <Select
          v-model="category"
          :options="categories[type]"
          placeholder="Pilih Kategori"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>

      <Button
        type="submit"
        :icon="editData ? 'pi pi-check' : 'pi pi-plus'"
        :label="editData ? 'Simpan Perubahan' : 'Catat Transaksi'"
        class="w-full"
      />
    </form>
  </div>
</template>
