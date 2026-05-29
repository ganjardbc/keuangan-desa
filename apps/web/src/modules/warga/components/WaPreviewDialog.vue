<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

const props = defineProps<{
  payment: any
  warga: any
  month: number | null
  year: number
  receiptTemplate?: string
}>()

const visible = defineModel<boolean>('visible', { default: false })

const waPreviewText = ref('')
const waTargetPhone = ref('')

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

const formatWhatsAppNumber = (phone?: string | null): string => {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

// Watch props to initialize preview text
watch(
  [() => props.payment, () => props.warga, visible],
  ([newPayment, newWarga, isOpen]) => {
    if (!isOpen || !newPayment || !newWarga) return

    const monthName =
      monthsList.find((m) => m.value === props.month)?.nameFull ||
      `Bulan ${props.month}`
    const paidDate = newPayment.paidAt
      ? formatDate(newPayment.paidAt)
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

    const template = props.receiptTemplate || defaultTemplate

    const message = template
      .replace(/{nama}/g, newWarga.name)
      .replace(/{houseNumber}/g, newWarga.houseNumber)
      .replace(/{periode}/g, `${monthName} ${props.year}`)
      .replace(/{jenisIuran}/g, newPayment.jenisIuranName)
      .replace(/{jumlah}/g, formatCurrency(newPayment.amountPaid))
      .replace(/{tglBayar}/g, paidDate)

    waPreviewText.value = message
    waTargetPhone.value = newWarga.phoneNumber || ''
  },
  { immediate: true },
)

const sendWhatsAppReceipt = () => {
  const encodedMessage = encodeURIComponent(waPreviewText.value)
  const phoneNumber = formatWhatsAppNumber(waTargetPhone.value)
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`

  window.open(url, '_blank', 'noopener,noreferrer')
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Pratinjau Kuitansi WhatsApp"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="space-y-4 pt-4">
      <!-- Target Phone Number -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >Nomor Tujuan WhatsApp</label
        >
        <div class="relative flex items-center">
          <InputText
            v-model="waTargetPhone"
            placeholder="Contoh: 08123456789"
            class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-xs pl-8 shadow-sm focus:!border-emerald-500 focus:!ring-emerald-500/20"
          />
          <i class="pi pi-phone absolute left-3 text-slate-400 text-xs"></i>
        </div>
        <p class="text-[9px] text-slate-400 leading-tight">
          Kosongkan nomor jika ingin memicu WhatsApp share picker manual (pilih
          kontak di aplikasi).
        </p>
      </div>

      <!-- WhatsApp Preview Mockup Window -->
      <div
        class="flex flex-col border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <!-- Mockup WhatsApp Header -->
        <div
          class="bg-[#075e54] text-white px-4 py-2.5 flex items-center gap-2.5 select-none"
        >
          <div
            class="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-white/10 flex-shrink-0"
          >
            <i class="pi pi-user text-sm text-white"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h5 class="text-xs font-bold leading-tight truncate">
              {{ warga?.name || 'Warga' }}
            </h5>
            <p class="text-[8px] text-emerald-200 leading-none">Online</p>
          </div>
          <div class="flex gap-3 text-white/80">
            <i class="pi pi-video text-xs"></i>
            <i class="pi pi-phone text-xs"></i>
            <i class="pi pi-ellipsis-v text-xs"></i>
          </div>
        </div>

        <!-- Mockup WhatsApp Body / Chat Area -->
        <div
          class="bg-[#efeae2] p-4 min-h-[220px] flex flex-col justify-end relative overflow-y-auto"
        >
          <!-- Chat Bubble -->
          <div
            class="bg-[#dcf8c6] border border-[#c1e8a8] text-slate-800 rounded-2xl rounded-tr-none p-3 max-w-[85%] self-end shadow-sm text-[11px] font-sans whitespace-pre-wrap leading-relaxed relative"
          >
            <div
              class="absolute -right-2 top-0 border-[6px] border-transparent border-l-[#dcf8c6] border-t-[#dcf8c6]"
            ></div>

            <!-- Real editable Textarea inside the bubble so they can interact directly -->
            <Textarea
              v-model="waPreviewText"
              rows="8"
              class="!w-full !bg-transparent !border-0 !resize-none !p-0 focus:!ring-0 focus:!outline-none !text-[11px] !font-mono !leading-relaxed !text-slate-800"
              placeholder="Tulis pesan kuitansi di sini..."
            />

            <div
              class="text-right text-[8px] text-slate-500 mt-1 flex items-center justify-end gap-1 select-none"
            >
              <span>{{
                new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }}</span>
              <i class="pi pi-check text-[8px] text-[#34b7f1]"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <Button
          label="Batal"
          severity="secondary"
          text
          class="!text-slate-500 hover:!bg-slate-100 !rounded-xl !py-2"
          @click="visible = false"
        />
        <Button
          label="Kirim ke WhatsApp"
          icon="pi pi-whatsapp"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-0 text-white font-bold !rounded-xl !py-2 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all active:scale-98"
          @click="sendWhatsAppReceipt"
        />
      </div>
    </template>
  </Dialog>
</template>
