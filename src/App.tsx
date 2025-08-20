/**
 * ============================================================================
 * 🏗️ TUDOFAZ HUB - MAIN APPLICATION COMPONENT
 * ============================================================================
 * 
 * Core application router and provider setup for the TudoFaz marketplace
 * Handles routing, global state, and application-wide components
 * 
 * @author by_arturalves
 * @component App
 * @version 1.0.0
 * @year 2025
 * 
 * Architecture:
 * - 📡 React Query for server state management
 * - 🛣️ React Router for client-side routing  
 * - 🔔 Toast notifications system
 * - 🎨 Theme and styling providers
 * - 📊 Analytics and telemetry
 * - 🔒 Authentication routing guards
 * - 📱 PWA capabilities integration
 * 
 * Performance Features:
 * - ⚡ Code splitting on route level
 * - 🎯 Lazy loading of components
 * - 📈 Real-time performance monitoring
 * - 🔄 Service worker integration
 * 
 * ============================================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Checkout from "./pages/Checkout";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import PasswordReset from "./pages/PasswordReset";
import NewPassword from "./pages/NewPassword";
import NotFound from "./pages/NotFound";
import ListingDetail from "./pages/ListingDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminListings from "./pages/admin/Listings";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminMonitoring from "./pages/admin/Monitoring";
import AdminSEO from "./pages/admin/SEO";
import AdminSalesReports from "./pages/admin/SalesReports";
import Credits from "./pages/Credits";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NearbySearch from "./pages/NearbySearch";
import EmailConfirmation from "./pages/EmailConfirmation";
import AffiliateCenter from "./pages/AffiliateCenter";
import AdvertiserCenter from "./pages/AdvertiserCenter";
import SellerDashboard from "./pages/SellerDashboard";
import OrdersManagement from "./pages/OrdersManagement";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import { BrandingLoader } from "./hooks/useBranding";
import { MessageNotifications } from "./components/notifications/MessageNotifications";
import { AffiliateNotifications } from "./components/notifications/AffiliateNotifications";
import { TelemetryProvider } from "./components/monitoring/TelemetryProvider";
import DynamicFavicon from "./components/branding/DynamicFavicon";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { SearchProvider } from "./contexts/SearchContext";
import { useNativePushNotifications } from "./hooks/useNativePushNotifications";
import { useAppUpdater } from "./hooks/useAppUpdater";
import "./i18n";

// Componente para inicializar capacidades nativas
const NativeCapabilities = () => {
  useNativePushNotifications();
  useAppUpdater(); // Adicionar verificação de atualizações automáticas
  return null;
};

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SearchProvider>
          <TelemetryProvider>
            <BrandingLoader />
            <NativeCapabilities />
            <DynamicFavicon />
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/publicar" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/criar-anuncio" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/editar-anuncio/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
            <Route path="/anuncio/:id" element={<ListingDetail />} />
            <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
            <Route path="/mensagens" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/creditos" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
            <Route path="/afiliados" element={<ProtectedRoute><AffiliateCenter /></ProtectedRoute>} />
            <Route path="/anunciante" element={<ProtectedRoute><AdvertiserCenter /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><OrdersManagement /></ProtectedRoute>} />
            <Route path="/proximos" element={<NearbySearch />} />
            <Route path="/pagamento-sucesso" element={<PaymentSuccess />} />
            <Route path="/pagamento-cancelado" element={<PaymentCanceled />} />
            <Route path="/entrar" element={<Auth />} />
            <Route path="/esqueceu-senha" element={<PasswordReset />} />
            <Route path="/nova-senha" element={<NewPassword />} />
            <Route path="/confirmar-email" element={<EmailConfirmation />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="monitoring" element={<AdminMonitoring />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="sales" element={<AdminSalesReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            <MessageNotifications />
            <AffiliateNotifications />
            <PWAInstallPrompt />
            <Footer />
          </TelemetryProvider>
        </SearchProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
