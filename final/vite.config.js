import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    hmr: {
      overlay: false // Disable HMR overlay that can cause loops
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'] // Ignore unnecessary files
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: [] // Add any problematic dependencies here if needed
  }
});
