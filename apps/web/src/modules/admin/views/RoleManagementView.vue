<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import api from '../../../lib/axios'
import TemplateList from '../../../components/TemplateList.vue'

interface Permission {
  id: string
  name: string
  description: string
  createdAt: string
}

interface RolePermission {
  roleId: string
  permissionId: string
  permission: Permission
}

interface Role {
  id: string
  name: string
  description: string | null
  rolePermissions: RolePermission[]
}

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const selectedRole = ref<Role | null>(null)
const selectedPermissionIds = ref<string[]>([])
const searchQuery = ref('')
const loading = ref(false)
const saveLoading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Create role states
const isRoleDialogOpen = ref(false)
const newRoleName = ref('')
const newRoleDescription = ref('')
const createRoleLoading = ref(false)

const openRoleDialog = () => {
  newRoleName.value = ''
  newRoleDescription.value = ''
  isRoleDialogOpen.value = true
}

const handleCreateRole = async () => {
  if (!newRoleName.value) return
  createRoleLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const res = await api.post('/admin/roles', {
      name: newRoleName.value,
      description: newRoleDescription.value || undefined,
    })
    isRoleDialogOpen.value = false
    successMsg.value = `Peran baru "${res.data.name}" berhasil dibuat!`
    await fetchData()
    // Select the newly created role
    const createdRole = roles.value.find((r) => r.id === res.data.id)
    if (createdRole) {
      selectRole(createdRole)
    }
  } catch (err: any) {
    console.error('Gagal membuat peran baru:', err)
    errorMsg.value = err.response?.data?.message || 'Gagal membuat peran baru.'
    isRoleDialogOpen.value = false
  } finally {
    createRoleLoading.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const [rolesRes, permsRes] = await Promise.all([
      api.get('/admin/roles'),
      api.get('/admin/permissions'),
    ])
    roles.value = rolesRes.data
    permissions.value = permsRes.data

    // Maintain selection if already selected
    if (selectedRole.value) {
      const updated = roles.value.find((r) => r.id === selectedRole.value?.id)
      if (updated) {
        selectRole(updated)
      }
    }
  } catch (err: any) {
    console.error('Gagal memuat data RBAC:', err)
    errorMsg.value = 'Gagal memuat data peran dan hak akses.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const selectRole = (role: Role) => {
  selectedRole.value = role
  selectedPermissionIds.value = role.rolePermissions.map(
    (rp) => rp.permissionId,
  )
  successMsg.value = ''
  errorMsg.value = ''
}

// Group permissions by category (prefix before :)
const getCategoryLabel = (name: string) => {
  const prefix = name.split(':')[0]
  switch (prefix) {
    case 'transaction':
      return 'Manajemen Transaksi Kas'
    case 'warga':
      return 'Manajemen Warga & Iuran'
    case 'report':
      return 'Laporan & Ekspor Jurnal'
    default:
      return 'Fitur Umum / Sistem'
  }
}

const getCategoryColor = (name: string) => {
  const prefix = name.split(':')[0]
  switch (prefix) {
    case 'transaction':
      return 'bg-violet-50 text-violet-700 border-violet-100'
    case 'warga':
      return 'bg-teal-50 text-teal-700 border-teal-100'
    case 'report':
      return 'bg-amber-50 text-amber-700 border-amber-100'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

const getCategoryIcon = (name: string) => {
  const prefix = name.split(':')[0]
  switch (prefix) {
    case 'transaction':
      return 'pi pi-list'
    case 'warga':
      return 'pi pi-users'
    case 'report':
      return 'pi pi-file-pdf'
    default:
      return 'pi pi-cog'
  }
}

// Filtered permissions based on search query
const filteredPermissions = computed(() => {
  if (!searchQuery.value) return permissions.value
  const query = searchQuery.value.toLowerCase()
  return permissions.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query),
  )
})

// Grouped and filtered permissions for rendering
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}

  filteredPermissions.value.forEach((p) => {
    const cat = getCategoryLabel(p.name)
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(p)
  })

  return groups
})

const handleSelectAll = () => {
  selectedPermissionIds.value = permissions.value.map((p) => p.id)
}

const handleDeselectAll = () => {
  selectedPermissionIds.value = []
}

