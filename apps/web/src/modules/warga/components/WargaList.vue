<script setup lang="ts">
import { useWargaStore } from '../stores/warga'
import { useAuthStore } from '../../auth/stores/auth'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const wargaStore = useWargaStore()
const authStore = useAuthStore()
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between mb-2 px-2">
        <h2 class="text-lg font-semibold text-slate-900">
          Status Iuran Bulanan
        </h2>
      </div>
    </template>
    <template #content>
      <div class="divide-y divide-slate-100 px-2">
        <div
          v-for="warga in wargaStore.wargaList"
          :key="warga.id"
          class="flex items-center justify-between py-3 first:pt-0"
        >
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ warga.name }}</p>
            <p class="text-xs text-slate-500">
              No. Rumah: {{ warga.houseNumber }}
            </p>
          </div>
          <!-- Clickable button for Bendahara / Editor -->
          <Button
            v-if="authStore.hasPermission('warga:write')"
            :label="
              warga.status === 'sudah_bayar'
                ? 'Lunas'
                : warga.status === 'belum_bayar'
                  ? 'Belum Bayar'
                  : 'Menunggak'
            "
            :severity="
              warga.status === 'sudah_bayar'
                ? 'success'
                : warga.status === 'belum_bayar'
                  ? 'warn'
                  : 'danger'
            "
            outlined
            size="small"
            @click="wargaStore.toggleWargaStatus(warga.id)"
          />
          <!-- Static tag for other roles (Read-only) -->
          <Tag
            v-else
            :value="
              warga.status === 'sudah_bayar'
                ? 'Lunas'
                : warga.status === 'belum_bayar'
                  ? 'Belum Bayar'
                  : 'Menunggak'
            "
            :severity="
              warga.status === 'sudah_bayar'
                ? 'success'
                : warga.status === 'belum_bayar'
                  ? 'warn'
                  : 'danger'
            "
            class="rounded-full text-xs font-semibold px-3 py-1"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
