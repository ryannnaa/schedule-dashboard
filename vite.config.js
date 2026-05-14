import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'shift-scheduler' below with your actual GitHub repository name
// e.g. if your repo is github.com/yourname/my-app, set base: '/my-app/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
