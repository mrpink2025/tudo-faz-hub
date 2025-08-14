import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultQueryConfig } from "@/utils/query-config";
import ErrorBoundaryClass from "@/components/ui/error-boundary";

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
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundaryClass>
);
