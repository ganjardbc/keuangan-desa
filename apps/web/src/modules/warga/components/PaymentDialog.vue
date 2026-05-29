<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

const props = defineProps<{
  warga: any
  month: number | null
  year: number
  loading?: boolean
  hasWritePermission?: boolean
}>()

const emit = defineEmits<{
  (e: 'pay', payload: { jenisIuranId: string; amountPaid: number }): void
  (e: 'send-wa', payload: { payment: any }): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const selectedIuranId = ref<string>('')
const amountPaid = ref<number>(0)

const monthsList = [
  { value: 1, name: 'Jan', nameFull: 'Januari' },
  { value: 2, name: 'Feb', nameFull: 'Februari' },
  { value: 3, name: 'Mar', nameFull: 'Maret' },
  { value: 4, name: 'Apr', nameFull: 'April' },
  { value: 5, name: 'Mei', nameFull: 'Mei' },
  { value: 6, name: 'Jun', nameFull: 'Juni' },
  { value: 7, name: 'Jul', nameFull: 'Juli' },
  { value: 8, name: 'Agt', nameFull: 'Agustus' },
  { value: 9, name: 'Sep', nameFull: 'September' },
  { value: 10, name: 'Okt', nameFull: 'Oktober' },
  { value: 11, name: 'Nov', nameFull: 'November' },
  { value: 12, name: 'Des', nameFull: 'Desember' },
]

const selectedMonthName = computed(() => {
  if (props.month === null) return ''
  return monthsList.find((m) => m.value === props.month)?.nameFull || ''
})

const getMonthData = (warga: any, monthVal: number) => {
  return (
    warga?.months?.find((m: any) => m.month === monthVal) || {
      isPaid: false,
      payments: [],
    }
  )
}

const unpaidIurans = computed(() => {
  if (!props.warga || props.month === null) return []
  const monthData = getMonthData(props.warga, props.month)
  const paidIuranNames = monthData.payments.map((p: any) => p.jenisIuranName)

  return props.warga.iuranBulanan.filter(
    (ib: any) => !paidIuranNames.includes(ib.jenisIuran.name),
  )
})

// Initialize/reset form when warga or month changes
watch(
  [() => props.warga, () => props.month],
  () => {
    const unpaid = unpaidIurans.value
    if (unpaid.length > 0) {
      selectedIuranId.value = unpaid[0].jenisIuran.id
      amountPaid.value =
        unpaid[0].customAmount ?? unpaid[0].jenisIuran.defaultAmount
    } else {
      selectedIuranId.value = ''
      amountPaid.value = 0
    }
  },
  { immediate: true },
)

// Automatically update amount when selected iuran changes
watch(selectedIuranId, (newId) => {
  if (!newId || !props.warga) return
  const mapping = props.warga.iuranBulanan.find(
    (ib: any) => ib.jenisIuran.id === newId,
  )
  if (mapping) {
    amountPaid.value = mapping.customAmount ?? mapping.jenisIuran.defaultAmount
  }
})

const handlePaySubmit = () => {
  if (!selectedIuranId.value || amountPaid.value <= 0) return
  emit('pay', {
    jenisIuranId: selectedIuranId.value,
    amountPaid: amountPaid.value,
  })
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="`Status Iuran: ${warga?.name || ''}`"
    modal
    class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Metadata Badge-like layout -->
      <div
        class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden"
      >
        <div class="absolute -right-3 -top-3 text-slate-100 select-none">
          <i class="pi pi-user-edit text-6xl"></i>
        </div>
        <div class="relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Warga & No. Rumah
          </p>
          <p class="font-bold text-slate-800 text-sm mt-0.5">
            {{ warga?.name }}
          </p>
          <p class="text-xs text-slate-500 font-mono mt-0.5">
            Rumah: No. {{ warga?.houseNumber }}
          </p>
        </div>
        <div class="text-right relative z-10">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Periode Tagihan
          </p>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100 mt-1"
          >
            <i class="pi pi-calendar text-[10px]"></i>
            {{ selectedMonthName }} {{ year }}
          </span>
        </div>
      </div>

      <!-- History/List of Payments in selected month -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4
            class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none"
          >
            <i class="pi pi-check-circle text-emerald-500"></i>
            Iuran Terbayar Bulan Ini
          </h4>
          <span
            v-if="warga && month !== null"
            class="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100"
          >
            {{ getMonthData(warga, month).payments.length }}
            Terbayar
          </span>
        </div>

        <div v-if="warga && month !== null">
          <div
            v-if="getMonthData(warga, month).payments.length > 0"
            class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm"
          >
            <div
              v-for="p in getMonthData(warga, month).payments"
              :key="p.id"
              class="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-slate-800 truncate">
                    {{ p.jenisIuranName }}
                  </p>
                  <span
                    class="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100/50 flex items-center gap-0.5"
                  >
                    <i class="pi pi-check text-[8px]"></i> Lunas
                  </span>
                </div>
                <p
                  class="text-[10px] text-slate-400 flex items-center gap-1 mt-1"
                >
                  <i class="pi pi-calendar text-[10px]"></i>
                  Tgl Bayar: {{ formatDate(p.paidAt) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <span class="text-sm font-extrabold text-slate-900">{{
                    formatCurrency(p.amountPaid)
                  }}</span>
                </div>
                <!-- WhatsApp Receipt Button (Bendahara only) -->
                <Button
                  v-if="hasWritePermission"
                  :title="
                    warga?.phoneNumber
                      ? `Kirim kuitansi ke ${warga.phoneNumber}`
                      : 'Kirim kuitansi (pilih kontak manual)'
                  "
                  icon="pi pi-whatsapp"
                  severity="success"
                  outlined
                  class="!flex !items-center !justify-center !w-8 !h-8 !rounded-xl !bg-emerald-50 hover:!bg-emerald-500 hover:!text-white !text-emerald-600 !transition-all !duration-200 !cursor-pointer !flex-shrink-0 active:!scale-90 !border !border-emerald-100/50 !p-0"
                  @click="emit('send-wa', { payment: p })"
                />
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-center py-8 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2 select-none"
          >
            <i class="pi pi-inbox text-lg text-slate-300"></i>
            <span>Belum ada iuran yang terbayar di bulan ini.</span>
          </div>
        </div>
      </div>

      <!-- Payment input -->
      <div
        v-if="hasWritePermission && unpaidIurans.length > 0"
        class="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h4
            class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 select-none"
          >
            <i class="pi pi-plus-circle text-primary-500"></i>
            Catat Pembayaran Baru
          </h4>
          <span
            class="text-[9px] font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100"
          >
            {{ unpaidIurans.length }} Belum Bayar
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Select Dues -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >Pilih Jenis Iuran</label
            >
            <Select
              v-model="selectedIuranId"
              :options="unpaidIurans"
              option-value="jenisIuran.id"
              option-label="jenisIuran.name"
              placeholder="Pilih Iuran"
              class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
            />
          </div>

          <!-- Amount Input -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >Jumlah Dibayar (Rp)</label
            >
            <InputNumber
              v-model="amountPaid"
              mode="currency"
              currency="IDR"
              locale="id-ID"
              :min="0"
              class="w-full"
              input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs shadow-sm focus:!border-primary-500 focus:!ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      <div
        v-else-if="unpaidIurans.length === 0"
        class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center flex items-center justify-center gap-2 shadow-sm select-none"
      >
        <i class="pi pi-verified text-lg text-emerald-600"></i>
        <p class="text-xs text-emerald-700 font-bold">
          Semua iuran terhubung untuk bulan ini telah dilunasi!
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button label="Tutup" severity="secondary" @click="visible = false" />
        <Button
          :loading="loading"
          label="Catat Pembayaran"
          icon="pi pi-credit-card"
          size="small"
          :disabled="!unpaidIurans.length"
          @click="handlePaySubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
