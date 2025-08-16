import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusOptions = [
  { value: "pending", label: "Pendente", icon: Clock, color: "text-yellow-600" },
  { value: "in_analysis", label: "Em Análise", icon: AlertTriangle, color: "text-blue-600" },
  { value: "approved", label: "Aprovado", icon: CheckCircle, color: "text-green-600" },
  { value: "canceled", label: "Cancelado", icon: XCircle, color: "text-red-600" },
] as const;

export default function OrdersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar pedidos dos anúncios do usuário
  const { data: orders, isLoading } = useQuery({
    queryKey: ["advertiser-orders"],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, amount, currency, status, created_at, updated_at,
          user_id, listing_id, affiliate_id, affiliate_commission, tracking_code,
          listings!orders_listing_id_fkey(id, title, user_id),
          affiliates(affiliate_code),
          profiles!orders_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.filter(order => order.listings?.user_id === currentUser.id);
    },
  });

  // Atualizar status do pedido
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      // Primeiro, buscar dados do pedido para validação
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(`
          id, status, user_id, affiliate_id, listing_id,
          listings(title, user_id)
        `)
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Pedido não encontrado");
      }

      // Verificar se o usuário é o dono do anúncio
      const { data: { user } } = await supabase.auth.getUser();
      if (order.listings?.user_id !== user?.id) {
        throw new Error("Você não tem permissão para alterar este pedido");
      }

      // Validar transições de status (somente após análise de risco)
      const allowedTransitions: Record<string, string[]> = {
        "pending": ["in_analysis"],
        "in_analysis": ["approved", "canceled"], 
        "approved": ["canceled"], // Pode cancelar mesmo depois de aprovado
        "canceled": [], // Status final
      };

      if (!allowedTransitions[order.status]?.includes(newStatus)) {
        throw new Error(`Não é possível alterar de "${order.status}" para "${newStatus}"`);
      }

      // Atualizar status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Enviar notificações via edge function
      try {
        await supabase.functions.invoke("send-order-status-notification", {
          body: {
            orderId,
            oldStatus: order.status,
            newStatus,
            buyerUserId: order.user_id,
            affiliateId: order.affiliate_id,
            listingTitle: order.listings?.title,
          },
        });
      } catch (notificationError) {
        console.error("Erro ao enviar notificações:", notificationError);
        // Não falhar a operação por causa da notificação
      }

      return { orderId, newStatus };
    },
    onSuccess: () => {
      toast({ title: "Status do pedido atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["advertiser-orders"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const getOrdersByStatus = (status: string) => {
    return orders?.filter(order => order.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie o status dos pedidos dos seus produtos
        </p>
      </header>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statusOptions.map((statusInfo) => {
          const count = getOrdersByStatus(statusInfo.value).length;
          const Icon = statusInfo.icon;
          
          return (
            <Card key={statusInfo.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{statusInfo.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${statusInfo.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {statusOptions.map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <h2 className="text-xl font-semibold">Todos os Pedidos</h2>
          <OrdersList 
            orders={orders || []} 
            updateOrderStatus={updateOrderStatus} 
            formatCurrency={formatCurrency}
            getStatusInfo={getStatusInfo}
          />
        </TabsContent>

        {statusOptions.map((statusInfo) => (
          <TabsContent key={statusInfo.value} value={statusInfo.value} className="space-y-4">
            <h2 className="text-xl font-semibold">Pedidos {statusInfo.label}</h2>
            <OrdersList 
              orders={getOrdersByStatus(statusInfo.value)} 
              updateOrderStatus={updateOrderStatus} 
              formatCurrency={formatCurrency}
              getStatusInfo={getStatusInfo}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OrdersList({ 
  orders, 
  updateOrderStatus, 
  formatCurrency, 
  getStatusInfo 
}: {
  orders: any[];
  updateOrderStatus: any;
  formatCurrency: (value: number) => string;
  getStatusInfo: (status: string) => any;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum pedido encontrado nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status);
        const Icon = statusInfo.icon;
        
        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Pedido #{order.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Produto: {order.listings?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {order.profiles?.full_name || order.profiles?.email || 'N/A'}
                  </p>
                </div>
                <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color}`}>
                  <Icon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(order.amount)}
                  </p>
                  {order.affiliate_id && (
                    <p className="text-sm text-muted-foreground">
                      Afiliado: {order.affiliates?.affiliate_code} • 
                      Comissão: {formatCurrency(order.affiliate_commission || 0)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Criado: {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                  {order.updated_at !== order.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {new Date(order.updated_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(newStatus) => 
                      updateOrderStatus.mutate({ orderId: order.id, newStatus })
                    }
                    disabled={updateOrderStatus.isPending}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <OptionIcon className={`h-4 w-4 ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Informações adicionais baseadas no status */}
              {order.status === "in_analysis" && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                  ℹ️ Este pedido está passando por análise de risco. Aguarde a confirmação do pagamento antes de aprovar.
                </div>
              )}
              
              {order.status === "approved" && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm">
                  ✅ Pedido aprovado! O cliente e afiliado (se houver) foram notificados.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}