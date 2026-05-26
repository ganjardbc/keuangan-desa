<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import api from '../../../lib/axios'
import TemplateList from '../../../components/TemplateList.vue'

const tenants = ref<any[]>([])
const loading = ref(false)
const submitLoading = ref(false)
const isDialogOpen = ref(false)
const editData = ref<any>(null)
const errorMsg = ref('')
const first = ref(0)

// Form states
const name = ref('')
const code = ref('')
const address = ref('')
const isActive = ref(true)

const fetchTenants = async () => {
  loading.value = true
  try {
    const response = await api.get('/admin/tenants')
    tenants.value = response.data
  } catch (err: any) {
    console.error('Gagal memuat tenants:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTenants()
})

const openAddDialog = () => {
  editData.value = null
  name.value = ''
  code.value = ''
  address.value = ''
  isActive.value = true
  errorMsg.value = ''
  isDialogOpen.value = true
}

const openEditDialog = (tenant: any) => {
  editData.value = tenant
  name.value = tenant.name
  code.value = tenant.code
  address.value = tenant.address || ''
  isActive.value = tenant.isActive
  errorMsg.value = ''
  isDialogOpen.value = true
}

const handleSubmit = async () => {
  if (!name.value || !code.value) return
  submitLoading.value = true
  errorMsg.value = ''
  try {
    const payload = {
      name: name.value,
      code: code.value.toUpperCase().replace(/\s+/g, '-'),
      address: address.value || undefined,
      isActive: isActive.value,
    }

    if (editData.value?.id) {
      await api.put(`/admin/tenants/${editData.value.id}`, payload)
    } else {
      await api.post('/admin/tenants', payload)
    }

    isDialogOpen.value = false
    await fetchTenants()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Gagal menyimpan tenant.'
  } finally {
    submitLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <TemplateList
    title="Kelola Tenant (Komunitas/Desa)"
    description="Daftar entitas multi-tenant mandiri yang terintegrasi di KasKita"
  >
    <template #actions>
      <Button label="Tambah Tenant" icon="pi pi-plus" @click="openAddDialog" />
    </template>

    <!-- Tenant Table -->
    <DataTable
      v-model:first="first"
      :value="tenants"
      :loading="loading"
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

      <Column field="name" header="Nama Tenant" class="!border-slate-100">
        <template #body="slotProps">
          <div>
            <p class="text-sm font-semibold text-slate-900">
              {{ slotProps.data.name }}
            </p>
            <p class="text-[10px] text-slate-500 mt-0.5">
              {{ slotProps.data.address || 'Alamat belum diatur' }}
            </p>
          </div>
        </template>
      </Column>

      <Column
        field="code"
        header="Kode Tenant"
        class="!border-slate-100 font-mono text-xs text-slate-700"
      >
        <template #body="slotProps">
          <span
            class="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold"
          >
            {{ slotProps.data.code }}
          </span>
        </template>
      </Column>

      <Column field="isActive" header="Status" class="!border-slate-100">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.isActive ? 'AKTIF' : 'NON-AKTIF'"
            :severity="slotProps.data.isActive ? 'success' : 'danger'"
            class="text-[9px]"
          />
        </template>
      </Column>

      <Column
        field="createdAt"
        header="Tanggal Terdaftar"
        class="!border-slate-100 text-xs text-slate-500"
      >
        <template #body="slotProps">
          {{ formatDate(slotProps.data.createdAt) }}
        </template>
      </Column>

      <Column
        header="Aksi"
        class="!border-slate-100 text-center w-24"
        header-class="text-center"
      >
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            size="small"
            title="Edit Tenant"
            @click="openEditDialog(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>
  </TemplateList>

  <!-- Dialog Form Add/Edit -->
  <Dialog
    v-model:visible="isDialogOpen"
    :header="editData ? 'Ubah Detail Tenant' : 'Tambah Tenant Baru'"
    modal
    class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <form class="space-y-5 pt-4" @submit.prevent="handleSubmit">
      <!-- Error Msg -->
      <div
        v-if="errorMsg"
        class="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs text-center font-medium"
      >
        {{ errorMsg }}
      </div>

      <!-- Nama Tenant -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Komunitas/RT/Desa</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Desa Sukamaju (RT 03)"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Kode Tenant -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Kode Tenant (Unik)</label
        >
        <InputText
          v-model="code"
          :disabled="!!editData"
          placeholder="Contoh: DS-SUKAMAJU"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm font-mono uppercase"
          required
        />
        <span class="text-[9px] text-slate-400"
          >Digunakan untuk akses portal transparansi publik:
          /transparansi/{KODE}</span
        >
      </div>

      <!-- Alamat -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Alamat Lengkap</label
        >
        <InputText
          v-model="address"
          placeholder="Contoh: Kecamatan Caringin, Bogor"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
        />
      </div>

      <!-- Status Aktif -->
      <div
        v-if="editData"
        class="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl"
      >
        <span class="text-xs font-semibold text-slate-700"
          >Status Aktif Tenant</span
        >
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer"
            :class="
              isActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            "
            @click="isActive = true"
          >
            Aktif
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer"
            :class="
              !isActive
                ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            "
            @click="isActive = false"
          >
            Non-Aktif
          </button>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center gap-3 justify-end mt-6">
        <Button
          label="Batal"
          severity="secondary"
          text
          @click="isDialogOpen = false"
        />
        <Button type="submit" :loading="submitLoading" label="Simpan" />
      </div>
    </form>
  </Dialog>
</template>
