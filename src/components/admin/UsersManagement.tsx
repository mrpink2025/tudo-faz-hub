import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminTableSkeleton } from "@/components/ui/loading-skeletons";
import { queryConfigs, createQueryKey } from "@/utils/query-config";
import { Search, Shield, ShieldCheck, Ban, User, Mail, Calendar, UserX } from "lucide-react";

export default function UsersManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users, isLoading, error } = useQuery({
    queryKey: createQueryKey("admin-users", { search: searchTerm, role: roleFilter }),
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          created_at,
          updated_at,
          last_sign_in_at,
          email_confirmed_at
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // Buscar roles separadamente para cada usuário
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);
          
          return {
            ...profile,
            user_roles: rolesData || []
          };
        })
      );

      return usersWithRoles;
    },
    ...queryConfigs.admin
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      // First check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role as any)
        .single();

      if (existing) {
        throw new Error(t("admin.users.role_exists"));
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.users.role_added") });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-users") });
    },
    onError: (e: any) => toast({ 
      title: t("admin.users.role_add_error"), 
      description: e.message,
      variant: "destructive"
    }),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.users.role_removed") });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-users") });
    },
    onError: (e: any) => toast({ 
      title: t("admin.users.role_remove_error"), 
      description: e.message,
      variant: "destructive"
    }),
  });

  const getUserRoles = (user: any) => {
    return user.user_roles?.map((r: any) => r.role) || [];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs"><ShieldCheck className="w-3 h-3 mr-1" />Moderador</Badge>;
      default:
        return <Badge variant="outline" className="text-xs"><User className="w-3 h-3 mr-1" />Usuário</Badge>;
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const filteredUsers = users?.filter(user => {
    if (roleFilter === "all") return true;
    const userRoles = getUserRoles(user);
    if (roleFilter === "admin") return userRoles.includes("admin");
    if (roleFilter === "moderator") return userRoles.includes("moderator");
    if (roleFilter === "user") return userRoles.length === 0 || (!userRoles.includes("admin") && !userRoles.includes("moderator"));
    return true;
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">{t("admin.users.manage")}</h2>
        <p className="text-muted-foreground">{t("admin.users.manage_desc")}</p>
      </header>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.users.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.users.search_user")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.users.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.users.role_filter")}</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">{t("admin.users.all_roles")}</SelectItem>
                <SelectItem value="admin">{t("admin.users.admins")}</SelectItem>
                <SelectItem value="moderator">{t("admin.users.moderators")}</SelectItem>
                <SelectItem value="user">{t("admin.users.regular_users")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : error ? (
        <div className="text-center p-4">
          <p className="text-muted-foreground">{t("admin.users.error_prefix")} {error.message}</p>
        </div>
      ) : filteredUsers && filteredUsers.length ? (
        <div className="space-y-4">
          {filteredUsers.map((user: any) => {
            const userRoles = getUserRoles(user);
            return (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{getInitials(user.full_name, user.email)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <CardTitle className="text-lg">{user.full_name || t("admin.users.name_not_provided")}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                          {!user.email_confirmed_at && <Badge variant="outline" className="text-xs">{t("admin.users.email_not_confirmed")}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{t("admin.users.registered_on")} {new Date(user.created_at).toLocaleDateString()}</span>
                          {user.last_sign_in_at && (
                            <span>• {t("admin.users.last_access")} {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {userRoles.length > 0 ? (
                        userRoles.map(role => getRoleBadge(role))
                      ) : (
                        getRoleBadge('user')
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* Atribuir função de Admin */}
                    {!userRoles.includes("admin") && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => assignRole.mutate({ userId: user.id, role: "admin" })}
                        disabled={assignRole.isPending}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {t("admin.users.make_admin")}
                      </Button>
                    )}

                    {/* Atribuir função de Moderador */}
                    {!userRoles.includes("moderator") && !userRoles.includes("admin") && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => assignRole.mutate({ userId: user.id, role: "moderator" })}
                        disabled={assignRole.isPending}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        {t("admin.users.make_moderator")}
                      </Button>
                    )}

                    {/* Remover função de Admin */}
                    {userRoles.includes("admin") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <UserX className="w-4 h-4 mr-1" />
                            {t("admin.users.remove_admin")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("admin.users.remove_admin_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("admin.users.remove_admin_desc")} {user.full_name || user.email}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("admin.users.cancel")}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeRole.mutate({ userId: user.id, role: "admin" })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("admin.users.remove_admin")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Remover função de Moderador */}
                    {userRoles.includes("moderator") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="secondary">
                            <UserX className="w-4 h-4 mr-1" />
                            {t("admin.users.remove_moderator")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("admin.users.remove_moderator_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("admin.users.remove_moderator_desc")} {user.full_name || user.email}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("admin.users.cancel")}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeRole.mutate({ userId: user.id, role: "moderator" })}
                            >
                              {t("admin.users.remove_moderator")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">{t("admin.users.no_users_found")}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}