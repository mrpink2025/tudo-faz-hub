import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ListChecks, ShoppingCart, Settings, Users, Activity, Search, TrendingUp } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

const items = [{
  titleKey: "admin.sidebar.dashboard",
  url: "/admin",
  icon: LayoutDashboard
}, {
  titleKey: "admin.sidebar.listings",
  url: "/admin/listings",
  icon: ListChecks
}, {
  titleKey: "admin.sidebar.users",
  url: "/admin/users",
  icon: Users
}, {
  titleKey: "Relatórios de Vendas",
  url: "/admin/sales",
  icon: TrendingUp
}, {
  titleKey: "Monitoramento",
  url: "/admin/monitoring",
  icon: Activity
}, {
  titleKey: "SEO & PWA",
  url: "/admin/seo",
  icon: Search
}, {
  titleKey: "admin.sidebar.settings",
  url: "/admin/settings",
  icon: Settings
}];
export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname + location.hash;
  const {
    t
  } = useTranslation();
  const isActive = (url: string) => currentPath === url || url === "/admin" && location.pathname === "/admin";
  return <Sidebar collapsible="icon" className="w-64">
      <SidebarContent>
        <SidebarGroup className="py-[100px] rounded-3xl">
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                {items.map(item => <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}