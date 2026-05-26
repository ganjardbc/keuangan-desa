<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import api from '../../../lib/axios'
import TemplateList from '../../../components/TemplateList.vue'

const users = ref<any[]>([])
const roles = ref<any[]>([])
const tenants = ref<any[]>([])
const loading = ref(false)
const submitLoading = ref(false)
const isDialogOpen = ref(false)
const editData = ref<any>(null)
const errorMsg = ref('')

// Form states
const name = ref('')
const email = ref('')
const password = ref('')
const selectedRoleId = ref('')
const selectedTenantId = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const [usersRes, rolesRes, tenantsRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/roles'),
      api.get('/admin/tenants'),
    ])
    users.value = usersRes.data
    roles.value = rolesRes.data
    tenants.value = tenantsRes.data
  } catch (err: any) {
    console.error('Gagal memuat data admin:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const openAddDialog = () => {
  editData.value = null
  name.value = ''
  email.value = ''
  password.value = ''
  selectedRoleId.value = roles.value.length > 0 ? roles.value[0].id : ''
  selectedTenantId.value = tenants.value.length > 0 ? tenants.value[0].id : ''
  errorMsg.value = ''
  isDialogOpen.value = true
}

const openEditDialog = (user: any) => {
  editData.value = user
  name.value = user.name
  email.value = user.email
  password.value = '' // leave blank unless changing
  selectedRoleId.value = user.roleId
  selectedTenantId.value = user.tenantId
  errorMsg.value = ''
  isDialogOpen.value = true
}

const handleSubmit = async () => {
  if (
    !name.value ||
    !email.value ||
    !selectedRoleId.value ||
    !selectedTenantId.value
  )
    return
  if (!editData.value && !password.value) {
    errorMsg.value = 'Password wajib diisi untuk user baru.'
    return
  }

  submitLoading.value = true
  errorMsg.value = ''
  try {
    const payload: any = {
      name: name.value,
      email: email.value,
      roleId: selectedRoleId.value,
      tenantId: selectedTenantId.value,
    }

    if (password.value) {
      payload.pass = password.value
    }

    if (editData.value?.id) {
      await api.put(`/admin/users/${editData.value.id}`, payload)
    } else {
      await api.post('/admin/users', payload)
    }

    isDialogOpen.value = false
    await fetchData()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Gagal menyimpan user.'
  } finally {
    submitLoading.value = false
  }
}

const getRoleSeverity = (roleName: string) => {
  switch (roleName) {
    case 'SUPER_ADMIN':
      return 'danger'
    case 'BENDAHARA':
      return 'success'
    case 'KETUA_RT':
      return 'warn'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <TemplateList
    title="Kelola Pengguna (Users)"
    description="Pendaftaran pengurus desa dan penetapan hak akses role (RBAC)"
  >
    <template #actions>
      <Button
        label="Tambah User"
        icon="pi pi-user-plus"
        @click="openAddDialog"
      />
    </template>

    <!-- User Table -->
    <DataTable
      :value="users"
      :loading="loading"
      responsive-layout="scroll"
      class="w-full shadow-sm rounded-lg overflow-hidden"
      :paginator="true"
      :rows="10"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      :rows-per-page-options="[5, 10, 20, 50]"
    >
      <Column field="name" header="Nama Pengguna" class="!border-slate-100">
        <template #body="slotProps">
          <div>
            <p class="text-sm font-semibold text-slate-900">
              {{ slotProps.data.name }}
            </p>
            <p class="text-[10px] text-slate-500 mt-0.5">
              {{ slotProps.data.email }}
            </p>
          </div>
        </template>
      </Column>

      <Column field="role" header="Role / Jabatan" class="!border-slate-100">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.role?.name"
            :severity="getRoleSeverity(slotProps.data.role?.name)"
            class="text-[9px]"
          />
        </template>
      </Column>

      <Column
        field="tenant"
        header="Tenant / Desa"
        class="!border-slate-100 text-xs font-semibold text-slate-700"
      >
        <template #body="slotProps">
          {{ slotProps.data.tenant?.name || 'Sistem Global' }}
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
            title="Edit User"
            @click="openEditDialog(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>
  </TemplateList>

  <!-- Dialog Form Add/Edit -->
  <Dialog
    v-model:visible="isDialogOpen"
    :header="editData ? 'Ubah Akun Pengguna' : 'Tambah Pengguna Baru'"
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

      <!-- Nama -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Lengkap</label
        >
        <InputText
          v-model="name"
          placeholder="Contoh: Budi Prasetyo"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Email -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Alamat Email</label
        >
        <InputText
          v-model="email"
          type="email"
          placeholder="Contoh: budi@kaskita.com"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Password -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {{
            editData
              ? 'Ubah Kata Sandi (Kosongkan jika tidak diubah)'
              : 'Kata Sandi'
          }}
        </label>
        <InputText
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
          :required="!editData"
        />
      </div>

      <!-- Role -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Role / Hak Akses</label
        >
        <Select
          v-model="selectedRoleId"
          :options="roles"
          option-value="id"
          option-label="name"
          placeholder="Pilih Role"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
      </div>

      <!-- Tenant -->
      <div class="flex flex-col gap-2">
        <label
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Penugasan Tenant (Desa/RT)</label
        >
        <Select
          v-model="selectedTenantId"
          :options="tenants"
          option-value="id"
          option-label="name"
          placeholder="Pilih Tenant/Desa"
          class="w-full !bg-white !border-slate-200 !text-slate-900 rounded-xl text-sm"
          required
        />
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
