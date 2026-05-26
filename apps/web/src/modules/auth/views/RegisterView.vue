<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'

const authStore = useAuthStore()
const router = useRouter()

// Form states
const name = ref('')
const email = ref('')
const password = ref('')
const isNewTenant = ref(true)
const tenantCode = ref('')
const newTenantName = ref('')
const newTenantAddress = ref('')

const typeOptions = ref([
  { label: 'Buat Tenant Baru', value: true },
  { label: 'Gabung Tenant', value: false },
])

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) return

  if (isNewTenant.value && !newTenantName.value) return
  if (!isNewTenant.value && !tenantCode.value) return

  const payload = {
    name: name.value,
    email: email.value,
    pass: password.value,
    isNewTenant: isNewTenant.value,
    tenantCode: isNewTenant.value ? undefined : tenantCode.value,
    newTenantName: isNewTenant.value ? newTenantName.value : undefined,
    newTenantAddress: isNewTenant.value ? newTenantAddress.value : undefined,
  }

  const success = await authStore.register(payload)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden px-4 py-8"
  >
    <!-- Glow Background Effects -->
    <div
      class="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
    ></div>

    <div class="w-full max-w-md relative z-10">
      <!-- Glassmorphic Card -->
      <Card>
        <template #title>
          <!-- Logo Header -->
          <div class="flex items-center justify-between gap-2">
            <div
              class="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20"
            >
              <i class="pi pi-user-plus text-white text-xl"></i>
            </div>
            <div class="space-y-1">
              <h1
                class="text-2xl font-bold text-slate-900 tracking-tight text-right"
              >
                Daftar Akun
              </h1>
              <p class="text-xs text-slate-500 text-right">
                Daftarkan pengurus atau warga baru
              </p>
            </div>
          </div>
        </template>

        <template #content>
          <!-- Tab Selector -->
          <div class="mt-4 mb-6">
            <SelectButton
              v-model="isNewTenant"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              fluid
            />
          </div>

          <form class="space-y-5" @submit.prevent="handleRegister">
            <!-- Nama Lengkap -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Nama Lengkap</label
              >
              <div class="relative">
                <i
                  class="pi pi-user absolute left-3 top-3.5 text-slate-400 text-sm"
                ></i>
                <InputText
                  v-model="name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  class="w-full !pl-10 !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Alamat Email</label
              >
              <div class="relative">
                <i
                  class="pi pi-envelope absolute left-3 top-3.5 text-slate-400 text-sm"
                ></i>
                <InputText
                  v-model="email"
                  type="email"
                  placeholder="name@example.com"
                  class="w-full !pl-10 !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >Kata Sandi</label
              >
              <div class="relative">
                <i
                  class="pi pi-lock absolute left-3 top-3.5 text-slate-400 text-sm"
                ></i>
                <InputText
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full !pl-10 !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <!-- Conditional Section: Buat Tenant Baru -->
            <div
              v-if="isNewTenant"
              class="space-y-4 pt-2 border-t border-slate-100"
            >
              <p
                class="text-xs font-bold text-violet-600 uppercase tracking-wider"
              >
                Informasi Tenant Baru
              </p>

              <!-- Nama Tenant -->
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >Nama RT/RW/Desa/Tenant</label
                >
                <InputText
                  v-model="newTenantName"
                  placeholder="Contoh: RT 05 RW 12 Sukamaju"
                  class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                  required
                />
              </div>

              <!-- Alamat -->
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >Alamat (Opsional)</label
                >
                <InputText
                  v-model="newTenantAddress"
                  placeholder="Contoh: Kecamatan Caringin, Bogor"
                  class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm"
                />
              </div>
            </div>

            <!-- Conditional Section: Gabung Tenant -->
            <div v-else class="space-y-4 pt-2 border-t border-slate-100">
              <p
                class="text-xs font-bold text-indigo-600 uppercase tracking-wider"
              >
                Gabung Tenant Terdaftar
              </p>

              <!-- Kode Tenant -->
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >Kode Tenant / RW / Desa</label
                >
                <InputText
                  v-model="tenantCode"
                  placeholder="Contoh: DS-SUKAMAJU"
                  class="w-full !bg-white !border-slate-200 !text-slate-900 placeholder-slate-400 rounded-xl text-sm font-mono uppercase"
                  required
                />
                <span class="text-[10px] text-slate-400"
                  >Mintalah Kode Tenant ini pada Bendahara atau Pengurus RW
                  Anda.</span
                >
              </div>
            </div>

            <!-- Error Banner -->
            <div
              v-if="authStore.error"
              class="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs text-center font-medium"
            >
              {{ authStore.error }}
            </div>

            <Button
              type="submit"
              :label="authStore.loading ? 'Sedang Mendaftar...' : 'Daftar'"
              :disabled="authStore.loading"
              icon="pi pi-user-plus"
              class="w-full"
            />

            <!-- Back to Login Link -->
            <div class="text-center">
              <router-link
                to="/login"
                class="text-xs text-violet-600 hover:underline font-semibold"
              >
                Sudah punya akun? Masuk di sini
              </router-link>
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>
