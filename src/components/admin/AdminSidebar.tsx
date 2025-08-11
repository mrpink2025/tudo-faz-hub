import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ListChecks, ShoppingCart, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Anúncios", url: "/admin/listings", icon: ListChecks },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname + location.hash;

  const isActive = (url: string) => currentPath === url || (url === "/admin" && location.pathname === "/admin");

  return (
    <Sidebar collapsible="icon" className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
