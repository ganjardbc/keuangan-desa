<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../modules/auth/stores/auth'
import TemplateList from '../components/TemplateList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isSuperAdmin = computed(() => authStore.userRole === 'SUPER_ADMIN')
const userInitial = computed(
  () => user.value?.name?.charAt(0).toUpperCase() || 'U',
)

const isCopied = ref(false)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Gagal menyalin text: ', err)
  }
}
</script>

<template>
  <TemplateList
    title="Profil Saya"
    description="Lihat profil pribadi Anda dan detail komunitas tempat Anda terdaftar"
  >
    <!-- Header -->
    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      <!-- Left Column: User Profile -->
      <Card>
        <template #content>
          <!-- Avatar Initial -->
          <div class="flex justify-center mt-2">
            <div
              class="h-24 w-24 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/20 relative group"
            >
              <div
                class="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
              {{ userInitial }}
            </div>
          </div>

          <!-- User Basic Info -->
          <div class="space-y-1 flex flex-col items-center">
            <h2 class="text-lg font-bold text-slate-900 tracking-tight text-center">
              {{ user?.name }}
            </h2>
            <p class="text-xs text-slate-500 font-mono text-center">{{ user?.email }}</p>
            <div class="pt-2">
              <Tag
                :value="user?.role"
                severity="secondary"
                class="font-bold text-xs uppercase py-1 px-3.5 tracking-wider bg-slate-100 text-slate-700 rounded-full"
              />
            </div>
          </div>

          <div class="border-t border-slate-100 w-full mt-6 pt-6 text-left">
            <p
              class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3"
            >
              Hak Akses Aktif
            </p>
            <div
              v-if="user?.permissions && user.permissions.length > 0"
              class="flex flex-wrap gap-1.5"
            >
              <Tag
                v-for="perm in user.permissions"
                :key="perm"
                :value="perm"
                severity="info"
                class="!bg-indigo-50 !text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded"
              />
            </div>
            <div v-else-if="isSuperAdmin">
              <Tag
                value="Akses Penuh (Bypass)"
                severity="danger"
                class="text-[10px] font-bold px-2 py-0.5 rounded"
              />
            </div>
            <div v-else class="text-xs text-slate-400 italic">
              Tidak ada izin hak akses khusus yang disematkan.
            </div>
          </div>
        </template>
      </Card>

      <!-- Right Column: Tenant Info -->
      <Card
        v-if="!isSuperAdmin && user?.tenant"
        class="w-full"
      >
        <template #content>
          <div class="space-y-6">
            <div>
              <h3
                class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2"
              >
                Informasi Komunitas
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Detail profil wilayah administrasi / RT / RW Anda
              </p>
            </div>

            <!-- Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <p
                  class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  Nama Komunitas
                </p>
                <p class="text-base font-bold text-slate-800">
                  {{ user.tenant.name }}
                </p>
              </div>

              <div class="space-y-1">
                <p
                  class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  Alamat Wilayah
                </p>
                <p class="text-base font-medium text-slate-700">
                  {{ user.tenant.address || '-' }}
                </p>
              </div>
            </div>

            <!-- Tenant Code Panel with Copy Feature -->
            <div
              class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 relative overflow-hidden"
            >
              <div
                class="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-violet-500/5 blur-2xl"
              ></div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold text-slate-900 tracking-wide">
                    Kode Gabung Komunitas
                  </p>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    Berikan kode ini kepada warga baru agar dapat mendaftar dan
                    bergabung ke wilayah ini
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="isCopied"
                    class="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse"
                    >Tersalin!</span
                  >
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    title="Salin Kode"
                    @click="copyToClipboard(user.tenant.code || '')"
                  />
                </div>
              </div>

              <div
                class="flex items-center mt-2 bg-white border border-slate-200 rounded-xl p-3 justify-center text-center"
              >
                <span
                  class="text-lg font-black font-mono text-indigo-650 tracking-widest select-all"
                >
                  {{ user.tenant.code || '-' }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Super Admin System View -->
      <Card
        v-else-if="isSuperAdmin"
        class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-2 flex flex-col justify-between"
      >
        <template #content>
          <div class="space-y-6">
            <div>
              <h3
                class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2"
              >
                Informasi Sistem Global
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Anda masuk sebagai Administrator Utama sistem KasKita
              </p>
            </div>

            <!-- Features Info for Super Admin -->
            <div
              class="bg-indigo-50/50 border border-indigo-100/60 p-5 rounded-2xl space-y-4"
            >
              <div class="flex items-start gap-3">
                <div
                  class="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <i class="pi pi-shield text-xs"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">
                    Hak Akses Penuh Sistem
                  </h4>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    Sebagai Super Admin, Anda berwenang mengelola pendaftaran
                    seluruh Komunitas (Tenant), registrasi Pengurus (Users),
                    serta mengatur pemetaan RBAC (Role-Based Access Control)
                    lintas wilayah harian.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <i class="pi pi-history text-xs"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">
                    Pemantauan Audit Trail
                  </h4>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    Anda dapat memantau setiap log aktivitas penting (seperti
                    pendaftaran tenant baru, modifikasi RBAC, login pengguna)
                    melalui portal Log Audit secara global.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </TemplateList>
</template>
