<template>
  <div class="template-list">
    <!-- Header -->
    <div class="template-list__header">
      <div class="template-list__content">
        <slot name="prepend" />
        <h1 class="template-list__title">
          {{ title }}
        </h1>
        <p v-if="description" class="template-list__subtitle">
          {{ description }}
        </p>
      </div>
      <div class="template-list__actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
interface TemplateListProps {
  title: string
  description: string
}

defineProps<TemplateListProps>()
</script>

<style scoped>
@reference "tailwindcss";

.template-list {
  @apply w-full space-y-6;
}

.template-list__header {
  @apply flex flex-col lg:flex-row items-center justify-between gap-4;
}

.template-list__title {
  @apply text-xl font-bold text-slate-900;
}

.template-list__subtitle {
  @apply text-xs text-slate-500;
}

.template-list__actions {
  @apply w-full lg:w-auto flex flex-col lg:flex-row gap-2 justify-end;
}

.template-list__content {
  @apply w-full lg:w-auto flex-1;
}
</style>
