<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showMockAccounts = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) return
  const success = await authStore.login(email.value, password.value)
  if (success) {
    if (authStore.userRole === 'SUPER_ADMIN') {
      router.push('/dashboard/admin')
    } else {
      router.push('/dashboard')
    }
  }
}

const mockAccounts = [
  {
    name: 'Super Admin',
    email: 'superadmin@kaskita.com',
    password: 'superadmin123',
    role: 'SUPER ADMIN',
    severity: 'danger' as const,
  },
  {
    name: 'Bendahara Budi',
    email: 'bendahara@kaskita.com',
    password: 'bendahara123',
    role: 'BENDAHARA',
    severity: 'success' as const,
  },
  {
    name: 'Pak RT Joko',
    email: 'rt@kaskita.com',
    password: 'rt123',
    role: 'KETUA RT',
    severity: 'warn' as const,
  },
  {
    name: 'Santi (Sekretaris)',
    email: 'sekretaris@kaskita.com',
    password: 'sekretaris123',
    role: 'SEKRETARIS RT',
    severity: 'info' as const,
  },
  {
    name: 'Pak RW Bambang',
    email: 'rw@kaskita.com',
    password: 'rw123',
    role: 'KETUA RW',
    severity: 'warn' as const,
  },
  {
    name: 'Warga Rian',
    email: 'warga@kaskita.com',
    password: 'warga123',
    role: 'WARGA',
    severity: 'secondary' as const,
  },
]

// Quick login fill
const fillMockData = (mockEmail: string, mockPass: string) => {
  email.value = mockEmail
  password.value = mockPass
  showMockAccounts.value = false
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden px-4"
  >
    <!-- Glow Background Effects -->
    <div
      class="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
    ></div>

    <div class="w-full max-w-sm relative z-10">
      <!-- Glassmorphic Card -->
      <Card>
        <template #title>
          <!-- Logo Header -->
          <div class="flex items-center justify-between gap-2">
            <div
              class="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20"
            >
              <i class="pi pi-wallet text-white text-xl"></i>
            </div>
            <div class="space-y-1">
              <h1
                class="text-2xl font-bold text-slate-900 tracking-tight text-right"
              >
                KasKita
              </h1>
              <p class="text-xs text-slate-500 text-right">
                Pencatatan Keuangan Desa & Kampung
              </p>
            </div>
          </div>
        </template>
        <template #content>
          <form class="space-y-5 mt-4" @submit.prevent="handleLogin">
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
                  placeholder="name@kaskita.com"
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

            <!-- Error Banner -->
            <div
              v-if="authStore.error"
              class="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs text-center font-medium"
            >
              {{ authStore.error }}
            </div>

            <Button
              type="submit"
              :label="authStore.loading ? 'Sedang Masuk...' : 'Masuk'"
              :disabled="authStore.loading"
              icon="pi pi-sign-in"
              class="w-full"
            />

            <div class="text-center pt-2">
              <router-link
                to="/register"
                class="text-xs text-violet-600 hover:underline font-semibold"
              >
                Belum punya akun? Daftar di sini
              </router-link>
            </div>
          </form>
        </template>
      </Card>
    </div>

    <!-- Floating Button for Mock Accounts -->
    <button
      type="button"
      class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-none focus:outline-none"
      title="Akun Demo (Testing)"
      @click="showMockAccounts = true"
    >
      <i class="pi pi-users text-xl"></i>
    </button>

    <!-- Dialog for Mock Accounts -->
    <Dialog
      v-model:visible="showMockAccounts"
      header="Pilih Akun Demo"
      modal
      :draggable="false"
      class="w-full max-w-md bg-white border border-slate-200 rounded-2xl text-slate-900 mx-4"
    >
      <div class="space-y-3 pt-2">
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">
          Silakan pilih salah satu akun demo di bawah ini untuk mengisi formulir
          login secara otomatis.
        </p>

        <div class="space-y-2">
          <button
            v-for="account in mockAccounts"
            :key="account.email"
            type="button"
            class="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
            @click="fillMockData(account.email, account.password)"
          >
            <div class="space-y-0.5">
              <span
                class="text-slate-700 font-semibold group-hover:text-slate-900 text-sm"
              >
                {{ account.name }}
              </span>
              <p class="text-[10px] text-slate-500 font-mono">
                {{ account.email }}
              </p>
            </div>
            <Tag
              :value="account.role"
              :severity="account.severity"
              class="text-[9px]"
            />
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
