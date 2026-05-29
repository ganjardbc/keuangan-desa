<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

withDefaults(
  defineProps<{
    errorMessage: string | null
    title?: string
    description?: string
  }>(),
  {
    title: 'Apakah Anda yakin?',
    description: 'Tindakan ini tidak dapat dibatalkan.',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const visible = defineModel<boolean>('visible', { default: false })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Konfirmasi Hapus"
    modal
    class="w-full max-w-sm bg-white border border-slate-200 rounded-2xl text-slate-900"
  >
    <div class="pt-4 flex flex-col items-center text-center gap-3">
      <div
        class="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600"
      >
        <i class="pi pi-exclamation-triangle text-xl"></i>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900">{{ title }}</p>
        <p class="text-xs text-slate-500 leading-relaxed">
          {{ description }}
        </p>
      </div>
      <p v-if="errorMessage" class="text-xs text-rose-600 font-semibold mt-2">
        {{ errorMessage }}
      </p>
    </div>

    <template #footer>
      <div class="flex items-center gap-3 justify-center mt-6 w-full">
        <Button
          label="Batal"
          severity="secondary"
          text
          class="w-full"
          @click="visible = false"
        />
        <Button
          label="Hapus"
          severity="danger"
          class="w-full"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </Dialog>
</template>
