import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import router from './router'
import { registerRouter } from './lib/axios'
import './style.css'
import 'primeicons/primeicons.css'
import App from './App.vue'

// Register router globally in api axios instance for navigation interceptors
registerRouter(router)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.p-dark',
    },
  },
})
app.mount('#app')
