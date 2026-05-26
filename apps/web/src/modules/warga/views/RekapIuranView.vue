<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWargaStore } from '../stores/warga'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Textarea from 'primevue/textarea'

const wargaStore = useWargaStore()
const authStore = useAuthStore()

// Filters
const selectedYear = ref(new Date().getFullYear())
const years = [2024, 2025, 2026, 2027, 2028]
const searchQuery = ref('')
const first = ref(0)

// Unified Dialog State
const isPaymentDialogOpen = ref(false)
const selectedWarga = ref<any>(null)
const selectedMonth = ref<number | null>(null)
const selectedMonthName = computed(() => {
  if (selectedMonth.value === null) return ''
  return monthsList.find((m) => m.value === selectedMonth.value)?.nameFull || ''
})

// New Payment Form State
const selectedIuranId = ref<string>('')
const amountPaid = ref<number>(0)
const submitLoading = ref(false)

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

// Fetch data
const loadData = async () => {
  await wargaStore.fetchRekapIuran(selectedYear.value)
}

onMounted(() => {
  loadData()
})

watch(selectedYear, () => {
  loadData()
})

// Computed Filtered List
const filteredRekapList = computed(() => {
  if (!searchQuery.value) {
    return wargaStore.rekapList
  }
  const q = searchQuery.value.toLowerCase()
  return wargaStore.rekapList.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.houseNumber.toLowerCase().includes(q),
  )
})

// Helpers to get month info for a warga
const getMonthData = (warga: any, monthVal: number) => {
  return (
    warga.months.find((m: any) => m.month === monthVal) || {
      isPaid: false,
      payments: [],
    }
  )
}

const getMonthStatus = (warga: any, monthVal: number) => {
  const totalDues = warga.iuranBulanan?.length || 0
  const monthData = getMonthData(warga, monthVal)
  const paidCount = monthData.payments?.length || 0

  if (totalDues === 0)
    return { label: 'Bebas', severity: 'secondary', code: 'FREE' }
  if (paidCount === 0)
    return { label: 'Belum', severity: 'danger', code: 'UNPAID' }
  if (paidCount < totalDues)
    return {
      label: `${paidCount}/${totalDues}`,
      severity: 'warn',
      code: 'PARTIAL',
    }
  return { label: 'Lunas', severity: 'success', code: 'PAID' }
}

// Dialog Actions
const openPaymentDialog = (warga: any, monthVal: number) => {
  selectedWarga.value = warga
  selectedMonth.value = monthVal
  selectedIuranId.value = ''
  amountPaid.value = 0

  // Set default form values if there are unpaid iurans
  const unpaid = unpaidIurans.value
  if (unpaid.length > 0) {
    selectedIuranId.value = unpaid[0].jenisIuran.id
    amountPaid.value =
      unpaid[0].customAmount ?? unpaid[0].jenisIuran.defaultAmount
  }

  isPaymentDialogOpen.value = true
}

// Compute unpaid iurans for the selected month
const unpaidIurans = computed(() => {
  if (!selectedWarga.value || selectedMonth.value === null) return []
  const monthData = getMonthData(selectedWarga.value, selectedMonth.value)
  const paidIuranNames = monthData.payments.map((p: any) => p.jenisIuranName)

  return selectedWarga.value.iuranBulanan.filter(
    (ib: any) => !paidIuranNames.includes(ib.jenisIuran.name),
  )
})

// Watch selected iuran and update amount automatically
watch(selectedIuranId, (newId) => {
  if (!newId || !selectedWarga.value) return
  const mapping = selectedWarga.value.iuranBulanan.find(
    (ib: any) => ib.jenisIuran.id === newId,
  )
  if (mapping) {
    amountPaid.value = mapping.customAmount ?? mapping.jenisIuran.defaultAmount
  }
})

