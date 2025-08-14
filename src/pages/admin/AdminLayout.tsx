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
      <header className="h-12 flex items-center border-b px-3">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-lg font-semibold">{t("admin.layoutTitle")}</h1>
      </header>
      <div className="flex min-h-[calc(100vh-3rem)] w-full overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
