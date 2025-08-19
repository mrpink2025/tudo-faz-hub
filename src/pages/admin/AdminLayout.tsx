/**
 * ============================================================================
 * 🛡️ TUDOFAZ HUB - ADMIN LAYOUT COMPONENT
 * ============================================================================
 * 
 * Administrative layout with sidebar navigation for admin panel
 * Provides structure and navigation for all admin pages
 * 
 * @author by_arturalves
 * @component AdminLayout
 * @version 1.0.0
 * @year 2025
 * 
 * Features:
 * - 📊 Admin sidebar navigation
 * - 🔒 Protected admin routes
 * - 📱 Responsive admin interface
 * - 🎨 Consistent admin theming
 * - 🌐 Multi-language admin panel
 * 
 * Admin Capabilities:
 * - 👥 User management and moderation
 * - 📋 Listing approval and management
 * - 📊 Sales reports and analytics
 * - ⚙️ System settings configuration
 * - 🔍 SEO management tools
 * - 📈 Business performance monitoring
 * 
 * ============================================================================
 */

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useTranslation } from "react-i18next";

export default function AdminLayout() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `Admin | ${t("site.name")}`;
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-3">
            <SidebarTrigger className="mr-2" />
            <h1 className="text-lg font-semibold">{t("admin.layoutTitle")}</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
