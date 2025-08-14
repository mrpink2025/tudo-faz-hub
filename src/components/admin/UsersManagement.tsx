import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminTableSkeleton } from "@/components/ui/loading-skeletons";
import { queryConfigs, createQueryKey } from "@/utils/query-config";
import { Shield, Search, UserX, Crown, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string;
  roles?: Array<{ role: string }>;
}

export default function UsersManagement() {
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
          *,
          user_roles!inner(role)
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      if (roleFilter !== "all") {
        const validRoles = ["admin", "moderator", "user"];
        if (validRoles.includes(roleFilter)) {
          query = query.eq("user_roles.role", roleFilter as any);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group roles by user
      const usersMap = new Map();
      data?.forEach((item: any) => {
        if (!usersMap.has(item.id)) {
          usersMap.set(item.id, {
            ...item,
            roles: []
          });
        }
        if (item.user_roles?.role) {
          usersMap.get(item.id).roles.push({ role: item.user_roles.role });
        }
      });

      return Array.from(usersMap.values());
    },
    ...queryConfigs.admin
  });

  const grantRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel concedido com sucesso" });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-users") });
    },
    onError: (e: any) => toast({ 
      title: "Erro ao conceder papel", 
      description: e.message,
      variant: "destructive"
    }),
  });

  const revokeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel removido com sucesso" });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-users") });
    },
    onError: (e: any) => toast({ 
      title: "Erro ao remover papel", 
      description: e.message,
      variant: "destructive"
    }),
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="flex items-center gap-1"><Crown className="w-3 h-3" />Admin</Badge>;
      case 'moderator':
        return <Badge variant="default" className="flex items-center gap-1"><Shield className="w-3 h-3" />Moderador</Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1"><User className="w-3 h-3" />Usuário</Badge>;
    }
  };

  const hasRole = (user: UserProfile, role: string) => {
    return user.roles?.some(r => r.role === role) || false;
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <p className="text-muted-foreground">Visualize e gerencie papéis dos usuários</p>
      </header>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar usuário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por papel</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="moderator">Moderadores</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
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
          <p className="text-muted-foreground">Erro: {error.message}</p>
        </div>
      ) : users && users.length ? (
        <div className="space-y-4">
          {users.map((user: UserProfile) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || user.email}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.full_name || user.email}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em {new Date(user.created_at).toLocaleDateString()}
                        {user.last_sign_in_at && ` • Último login: ${new Date(user.last_sign_in_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.roles?.map((userRole, index) => (
                      <div key={index}>
                        {getRoleBadge(userRole.role)}
                      </div>
                    )) || getRoleBadge('user')}
                    {user.email_confirmed_at ? (
                      <Badge variant="outline" className="text-green-600">Verificado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">Não verificado</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* Conceder/Remover Admin */}
                  {!hasRole(user, 'admin') ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Crown className="w-4 h-4 mr-1" />
                          Tornar Admin
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja tornar {user.full_name || user.email} um administrador? 
                            Administradores têm acesso total ao sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => grantRole.mutate({ userId: user.id, role: 'admin' })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => revokeRole.mutate({ userId: user.id, role: 'admin' })}
                      disabled={revokeRole.isPending}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Remover Admin
                    </Button>
                  )}

                  {/* Conceder/Remover Moderador */}
                  {!hasRole(user, 'moderator') ? (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => grantRole.mutate({ userId: user.id, role: 'moderator' })}
                      disabled={grantRole.isPending}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Tornar Moderador
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => revokeRole.mutate({ userId: user.id, role: 'moderator' })}
                      disabled={revokeRole.isPending}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Remover Moderador
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}