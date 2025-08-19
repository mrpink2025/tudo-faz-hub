/**
 * ============================================================================
 * 🚀 TUDOFAZ HUB - MARKETPLACE PLATFORM
 * ============================================================================
 * 
 * Main entry point for the TudoFaz Hub marketplace application
 * Enterprise-grade marketplace with real-time features and PWA capabilities
 * 
 * @author by_arturalves
 * @version 1.0.0 
 * @year 2025
 * @description Advanced marketplace platform built with React 18 + TypeScript
 * 
 * Features:
 * - 🛒 Complete E-commerce system
 * - 💬 Real-time chat and notifications  
 * - 🎯 Advanced affiliate program
 * - 📊 Business analytics dashboard
 * - 🔒 Enterprise security (RLS, validation, rate limiting)
 * - 📱 Progressive Web App (PWA)
 * - 🌍 Multi-language support (PT, EN, ES, ZH)
 * - ⚡ Optimized performance (Core Web Vitals)
 * 
 * Tech Stack:
 * - Frontend: React 18, TypeScript, Tailwind CSS, Vite
 * - Backend: Supabase (PostgreSQL, Edge Functions, Real-time)
 * - Performance: React Query, Code Splitting, Service Workers
 * - Security: Row Level Security, Zod Validation, Rate Limiting
 * 
 * ============================================================================
 */

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultQueryConfig } from "@/utils/query-config";
import ErrorBoundaryClass from "@/components/ui/error-boundary";
import { HelmetProvider } from 'react-helmet-async';

// Configure React Query with optimizations
const queryClient = new QueryClient({
  defaultOptions: defaultQueryConfig,
});

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/sw.js')
      .then(() => {
        // Service Worker registrado com sucesso
      })
      .catch(() => {
        // Falha no registro do Service Worker
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundaryClass>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundaryClass>
);
