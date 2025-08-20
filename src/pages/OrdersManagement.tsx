import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Users, Filter } from "lucide-react";
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

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
  const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header melhorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Gerenciamento de Pedidos
              </h1>
              <p className="text-muted-foreground mt-2">
                Acompanhe e gerencie o status dos pedidos dos seus produtos
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {orders?.length || 0} pedidos encontrados
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas melhoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {/* Estatísticas principais */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold">{orders?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita: {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas por status */}
          {statusOptions.map((statusInfo) => {
            const count = getOrdersByStatus(statusInfo.value).length;
            const revenue = getOrdersByStatus(statusInfo.value).reduce((sum, order) => sum + (order.amount || 0), 0);
            const Icon = statusInfo.icon;
            
            return (
              <Card key={statusInfo.value} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      statusInfo.value === 'pending' ? 'bg-yellow-100' :
                      statusInfo.value === 'in_analysis' ? 'bg-blue-100' :
                      statusInfo.value === 'approved' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${statusInfo.color}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{statusInfo.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count > 0 ? formatCurrency(revenue) : 'R$ 0,00'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs melhoradas */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <div className="border-b bg-muted/30 px-4 md:px-6 py-4">
                <div className="overflow-x-auto">
                  <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full min-w-max md:min-w-0 gap-1 bg-background/50">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap px-2 md:px-4"
                    >
                      <span className="hidden md:inline">Todos ({orders?.length || 0})</span>
                      <span className="md:hidden">Todos</span>
                    </TabsTrigger>
                    {statusOptions.map((status) => (
                      <TabsTrigger 
                        key={status.value} 
                        value={status.value}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap px-2 md:px-4"
                      >
                        <span className="hidden md:inline">{status.label} ({getOrdersByStatus(status.value).length})</span>
                        <span className="md:hidden">{status.label.split(' ')[0]}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              <div className="p-6">
                <TabsContent value="all" className="mt-0">
                  <OrdersList 
                    orders={orders || []} 
                    updateOrderStatus={updateOrderStatus} 
                    formatCurrency={formatCurrency}
                    getStatusInfo={getStatusInfo}
                  />
                </TabsContent>

                {statusOptions.map((statusInfo) => (
                  <TabsContent key={statusInfo.value} value={statusInfo.value} className="mt-0">
                    <OrdersList 
                      orders={getOrdersByStatus(statusInfo.value)} 
                      updateOrderStatus={updateOrderStatus} 
                      formatCurrency={formatCurrency}
                      getStatusInfo={getStatusInfo}
                    />
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
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
          <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-l-4" 
                style={{
                  borderLeftColor: 
                    order.status === 'pending' ? '#eab308' :
                    order.status === 'in_analysis' ? '#3b82f6' :
                    order.status === 'approved' ? '#22c55e' : '#ef4444'
                }}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold">
                      Pedido #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color} border-current`}>
                      <Icon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    📦 {order.listings?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    👤 {order.profiles?.full_name || order.profiles?.email || 'Cliente não identificado'}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Informações financeiras */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                  
                  {order.affiliate_id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">💰 Afiliado</p>
                      <p className="text-xs text-blue-600">
                        Código: {order.affiliates?.affiliate_code}
                      </p>
                      <p className="text-xs text-blue-600">
                        Comissão: {formatCurrency(order.affiliate_commission || 0)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Datas e ações */}
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📅 Criado: {new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    {order.updated_at !== order.created_at && (
                      <p>🔄 Atualizado: {new Date(order.updated_at).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Select
                      value={order.status}
                      onValueChange={(newStatus) => 
                        updateOrderStatus.mutate({ orderId: order.id, newStatus })
                      }
                      disabled={updateOrderStatus.isPending}
                    >
                      <SelectTrigger className="w-40 h-9">
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
              </div>
              
              {/* Alertas informativos */}
              <div className="mt-4 space-y-2">
                {order.status === "in_analysis" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Pedido em análise</p>
                      <p className="text-xs">Aguardando confirmação do pagamento. Mantenha-se atento às atualizações.</p>
                    </div>
                  </div>
                )}
                
                {order.status === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Pedido aprovado!</p>
                      <p className="text-xs">O cliente e afiliado (se houver) foram notificados. Prepare o produto para envio.</p>
                    </div>
                  </div>
                )}

                {order.status === "canceled" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Pedido cancelado</p>
                      <p className="text-xs">Este pedido foi cancelado e não requer mais ações.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}