const handleSave = async () => {
  if (!selectedRole.value) return
  saveLoading.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    await api.put(`/admin/roles/${selectedRole.value.id}/permissions`, {
      permissionIds: selectedPermissionIds.value,
    })
    successMsg.value = `Hak akses untuk peran "${selectedRole.value.name}" berhasil diperbarui!`

    // Refresh to get fresh roles data
    await fetchData()
  } catch (err: any) {
    console.error('Gagal menyimpan RBAC:', err)
    errorMsg.value =
      err.response?.data?.message || 'Gagal menyimpan konfigurasi hak akses.'
  } finally {
    saveLoading.value = false
  }
}

const getRoleBadgeSeverity = (roleName: string) => {
  switch (roleName) {
    case 'SUPER_ADMIN':
      return 'danger'
    case 'BENDAHARA':
      return 'success'
    case 'KETUA_RT':
      return 'info'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <TemplateList
    title="Kelola Role & Hak Akses (RBAC)"
    description="Petakan otorisasi modul fitur untuk setiap peran pengguna di sistem KasKita"
  >
    <!-- Notification Banner -->
    <div
      v-if="successMsg"
      class="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in"
    >
      <i class="pi pi-check-circle text-sm"></i>
      <span>{{ successMsg }}</span>
    </div>

    <div
      v-if="errorMsg"
      class="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in"
    >
      <i class="pi pi-exclamation-circle text-sm"></i>
      <span>{{ errorMsg }}</span>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr] gap-6 items-start">
      <!-- Left Column: Role List -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between px-2 pt-2">
            <div class="flex items-center gap-2">
              <div
                class="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"
              >
                <i class="pi pi-shield text-sm"></i>
              </div>
              <h2 class="text-sm font-bold text-slate-900">
                Daftar Peran (Roles)
              </h2>
            </div>
            <Button
              icon="pi pi-plus"
              severity="secondary"
              text
              size="small"
              title="Tambah Peran Baru"
              @click="openRoleDialog"
            />
          </div>
        </template>
        <template #content>
          <DataTable
            v-model:selection="selectedRole"
            :value="roles"
            :loading="loading"
            class="w-full mt-2"
            responsive-layout="scroll"
            row-hover
            selection-mode="single"
            @row-select="(e) => selectRole(e.data)"
          >
            <template #empty>
              <div class="text-center py-8 text-slate-400 text-xs">
                Tidak ada peran terdaftar.
              </div>
            </template>

            <Column field="name" header="Nama Peran">
              <template #body="{ data }">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-bold text-slate-800 text-xs tracking-wide font-mono"
                      >{{ data.name }}</span
                    >
                    <Tag
                      :value="data.name"
                      :severity="getRoleBadgeSeverity(data.name)"
                      class="!text-[9px] !font-bold px-1.5 py-0.5"
                    />
                  </div>
                  <span
                    class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed"
                    >{{ data.description || 'Tidak ada deskripsi.' }}</span
                  >
                </div>
              </template>
            </Column>

            <Column header="Izin Aktif" class="text-center w-28">
              <template #body="{ data }">
                <Tag
                  :value="`${data.rolePermissions?.length || 0} Izin`"
                  severity="secondary"
                  class="font-semibold text-xs py-0.5 px-2 bg-slate-100 border border-slate-200/60 text-slate-600"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Right Column: Role Permissions Map -->
      <Card>
        <template #content>
          <!-- State: No selected role -->
          <div
            v-if="!selectedRole"
            class="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6"
          >
            <div
              class="h-16 w-16 rounded-2xl bg-slate-50 text-slate-400 border border-dashed border-slate-200 flex items-center justify-center text-2xl"
            >
              <i class="pi pi-key"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">
                Pilih Peran Terlebih Dahulu
              </h3>
              <p class="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                Klik salah satu baris peran di tabel sebelah kiri untuk
                memetakan dan menyunting hak akses fiturnya.
              </p>
            </div>
          </div>

          <!-- State: Role selected -->
          <div v-else class="space-y-6 animate-fade-in">
            <!-- Details Header -->
            <div
              class="flex items-start justify-between border-b border-slate-100 pb-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900">
                    Atur Izin Akses Peran
                  </h3>
                  <Tag
                    :value="selectedRole.name"
                    :severity="getRoleBadgeSeverity(selectedRole.name)"
                    class="!text-[9px] !font-bold px-1.5 py-0.5"
                  />
                </div>
                <p
                  class="text-[11px] text-slate-500 mt-1 max-w-md leading-relaxed"
                >
                  {{
                    selectedRole.description ||
                    'Kelola mapping hak akses untuk peran ini.'
                  }}
                </p>
              </div>
              <div class="flex gap-1.5">
                <Button
                  label="Pilih Semua"
                  icon="pi pi-check"
                  size="small"
                  @click="handleSelectAll"
                />
                <Button
                  label="Reset"
                  severity="secondary"
                  icon="pi pi-refresh"
                  size="small"
                  @click="handleDeselectAll"
                />
              </div>
            </div>

            <!-- Search and Total Map Count -->
            <div
              class="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3"
            >
              <div class="relative flex-1">
                <i
                  class="pi pi-search absolute left-3 top-2.5 text-slate-400 text-xs"
                ></i>
                <InputText
                  v-model="searchQuery"
                  placeholder="Cari izin akses..."
                  class="w-full !pl-8 !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-lg text-xs"
                />
              </div>
              <div class="text-right">
                <span
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
                  >Terpilih</span
                >
                <span class="text-sm font-extrabold text-violet-600"
                  >{{ selectedPermissionIds.length }} /
                  {{ permissions.length }}</span
                >
              </div>
            </div>

            <!-- Permissions Checklist Grouped -->
            <div class="space-y-6 max-h-[380px] overflow-y-auto pr-1">
              <div
                v-for="(perms, category) in groupedPermissions"
                :key="category"
                class="space-y-2.5"
              >
                <!-- Category Heading -->
                <div
                  class="flex items-center gap-2 border-b border-slate-50 pb-1.5"
                >
                  <div
                    class="h-6 w-6 rounded-md flex items-center justify-center border"
                    :class="getCategoryColor(perms[0].name)"
                  >
                    <i
                      :class="getCategoryIcon(perms[0].name)"
                      class="text-[10px]"
                    ></i>
                  </div>
                  <h4 class="text-xs font-bold text-slate-700 tracking-wide">
                    {{ category }}
                  </h4>
                </div>

                <!-- Checkbox List -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                  <div
                    v-for="p in perms"
                    :key="p.id"
                    class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                    @click="
                      () => {
                        const idx = selectedPermissionIds.indexOf(p.id)
                        if (idx > -1) selectedPermissionIds.splice(idx, 1)
                        else selectedPermissionIds.push(p.id)
                      }
                    "
                  >
                    <Checkbox
                      v-model="selectedPermissionIds"
                      :value="p.id"
                      :input-id="p.id"
                      class="mt-0.5"
                      @click.stop
                    />
                    <div class="flex flex-col gap-0.5 pointer-events-none">
                      <span
                        class="text-[11px] font-bold text-slate-800 font-mono tracking-wide"
                        >{{ p.name }}</span
                      >
                      <span class="text-[10px] text-slate-500 leading-normal">{{
                        p.description
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Search Query Empty State -->
              <div
                v-if="Object.keys(groupedPermissions).length === 0"
                class="text-center py-10 text-slate-400 text-xs"
              >
                Tidak ada izin akses yang cocok dengan pencarian Anda.
              </div>
            </div>

            <!-- Action Button -->
            <div class="border-t border-slate-100 pt-4 flex justify-end">
              <Button
                :label="saveLoading ? 'Menyimpan...' : 'Simpan Hak Akses'"
                :disabled="saveLoading"
                icon="pi pi-save"
                @click="handleSave"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </TemplateList>

  <!-- Dialog Tambah Peran Baru -->
  <Dialog
    v-model:visible="isRoleDialogOpen"
    header="Tambah Peran Baru"
    :modal="true"
    :draggable="false"
    class="w-full max-w-md p-fluid rounded-2xl bg-white border border-slate-200 shadow-xl"
  >
    <form class="space-y-4 mt-2" @submit.prevent="handleCreateRole">
      <div class="flex flex-col gap-2">
        <label
          for="roleName"
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Nama Peran</label
        >
        <InputText
          id="roleName"
          v-model="newRoleName"
          placeholder="Contoh: Sekretaris RT"
          required
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
        />
        <span class="text-[10px] text-slate-400"
          >Nama peran akan otomatis diubah menjadi format UPPER_SNAKE_CASE (e.g.
          SEKRETARIS_RT).</span
        >
      </div>

      <div class="flex flex-col gap-2">
        <label
          for="roleDesc"
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Deskripsi (Opsional)</label
        >
        <InputText
          id="roleDesc"
          v-model="newRoleDescription"
          placeholder="Contoh: Hak akses mengelola surat-menyurat RT"
          class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
        />
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
        <Button
          type="button"
          label="Batal"
          severity="secondary"
          text
          @click="isRoleDialogOpen = false"
        />
        <Button
          type="submit"
          :label="createRoleLoading ? 'Menyimpan...' : 'Simpan'"
          :disabled="createRoleLoading"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
