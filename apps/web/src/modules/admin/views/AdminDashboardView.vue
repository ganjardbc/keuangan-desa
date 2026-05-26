<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import api from '../../../lib/axios'
import TemplateList from '../../../components/TemplateList.vue'

const router = useRouter()
const tenantsCount = ref(0)
const usersCount = ref(0)
const loading = ref(false)

const fetchAdminStats = async () => {
  loading.value = true
  try {
    const [tenantsRes, usersRes] = await Promise.all([
      api.get('/admin/tenants'),
      api.get('/admin/users'),
    ])
    tenantsCount.value = tenantsRes.data.length
    usersCount.value = usersRes.data.length
  } catch (err) {
    console.error('Gagal memuat stats admin:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAdminStats()
})
</script>

<template>
  <TemplateList
    title="Portal Control Super Admin"
    description="Pusat konfigurasi multi-tenant, manajemen pengguna, dan hak akses sistem"
  >
    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <template #content>
          <div
            class="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-all duration-300"
          ></div>
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Total Tenant Aktif
              </p>
              <h3
                class="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight"
              >
                {{ tenantsCount }} Desa / RT
              </h3>
            </div>
            <div
              class="p-3 rounded-xl bg-violet-50 text-violet-600 text-xl flex items-center justify-center"
            >
              <i class="pi pi-home"></i>
            </div>
          </div>
          <div class="mt-6 flex gap-2">
            <Button
              label="Kelola Tenant"
              icon="pi pi-arrow-right"
              icon-pos="right"
              size="small"
              @click="router.push('/dashboard/admin/tenants')"
            />
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div
            class="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all duration-300"
          ></div>
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Total Pengguna Terdaftar
              </p>
              <h3
                class="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight"
              >
                {{ usersCount }} User
              </h3>
            </div>
            <div
              class="p-3 rounded-xl bg-indigo-50 text-indigo-600 text-xl flex items-center justify-center"
            >
              <i class="pi pi-users"></i>
            </div>
          </div>
          <div class="mt-6 flex gap-2">
            <Button
              label="Kelola User"
              icon="pi pi-arrow-right"
              icon-pos="right"
              size="small"
              @click="router.push('/dashboard/admin/users')"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Administrative Quick Access -->
    <Card>
      <template #title>
        <h2 class="text-sm font-bold text-slate-900 px-2 mb-2">
          Panduan Super Admin
        </h2>
      </template>
      <template #content>
        <div class="space-y-4 text-xs text-slate-600 leading-relaxed px-2">
          <p>
            Selamat datang di panel kontrol pengawas **KasKita**. Sebagai Super
            Admin, Anda memiliki wewenang penuh lintas tenant:
          </p>
          <ul class="list-disc pl-4 space-y-2">
            <li>
              <strong>Kelola Tenant:</strong> Buat desa, RT, atau RW baru di
              sistem, tetapkan kode unik yang digunakan warga untuk melihat
              portal transparansi publik.
            </li>
            <li>
              <strong>Kelola User:</strong> Daftarkan pengurus baru, tetapkan
              role mereka (Bendahara / Ketua RT), dan tentukan tenant tempat
              mereka bernaung.
            </li>
            <li>
              <strong>Pengawasan Keamanan:</strong> Semua tindakan administratif
              yang Anda lakukan akan dicatat secara otomatis dalam log audit
              sistem untuk pertanggungjawaban keamanan.
            </li>
          </ul>
        </div>
      </template>
    </Card>
  </TemplateList>
</template>
