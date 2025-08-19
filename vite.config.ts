/**
 * ============================================================================
 * ⚙️ TUDOFAZ HUB - VITE BUILD CONFIGURATION
 * ============================================================================
 * 
 * Vite configuration for optimal development and production builds
 * Includes performance optimizations, code splitting, and development tools
 * 
 * @author by_arturalves
 * @file vite.config.ts
 * @version 1.0.0
 * @year 2025
 * 
 * Build Optimizations:
 * - 📦 Manual chunk splitting for better caching
 * - 🔄 Hash-based filenames for cache busting
 * - ⚡ React SWC for faster builds
 * - 🎯 Path aliases for clean imports
 * - 🛠️ Development-specific tooling
 * 
 * Performance Features:
 * - Vendor chunk separation
 * - UI library chunking
 * - Router-specific chunking
 * - Asset optimization
 * 
 * ============================================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        },
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
}));
