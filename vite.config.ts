import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'https://liquidation-api-1001101479084.asia-east1.run.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
});



