<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../modules/auth/stores/auth'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const handleGoBack = () => {
  if (authStore.userRole === 'SUPER_ADMIN') {
    router.push('/dashboard/admin')
  } else {
    router.push('/dashboard/overview')
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans antialiased text-slate-900"
  >
    <div
      class="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden"
    >
      <!-- Glow Effects -->
      <div
        class="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl"
      ></div>
      <div
        class="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-violet-500/5 blur-3xl"
      ></div>

      <!-- Icon Shield/Lock -->
      <div class="flex justify-center">
        <div
          class="h-20 w-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm relative group"
        >
          <div
            class="absolute inset-0 rounded-2xl bg-rose-500/5 scale-110 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <i class="pi pi-shield text-4xl animate-bounce"></i>
        </div>
      </div>

      <!-- Text Content -->
      <div class="space-y-2">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">
          403 - Akses Ditolak
        </h1>
        <p class="text-sm text-slate-500 leading-relaxed px-4">
          Maaf, Anda tidak memiliki izin hak akses yang diperlukan untuk melihat
          halaman ini. Silakan hubungi pengurus RT/RW atau administrator sistem.
        </p>
      </div>

      <!-- Action Button -->
      <div class="pt-2">
        <Button
          label="Kembali ke Dashboard"
          icon="pi pi-home"
          class="w-full"
          @click="handleGoBack"
        />
      </div>
    </div>
  </div>
</template>
