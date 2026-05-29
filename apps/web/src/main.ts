import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import router from './router'
import { registerRouter } from './lib/axios'
import './style.css'
import 'primeicons/primeicons.css'
import App from './App.vue'

// Register router globally in api axios instance for navigation interceptors
registerRouter(router)

const MetaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#edf5ff',
      100: '#d6e9ff',
      200: '#b5d8ff',
      300: '#83beff',
      400: '#489cff',
      500: '#0064e0', // primary
      600: '#0457cb', // primary-deep / hover
      700: '#004bb3',
      800: '#003f99',
      900: '#003580',
      950: '#001d4d',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#0064e0',
          inverseColor: '#ffffff',
          hoverColor: '#0457cb',
          activeColor: '#0457cb',
        },
        highlight: {
          background: '#edf5ff',
          focusBackground: '#d6e9ff',
          color: '#0064e0',
          focusColor: '#0064e0',
        },
      },
      dark: {
        primary: {
          color: '#83beff',
          inverseColor: '#001d4d',
          hoverColor: '#b5d8ff',
          activeColor: '#b5d8ff',
        },
        highlight: {
          background: '#001d4d',
          focusBackground: '#003580',
          color: '#83beff',
          focusColor: '#83beff',
        },
      },
    },
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: MetaPreset,
    options: {
      darkModeSelector: '.p-dark',
    },
  },
})
app.mount('#app')