const handleRecordPayment = async () => {
  if (
    !selectedWarga.value ||
    !selectedMonth.value ||
    !selectedIuranId.value ||
    amountPaid.value <= 0
  )
    return

  submitLoading.value = true
  const success = await wargaStore.payIuran(selectedWarga.value.id, {
    jenisIuranId: selectedIuranId.value,
    month: selectedMonth.value,
    year: selectedYear.value,
    amountPaid: amountPaid.value,
  })

  if (success) {
    await loadData()
    // Refresh selectedWarga reference to show updated payments list
    selectedWarga.value = wargaStore.rekapList.find(
      (w) => w.id === selectedWarga.value.id,
    )

    // Reset or update selected iuran
    const unpaid = unpaidIurans.value
    if (unpaid.length > 0) {
      selectedIuranId.value = unpaid[0].jenisIuran.id
      amountPaid.value =
        unpaid[0].customAmount ?? unpaid[0].jenisIuran.defaultAmount
    } else {
      selectedIuranId.value = ''
      amountPaid.value = 0
    }
  }
  submitLoading.value = false
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

// --- WhatsApp Notification Helpers ---

// WhatsApp Preview States
const isWaPreviewOpen = ref(false)
const waPreviewText = ref('')
const waTargetPhone = ref('')
const waTargetWarga = ref<any>(null)

/**
 * Normalizes Indonesian phone number to WhatsApp international format (62xxx).
 * Returns empty string if phoneNumber is empty/null.
 */
const formatWhatsAppNumber = (phone?: string | null): string => {
  if (!phone) return ''
  // Strip all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

/**
 * Compiles custom template from tenant or default and opens Preview Dialog.
 */
const triggerWhatsAppPreview = (
  payment: any,
  warga: any,
  month: number | null,
  year: number,
) => {
  const monthName =
    monthsList.find((m) => m.value === month)?.nameFull || `Bulan ${month}`
  const paidDate = payment.paidAt
    ? formatDate(payment.paidAt)
    : new Date().toLocaleDateString('id-ID')

  const defaultTemplate = [
    `🧾 *KUITANSI PEMBAYARAN IURAN*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Nama Warga  :* {nama}`,
    `🏠 *No. Rumah   :* {houseNumber}`,
    `📅 *Periode     :* {periode}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Jenis Iuran :* {jenisIuran}`,
    `💰 *Jumlah Bayar:* {jumlah}`,
    `📆 *Tgl Bayar   :* {tglBayar}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `✅ _Pembayaran ini sah dan telah dicatat dalam sistem keuangan RT/RW._`,
    `_Terima kasih atas partisipasi Bapak/Ibu._ 🙏`,
  ].join('\n')

  const template = authStore.user?.tenant?.waReceiptTemplate || defaultTemplate

  // Replace placeholders
  const message = template
    .replace(/{nama}/g, warga.name)
    .replace(/{houseNumber}/g, warga.houseNumber)
    .replace(/{periode}/g, `${monthName} ${year}`)
    .replace(/{jenisIuran}/g, payment.jenisIuranName)
    .replace(/{jumlah}/g, formatCurrency(payment.amountPaid))
    .replace(/{tglBayar}/g, paidDate)

  waPreviewText.value = message
  waTargetPhone.value = warga.phoneNumber || ''
  waTargetWarga.value = warga
  isWaPreviewOpen.value = true
}

/**
 * Composes a WhatsApp receipt message and opens wa.me URL.
 */
const sendWhatsAppReceipt = () => {
  const encodedMessage = encodeURIComponent(waPreviewText.value)
  const phoneNumber = formatWhatsAppNumber(waTargetPhone.value)
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`

  window.open(url, '_blank', 'noopener,noreferrer')
  isWaPreviewOpen.value = false
}

// Generate payment details tooltip text
const getTooltipText = (warga: any, monthVal: number) => {
  const monthData = getMonthData(warga, monthVal)
  if (!monthData.payments || monthData.payments.length === 0) {
    return 'Belum ada pembayaran'
  }
  return monthData.payments
    .map(
      (p: any) =>
        `${p.jenisIuranName}: Lunas (${formatCurrency(p.amountPaid)})`,
    )
    .join('\n')
}
</script>

<template>
  <TemplateList
    title="Matriks Rekapitulasi Iuran"
    description="Pencatatan & pemantauan status iuran bulanan warga per tahun"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <Select
          v-model="selectedYear"
          placeholder="Pilih Tahun"
          :options="years"
          fluid
        />
      </div>
      <div class="relative flex items-center">
        <InputGroup>
          <InputText
            v-model="searchQuery"
            placeholder="Cari warga / no. rumah..."
            fluid
          />
          <InputGroupAddon>
            <i class="pi pi-search text-slate-400" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </template>

    <!-- Matrix View Card -->
    <DataTable
      v-model:first="first"
      :value="filteredRekapList"
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

      <!-- Warga Column -->
      <Column
        field="name"
        header="Nama Warga"
        class="!border-slate-100 !p-3 sticky left-0 z-10 bg-white/90 backdrop-blur-md w-48"
      >
        <template #body="slotProps">
          <div>
            <p class="text-sm font-semibold text-slate-900 truncate">
              {{ slotProps.data.name }}
            </p>
            <p class="text-[10px] text-slate-500 font-mono">
              No. {{ slotProps.data.houseNumber }}
            </p>
          </div>
        </template>
      </Column>

      <!-- 12 Months Columns -->
      <Column
        v-for="m in monthsList"
        :key="m.value"
        :header="m.name"
        class="!border-slate-100 !p-1.5 text-center align-middle"
        header-class="text-center"
      >
        <template #body="slotProps">
          <div class="flex justify-center">
            <button
              :title="getTooltipText(slotProps.data, m.value)"
              :disabled="
                getMonthStatus(slotProps.data, m.value).code === 'FREE'
              "
              class="w-full py-1.5 px-1 rounded-lg border text-center transition-all select-none font-bold text-[10px] block shadow-sm"
              :class="[
                getMonthStatus(slotProps.data, m.value).code === 'FREE'
                  ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : getMonthStatus(slotProps.data, m.value).code === 'UNPAID'
                    ? authStore.hasPermission('warga:write')
                      ? 'bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-600 cursor-pointer'
                      : 'bg-rose-50 border-rose-100 text-rose-600 cursor-default'
                    : getMonthStatus(slotProps.data, m.value).code === 'PARTIAL'
                      ? authStore.hasPermission('warga:write')
                        ? 'bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-600 cursor-pointer'
                        : 'bg-amber-50 border-amber-100 text-amber-600 cursor-default'
                      : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-600 cursor-pointer',
              ]"
              @click="openPaymentDialog(slotProps.data, m.value)"
            >
              {{ getMonthStatus(slotProps.data, m.value).label }}
            </button>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Legend / Keterangan -->
    <div class="flex flex-wrap gap-4 items-center justify-start mt-4">
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <span
          class="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"
        ></span>
        <span>Lunas (Semua Iuran Mapped Terbayar)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <span
          class="w-3 h-3 rounded bg-amber-50 border border-amber-200"
        ></span>
        <span>Sebagian (Sebagian Iuran Terbayar)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <span class="w-3 h-3 rounded bg-rose-50 border border-rose-200"></span>
        <span>Belum Bayar (Belum Membayar Apapun)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <span
          class="w-3 h-3 rounded bg-slate-50 border border-slate-200"
        ></span>
        <span>Bebas (Tidak Ada Iuran Terhubung)</span>
      </div>
    </div>
  </TemplateList>

  <!-- Dialog Unified Payment Info & Action -->
  <Dialog
    v-model:visible="isPaymentDialogOpen"
    :header="`Status Iuran: ${selectedWarga?.name || ''}`"
    modal
    class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-6 pt-4">
      <!-- Metadata -->
      <div
        class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center text-xs"
      >
        <div>
          <p class="text-slate-500">Nomor Rumah</p>
          <p class="font-bold text-slate-900 font-mono mt-0.5">
            {{ selectedWarga?.houseNumber }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-slate-500">Periode Iuran</p>
          <p class="font-bold text-violet-600 mt-0.5">
            {{ selectedMonthName }} {{ selectedYear }}
          </p>
        </div>
      </div>

      <!-- History/List of Payments in selected month -->
      <div>
        <p
          class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
        >
          Iuran Terbayar Bulan Ini:
        </p>

        <div v-if="selectedWarga && selectedMonth !== null">
          <div
            v-if="
              getMonthData(selectedWarga, selectedMonth).payments.length > 0
            "
            class="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100"
          >
            <div
              v-for="p in getMonthData(selectedWarga, selectedMonth).payments"
              :key="p.id"
              class="flex items-center justify-between p-3 gap-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-900">
                  {{ p.jenisIuranName }}
                </p>
                <p class="text-[10px] text-slate-500">
                  Tgl Bayar: {{ formatDate(p.paidAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-right">
                  <span class="text-sm font-bold text-emerald-600">{{
                    formatCurrency(p.amountPaid)
                  }}</span>
                  <p
                    class="text-xs text-emerald-600 font-semibold flex items-center"
                  >
                    <i class="pi pi-check-circle mr-2 text-xs!"></i>Lunas
                  </p>
                </div>
                <!-- WhatsApp Receipt Button (Bendahara only) -->
                <button
                  v-if="authStore.hasPermission('warga:write')"
                  :title="
                    selectedWarga?.phoneNumber
                      ? `Kirim kuitansi ke ${selectedWarga.phoneNumber}`
                      : 'Kirim kuitansi (pilih kontak manual)'
                  "
                  class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-200 cursor-pointer flex-shrink-0"
                  @click="
                    triggerWhatsAppPreview(
                      p,
                      selectedWarga,
                      selectedMonth,
                      selectedYear,
                    )
                  "
                >
                  <i class="pi pi-whatsapp text-xs"></i>
                </button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-500 text-xs"
          >
            Belum ada iuran yang terbayar di bulan ini.
          </div>
        </div>
      </div>

      <!-- Payment input (Only visible to users with warga:write permission and if there are unpaid iurans) -->
      <div
        v-if="authStore.hasPermission('warga:write') && unpaidIurans.length > 0"
        class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4"
      >
        <p class="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Catat Pembayaran Baru
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Select Dues -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-slate-500 uppercase tracking-wider"
              >Pilih Iuran</label
            >
            <Select
              v-model="selectedIuranId"
              :options="unpaidIurans"
              option-value="jenisIuran.id"
              option-label="jenisIuran.name"
              placeholder="Pilih Iuran"
              class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs"
            />
          </div>

          <!-- Amount Input -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-slate-500 uppercase tracking-wider"
              >Jumlah Dibayar (Rp)</label
            >
            <InputNumber
              v-model="amountPaid"
              mode="currency"
              currency="IDR"
              locale="id-ID"
              :min="0"
              class="w-full"
              input-class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs"
            />
          </div>
        </div>

        <Button
          :loading="submitLoading"
          label="Catat Pembayaran"
          icon="pi pi-credit-card"
          size="small"
          class="w-full"
          @click="handleRecordPayment"
        />
      </div>

      <div
        v-else-if="unpaidIurans.length === 0"
        class="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center"
      >
        <p class="text-xs text-emerald-600 font-semibold">
          <i class="pi pi-verified mr-1"></i> Semua iuran terhubung untuk bulan
          ini telah dilunasi!
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <Button
          label="Tutup"
          severity="secondary"
          @click="isPaymentDialogOpen = false"
        />
      </div>
    </template>
  </Dialog>

  <!-- Dialog Preview & Edit WhatsApp Message -->
  <Dialog
    v-model:visible="isWaPreviewOpen"
    header="Pratinjau Kuitansi WhatsApp"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <!-- Target Phone Number -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] text-slate-500 uppercase tracking-wider"
          >Nomor Tujuan WhatsApp</label
        >
        <InputText
          v-model="waTargetPhone"
          placeholder="Contoh: 08123456789"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs"
        />
        <p class="text-[9px] text-slate-400">
          Kosongkan nomor jika ingin memicu WhatsApp share picker manual.
        </p>
      </div>

      <!-- Compiled Text Message Area -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] text-slate-500 uppercase tracking-wider"
          >Pesan Kuitansi (Dapat Diedit)</label
        >
        <Textarea
          v-model="waPreviewText"
          rows="10"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs font-mono"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="isWaPreviewOpen = false"
        />
        <Button
          label="Kirim ke WhatsApp"
          icon="pi pi-whatsapp"
          @click="sendWhatsAppReceipt"
        />
      </div>
    </template>
  </Dialog>
</template>
