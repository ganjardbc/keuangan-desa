<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../modules/auth/stores/auth'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(false)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const isActive = (path: string) =>
  route.path === path ||
  (path === '/dashboard/overview' && route.path === '/dashboard')

const menuItems = [
  {
    label: 'Overview',
    icon: 'pi pi-home',
    to: '/dashboard/overview',
    permission: 'transaction:read',
  },

  // Super Admin Menus
  {
    label: 'Panel Admin',
    icon: 'pi pi-shield',
    to: '/dashboard/admin',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Kelola Tenant',
    icon: 'pi pi-home',
    to: '/dashboard/admin/tenants',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Kelola User',
    icon: 'pi pi-users',
    to: '/dashboard/admin/users',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Kelola Hak Akses',
    icon: 'pi pi-key',
    to: '/dashboard/admin/roles',
    roles: ['SUPER_ADMIN'],
  },

  // Tenant Specific Menus
  {
    label: 'Kelola Transaksi',
    icon: 'pi pi-list',
    to: '/dashboard/transactions',
    permission: 'transaction:read',
  },
  {
    label: 'Kelola Warga',
    icon: 'pi pi-users',
    to: '/dashboard/warga',
    permission: 'warga:read',
  },
  {
    label: 'Rekap Iuran',
    icon: 'pi pi-calendar',
    to: '/dashboard/rekap-iuran',
    permission: 'warga:read',
  },
  {
    label: 'Kelola Kas',
    icon: 'pi pi-wallet',
    to: '/dashboard/kas',
    permission: 'transaction:read',
  },
  {
    label: 'Anggaran Kegiatan',
    icon: 'pi pi-chart-bar',
    to: '/dashboard/projects',
    permission: 'transaction:read',
  },
  {
    label: 'Pengaturan Iuran',
    icon: 'pi pi-cog',
    to: '/dashboard/settings-iuran',
    permission: 'warga:write',
  },
  {
    label: 'Format Kuitansi',
    icon: 'pi pi-file-edit',
    to: '/dashboard/settings-receipt',
    permission: 'warga:write',
  },

  // Shared Logs
  {
    label: 'Log Audit',
    icon: 'pi pi-history',
    to: '/dashboard/audit-log',
    permission: 'transaction:read',
    allowSuperAdmin: true,
  },
]

// Filter menu items based on permission or role restrictions
const filteredMenuItems = computed(() => {
  const role = authStore.userRole

  if (role === 'SUPER_ADMIN') {
    return menuItems.filter(
      (item) =>
        (item.roles && item.roles.includes('SUPER_ADMIN')) ||
        item.allowSuperAdmin,
    )
  }

  return menuItems.filter((item) => {
    // Hide super-admin only menus
    if (item.roles && item.roles.includes('SUPER_ADMIN')) {
      return false
    }
    // Check permission
    if (item.permission) {
      return authStore.hasPermission(item.permission)
    }
    return true
  })
})
</script>

<template>
  <div class="dashboard-view">
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-backdrop"
      @click="isSidebarOpen = false"
    ></div>

    <div class="dashboard-layout">
      <aside
        class="sidebar"
        :class="
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        "
      >
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <i class="pi pi-wallet text-white text-lg"></i>
          </div>
          <div class="flex-1">
            <h1 class="sidebar-title">KasKita</h1>
          </div>
          <!-- Close Button for Mobile -->
          <div class="md:hidden">
            <Button
              icon="pi pi-times"
              text
              severity="secondary"
              @click="isSidebarOpen = false"
            />
          </div>
        </div>

        <nav class="sidebar-nav">
          <router-link
            v-for="item in filteredMenuItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="
              isActive(item.to)
                ? 'bg-violet-50 text-violet-700 border border-violet-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            "
            @click="isSidebarOpen = false"
          >
            <i :class="item.icon" class="text-xs"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </aside>

      <section class="content-section">
        <main class="content-main">
          <header class="header">
            <div class="topbar">
              <div class="topbar-left">
                <!-- Sidebar Toggle Button for Mobile -->
                <div class="md:hidden">
                  <Button
                    icon="pi pi-bars"
                    text
                    severity="secondary"
                    @click="isSidebarOpen = true"
                  />
                </div>

                <!-- Clickable Profile Header Block -->
                <div
                  class="cursor-pointer hover:bg-slate-50 border border-slate-100 hover:border-slate-200 px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-2.5"
                  title="Lihat Profil Saya"
                  @click="router.push('/dashboard/profile')"
                >
                  <div
                    class="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none"
                  >
                    {{ authStore.user?.name?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div class="topbar-user select-none text-left">
                    <p class="topbar-name">
                      {{ authStore.user?.name }}
                    </p>
                    <p class="topbar-role">
                      {{ authStore.userRole }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="topbar-right">
                <Tag
                  :value="authStore.userRole"
                  severity="secondary"
                  class="font-semibold text-xs py-1 px-3"
                />
                <Button
                  icon="pi pi-sign-out"
                  severity="danger"
                  text
                  size="small"
                  title="Keluar"
                  @click="handleLogout"
                />
              </div>
            </div>
          </header>

          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </main>
      </section>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* Layout */
.dashboard-view {
  @apply min-h-screen bg-slate-50 text-slate-900 font-sans antialiased;
}

.dashboard-layout {
  @apply md:grid md:grid-cols-[280px_1fr] md:min-h-screen;
}

/* Sidebar Backdrop */
.sidebar-backdrop {
  @apply fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity duration-300;
}

/* Sidebar */
.sidebar {
  @apply fixed inset-y-0 left-0 z-50 w-[280px] h-dvh flex flex-col bg-white border-r border-gray-200
    transition-transform duration-300
    md:sticky md:top-0 md:translate-x-0 md:z-0;
}

.sidebar-header {
  @apply flex items-center gap-3 p-4;
}

.sidebar-logo {
  @apply h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500
    flex items-center justify-center shadow-lg shadow-indigo-500/20;
}

.sidebar-title {
  @apply text-lg font-bold text-slate-900 tracking-tight;
}

.sidebar-nav {
  @apply flex-1 flex flex-col gap-1 overflow-y-auto p-4;
}

.nav-link {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200;
}

/* Main Content */
.content-section {
  @apply flex-1 p-4 md:p-6;
}

.content-main {
  @apply max-w-6xl mx-auto space-y-6;
}

/* Header */
.header {
  @apply sticky top-6 z-10 bg-white p-4 rounded-xl shadow-md;
}

/* Topbar */
.topbar {
  @apply w-full flex justify-between items-center gap-4;
}

.topbar-left {
  @apply flex items-center gap-3;
}

.topbar-right {
  @apply flex items-center gap-3;
}

.topbar-user {
  @apply hidden sm:block;
}

.topbar-name {
  @apply text-sm font-semibold text-slate-900;
}

.topbar-role {
  @apply text-[10px] text-slate-500 font-semibold uppercase tracking-wider;
}

/* Page Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
