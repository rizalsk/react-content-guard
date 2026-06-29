import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@rizalsk/react-content-guard': path.resolve(__dirname, '../dist/index.mjs'),
      // Force single React instance — prevents "two Reacts" conflict
      // between the library's devDependency and test-app's React 19
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'zustand': path.resolve(__dirname, 'node_modules/zustand'),
    },
  },
})
