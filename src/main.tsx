import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

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

createRoot(document.getElementById("root")!).render(<App />);
