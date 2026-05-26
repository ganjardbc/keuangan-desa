import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../modules/auth/stores/auth'
import LoginView from '../modules/auth/views/LoginView.vue'
import RegisterView from '../modules/auth/views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import OverviewView from '../views/OverviewView.vue'
import WargaManagementView from '../modules/warga/views/WargaManagementView.vue'
import IuranSettingsView from '../modules/finance/views/IuranSettingsView.vue'
import RekapIuranView from '../modules/warga/views/RekapIuranView.vue'
import KasManagementView from '../modules/finance/views/KasManagementView.vue'
import ProjectManagementView from '../modules/finance/views/ProjectManagementView.vue'
import PublicTransparencyView from '../modules/finance/views/PublicTransparencyView.vue'
import PrintReportView from '../modules/finance/views/PrintReportView.vue'
import AuditLogView from '../modules/finance/views/AuditLogView.vue'
import TransactionsView from '../modules/finance/views/TransactionsView.vue'
import ReceiptSettingsView from '../modules/finance/views/ReceiptSettingsView.vue'
import AdminDashboardView from '../modules/admin/views/AdminDashboardView.vue'
import TenantManagementView from '../modules/admin/views/TenantManagementView.vue'
import UserManagementView from '../modules/admin/views/UserManagementView.vue'
import RoleManagementView from '../modules/admin/views/RoleManagementView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard/overview',
      },
      {
        path: 'overview',
        name: 'overview',
        component: OverviewView,
        meta: { permission: 'transaction:read' },
      },
      {
        path: 'transactions',
        name: 'transactions',
        component: TransactionsView,
        meta: { permission: 'transaction:read' },
      },
      {
        path: 'warga',
        name: 'warga',
        component: WargaManagementView,
        meta: { permission: 'warga:read' },
      },
      {
        path: 'rekap-iuran',
        name: 'rekap-iuran',
        component: RekapIuranView,
        meta: { permission: 'warga:read' },
      },
      {
        path: 'kas',
        name: 'kas',
        component: KasManagementView,
        meta: { permission: 'transaction:read' },
      },
      {
        path: 'projects',
        name: 'projects',
        component: ProjectManagementView,
        meta: { permission: 'transaction:read' },
      },
      {
        path: 'settings-iuran',
        name: 'settings-iuran',
        component: IuranSettingsView,
        meta: { permission: 'warga:write' },
      },
      {
        path: 'settings-receipt',
        name: 'settings-receipt',
        component: ReceiptSettingsView,
        meta: { permission: 'warga:write' },
      },
      {
        path: 'audit-log',
        name: 'audit-log',
        component: AuditLogView,
        meta: { permission: 'transaction:read' },
      },
      {
        path: 'admin',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { requiresSuperAdmin: true },
      },
      {
        path: 'admin/tenants',
        name: 'admin-tenants',
        component: TenantManagementView,
        meta: { requiresSuperAdmin: true },
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: UserManagementView,
        meta: { requiresSuperAdmin: true },
      },
      {
        path: 'admin/roles',
        name: 'admin-roles',
        component: RoleManagementView,
        meta: { requiresSuperAdmin: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
      },
    ],
  },
  {
    path: '/dashboard/print-report',
    name: 'print-report',
    component: PrintReportView,
    meta: { requiresAuth: true },
  },
  {
    path: '/transparansi/:tenantCode',
    name: 'transparansi-publik',
    component: PublicTransparencyView,
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: UnauthorizedView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.requiresSuperAdmin && authStore.userRole !== 'SUPER_ADMIN') {
    return next('/unauthorized')
  }

  // Check permission requirement
  if (
    to.meta.permission &&
    !authStore.hasPermission(to.meta.permission as string)
  ) {
    return next('/unauthorized')
  }

  if (authStore.isAuthenticated && authStore.userRole === 'SUPER_ADMIN') {
    if (
      to.path === '/login' ||
      to.path === '/dashboard' ||
      to.path === '/dashboard/' ||
      to.path === '/'
    ) {
      return next('/dashboard/admin')
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  next()
})

export default router
