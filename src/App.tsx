import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import CreateListing from "./pages/CreateListing";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ListingDetail from "./pages/ListingDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminListings from "./pages/admin/Listings";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminMonitoring from "./pages/admin/Monitoring";
import AdminSEO from "./pages/admin/SEO";
import Credits from "./pages/Credits";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NearbySearch from "./pages/NearbySearch";
import EmailConfirmation from "./pages/EmailConfirmation";
import AffiliateCenter from "./pages/AffiliateCenter";
import AdvertiserCenter from "./pages/AdvertiserCenter";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import { BrandingLoader } from "./hooks/useBranding";
import { MessageNotifications } from "./components/notifications/MessageNotifications";
import { TelemetryProvider } from "./components/monitoring/TelemetryProvider";
import DynamicFavicon from "./components/branding/DynamicFavicon";
import "./i18n";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TelemetryProvider>
          <BrandingLoader />
          <DynamicFavicon />
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/anuncio/:id" element={<ListingDetail />} />
            <Route path="/publicar" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/mensagens" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/creditos" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
            <Route path="/afiliados" element={<ProtectedRoute><AffiliateCenter /></ProtectedRoute>} />
            <Route path="/anunciante" element={<ProtectedRoute><AdvertiserCenter /></ProtectedRoute>} />
            <Route path="/proximos" element={<NearbySearch />} />
            <Route path="/pagamento-sucesso" element={<PaymentSuccess />} />
            <Route path="/pagamento-cancelado" element={<PaymentCanceled />} />
            <Route path="/entrar" element={<Auth />} />
            <Route path="/confirmar-email" element={<EmailConfirmation />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="monitoring" element={<AdminMonitoring />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MessageNotifications />
          <Footer />
        </TelemetryProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
