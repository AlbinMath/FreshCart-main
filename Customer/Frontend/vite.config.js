import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
    },
    // Normalize path casing warnings on Windows (Frontend vs frontend)
    resolve: {
        preserveSymlinks: false,
    },
})
