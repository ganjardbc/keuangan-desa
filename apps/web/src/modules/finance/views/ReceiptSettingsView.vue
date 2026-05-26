<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import api from '../../../lib/axios'
import { useAuthStore } from '../../../modules/auth/stores/auth'
import TemplateList from '../../../components/TemplateList.vue'

const authStore = useAuthStore()

const loading = ref(false)
const submitLoading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Form states
const waReceiptTemplate = ref('')
const pdfHeaderTemplate = ref('')

const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await api.get('/tenant/settings')
    waReceiptTemplate.value = response.data.waReceiptTemplate || ''
    pdfHeaderTemplate.value = response.data.pdfHeaderTemplate || ''
  } catch (err: any) {
    message.value = {
      type: 'error',
      text: err.response?.data?.message || 'Gagal memuat pengaturan kuitansi.',
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})

const handleSave = async () => {
  submitLoading.value = true
  message.value = null
  try {
    await api.put('/tenant/settings', {
      waReceiptTemplate: waReceiptTemplate.value,
      pdfHeaderTemplate: pdfHeaderTemplate.value,
    })

    // Update local store as well
    if (authStore.user?.tenant) {
      authStore.user.tenant.waReceiptTemplate = waReceiptTemplate.value
      authStore.user.tenant.pdfHeaderTemplate = pdfHeaderTemplate.value
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    message.value = {
      type: 'success',
      text: 'Pengaturan kuitansi berhasil disimpan!',
    }
  } catch (err: any) {
    message.value = {
      type: 'error',
      text:
        err.response?.data?.message || 'Gagal menyimpan pengaturan kuitansi.',
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <TemplateList
    title="Anggaran Kegiatan & Proyek"
    description="Kelola rencana anggaran biaya (RAB) dan serapan dana aktual proyek desa"
  >
    <!-- Alert Message -->
    <div v-if="message">
      <Message :severity="message.type" class="rounded-xl">{{
        message.text
      }}</Message>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Form Input -->
      <Card>
        <template #title>
          <h2 class="text-sm font-bold text-slate-900 px-2">
            Kustomisasi Template
          </h2>
        </template>
        <template #content>
          <div v-if="loading" class="text-center py-8 text-slate-400 text-xs">
            <i class="pi pi-spin pi-spinner text-lg mb-2 block"></i>
            Memuat data...
          </div>
          <form v-else class="space-y-6 px-2" @submit.prevent="handleSave">
            <!-- Kop Surat PDF -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Kop Surat PDF (Cetak Laporan)</label
              >
              <Textarea
                v-model="pdfHeaderTemplate"
                placeholder="Desa Sukamaju (RT 03 / RW 04)&#10;Kecamatan Caringin, Bogor"
                rows="3"
                class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                required
              />
              <span class="text-[10px] text-slate-400"
                >Kop Surat ini akan dicetak di bagian paling atas jurnal laporan
                keuangan.</span
              >
            </div>

            <!-- WhatsApp Template -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Template Pesan WhatsApp</label
              >
              <Textarea
                v-model="waReceiptTemplate"
                placeholder="Ketik template kuitansi WhatsApp di sini..."
                rows="10"
                class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-xs font-mono"
                required
              />
              <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span
                  class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1"
                  >Placeholder yang Didukung:</span
                >
                <div
                  class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-600 font-mono"
                >
                  <div>
                    <span class="font-bold text-violet-600">{nama}</span> - Nama
                    Warga
                  </div>
                  <div>
                    <span class="font-bold text-violet-600">{houseNumber}</span>
                    - No. Rumah
                  </div>
                  <div>
                    <span class="font-bold text-violet-600">{periode}</span> -
                    Bulan & Tahun
                  </div>
                  <div>
                    <span class="font-bold text-violet-600">{jenisIuran}</span>
                    - Nama Iuran
                  </div>
                  <div>
                    <span class="font-bold text-violet-600">{jumlah}</span> -
                    Nominal Bayar
                  </div>
                  <div>
                    <span class="font-bold text-violet-600">{tglBayar}</span> -
                    Tanggal Bayar
                  </div>
                </div>
              </div>
            </div>

            <!-- Save Button -->
            <Button
              type="submit"
              :loading="submitLoading"
              label="Simpan Pengaturan"
              icon="pi pi-save"
              class="w-full"
            />
          </form>
        </template>
      </Card>

      <!-- Live Preview -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-3 h-3 rounded-full bg-rose-500"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-mono text-slate-400 ml-2"
              >Pratinjau Kuitansi WhatsApp</span
            >
          </div>
        </template>
        <template #content>
          <Message icon="pi pi-info-circle" severity="success" class="mb-5">
            <span class="text-xs">
              Dibawah ini adalah tampilan pesan kuitansi setelah placeholder
              diganti dengan data transaksi riil warga.
            </span>
          </Message>

          <div
            class="bg-[#efeae2] text-slate-800 p-4 rounded-2xl shadow-inner max-w-sm mx-auto relative"
          >
            <!-- WhatsApp Chat bubble styled -->
            <div
              class="bg-white p-3 rounded-lg shadow-sm text-xs relative before:absolute before:right-full before:top-2 before:w-0 before:h-0 before:border-8 before:border-transparent before:border-r-white whitespace-pre-wrap font-sans"
            >
              <span class="font-mono text-[10px] text-slate-400 block mb-1"
                >Draf Pesan WhatsApp:</span
              >
              <p class="leading-relaxed">
                {{
                  waReceiptTemplate
                    ? waReceiptTemplate
                        .replace(/{nama}/g, 'Budi Santoso')
                        .replace(/{houseNumber}/g, 'A-12')
                        .replace(/{periode}/g, 'Mei 2026')
                        .replace(/{jenisIuran}/g, 'Iuran Sampah & Keamanan')
                        .replace(/{jumlah}/g, 'Rp 50.000')
                        .replace(/{tglBayar}/g, '26 Mei 2026')
                    : 'Belum ada template.'
                }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </TemplateList>
</template>
