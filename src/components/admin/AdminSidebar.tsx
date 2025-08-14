import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ListChecks, ShoppingCart, Settings, Users } from "lucide-react";
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
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold mb-4 text-foreground">
            Painel Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
                {items.map(item => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                            isActive 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{t(item.titleKey)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}