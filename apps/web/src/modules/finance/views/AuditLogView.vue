<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuditStore } from '../stores/audit'
import TemplateList from '../../../components/TemplateList.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const auditStore = useAuditStore()

// Filter state
const selectedAction = ref<string>('')
const rowsPerPage = ref(20)
const first = ref(0)

// Computed current page (1-indexed)
const currentPage = computed(
  () => Math.floor(first.value / rowsPerPage.value) + 1,
)

const loadLogs = async () => {
  await auditStore.fetchAuditLogs({
    page: currentPage.value,
    limit: rowsPerPage.value,
    action: selectedAction.value || undefined,
  })
}

onMounted(async () => {
  await auditStore.fetchActionTypes()
  await loadLogs()
})

const onFilterChange = () => {
  first.value = 0
  loadLogs()
}

const resetFilters = () => {
  selectedAction.value = ''
  first.value = 0
  loadLogs()
}

// --- Formatting Helpers ---

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Action badge color map
const actionConfig: Record<
  string,
  { label: string; bg: string; text: string; icon: string }
> = {
  LOGIN: {
    label: 'Login',
    bg: 'bg-blue-50/50',
    text: 'text-blue-600',
    icon: 'pi-sign-in',
  },
  TAMBAH_WARGA: {
    label: 'Tambah Warga',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-600',
    icon: 'pi-user-plus',
  },
  UBAH_WARGA: {
    label: 'Ubah Warga',
    bg: 'bg-amber-50/50',
    text: 'text-amber-600',
    icon: 'pi-user-edit',
  },
  HAPUS_WARGA: {
    label: 'Hapus Warga',
    bg: 'bg-rose-50/50',
    text: 'text-rose-600',
    icon: 'pi-user-minus',
  },
  CATAT_PEMBAYARAN: {
    label: 'Catat Bayar',
    bg: 'bg-violet-50/50',
    text: 'text-violet-600',
    icon: 'pi-credit-card',
  },
  TAMBAH_TRANSAKSI: {
    label: 'Tambah Transaksi',
    bg: 'bg-teal-50/50',
    text: 'text-teal-600',
    icon: 'pi-plus-circle',
  },
  HAPUS_TRANSAKSI: {
    label: 'Hapus Transaksi',
    bg: 'bg-rose-50/50',
    text: 'text-rose-600',
    icon: 'pi-minus-circle',
  },
  TAMBAH_KAS: {
    label: 'Tambah Kas',
    bg: 'bg-cyan-50/50',
    text: 'text-cyan-600',
    icon: 'pi-wallet',
  },
  TAMBAH_PROYEK: {
    label: 'Tambah Proyek',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-600',
    icon: 'pi-briefcase',
  },
  HAPUS_PROYEK: {
    label: 'Hapus Proyek',
    bg: 'bg-rose-50/50',
    text: 'text-rose-600',
    icon: 'pi-trash',
  },
}

const getActionConfig = (action: string) =>
  actionConfig[action] ?? {
    label: action,
    bg: 'bg-slate-50/50',
    text: 'text-slate-600',
    icon: 'pi-circle',
  }

// Action type options for filter dropdown (prefixed with "Semua Aksi")
const actionOptions = computed(() => {
  return [
    { label: 'Semua Aksi', value: '' },
    ...auditStore.actionTypes.map((a) => ({
      label: getActionConfig(a).label,
      value: a,
    })),
  ]
})
</script>

<template>
  <TemplateList
    title="Log Audit Sistem"
    description="Rekam jejak setiap aksi penting yang dilakukan pengguna di sistem"
  >
    <template #actions>
      <Select
        v-model="selectedAction"
        :options="actionOptions"
        option-label="label"
        option-value="value"
        fluid
        class="flex-1 w-full! lg:w-60!"
        placeholder="Select"
        @change="onFilterChange"
      />
      <Button
        v-if="selectedAction"
        icon="pi pi-times"
        severity="secondary"
        label="Reset"
        @click="resetFilters"
      />
    </template>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div
        class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center"
      >
        <p class="text-2xl font-bold text-slate-900">{{ auditStore.total }}</p>
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          Total Entri
        </p>
      </div>
      <div
        class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center"
      >
        <p class="text-2xl font-bold text-blue-600">
          {{ auditStore.logs.filter((l) => l.action === 'LOGIN').length }}
        </p>
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          Login (Hlm ini)
        </p>
      </div>
      <div
        class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center"
      >
        <p class="text-2xl font-bold text-emerald-600">
          {{
            auditStore.logs.filter((l) =>
              [
                'TAMBAH_WARGA',
                'TAMBAH_TRANSAKSI',
                'TAMBAH_KAS',
                'CATAT_PEMBAYARAN',
              ].includes(l.action),
            ).length
          }}
        </p>
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          Tambah Data
        </p>
      </div>
      <div
        class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center"
      >
        <p class="text-2xl font-bold text-rose-600">
          {{
            auditStore.logs.filter((l) => l.action.startsWith('HAPUS')).length
          }}
        </p>
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          Hapus Data
        </p>
      </div>
    </div>

    <!-- Audit Log Table -->
    <div
      v-if="auditStore.loading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <p class="text-sm">Memuat log audit...</p>
      </div>
    </div>

    <div
      v-else-if="auditStore.logs.length === 0"
      class="text-center py-16 text-slate-500"
    >
      <i class="pi pi-history text-4xl mb-3 block opacity-30"></i>
      <p class="text-sm font-medium">Belum ada log audit tersimpan</p>
      <p class="text-xs mt-1">
        Mulai lakukan aktivitas untuk merekam jejak audit
      </p>
    </div>

    <DataTable
      v-else
      :value="auditStore.logs"
      class="w-full shadow-sm rounded-lg overflow-hidden"
      :paginator="true"
      :rows="10"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      :rows-per-page-options="[5, 10, 20, 50]"
    >
      <!-- Timestamp -->
      <Column header="Waktu" style="width: 12rem">
        <template #body="{ data }">
          <div>
            <p class="text-xs font-mono text-slate-600">
              {{ formatDate(data.createdAt) }}
            </p>
          </div>
        </template>
      </Column>

      <!-- User -->
      <Column header="Pengguna" style="width: 11rem">
        <template #body="{ data }">
          <div>
            <p class="text-sm font-semibold text-slate-900 truncate">
              {{ data.user.name }}
            </p>
            <p class="text-[10px] text-slate-500">{{ data.user.email }}</p>
          </div>
        </template>
      </Column>

      <!-- Action Badge -->
      <Column header="Aksi" style="width: 11rem">
        <template #body="{ data }">
          <Tag
            :value="getActionConfig(data.action).label"
            :icon="`pi ${getActionConfig(data.action).icon}`"
            :class="[
              '!bg-transparent text-[10px] font-bold uppercase tracking-wider border border-current/20 px-2.5 py-1 rounded-full',
              getActionConfig(data.action).text,
            ]"
          />
        </template>
      </Column>

      <!-- Details -->
      <Column header="Keterangan">
        <template #body="{ data }">
          <p class="text-xs text-slate-700 leading-relaxed">
            {{ data.details }}
          </p>
        </template>
      </Column>

      <!-- IP Address -->
      <Column header="IP Address" style="width: 9rem">
        <template #body="{ data }">
          <p class="text-[10px] font-mono text-slate-500">
            {{ data.ipAddress || '-' }}
          </p>
        </template>
      </Column>
    </DataTable>
  </TemplateList>
</template>
