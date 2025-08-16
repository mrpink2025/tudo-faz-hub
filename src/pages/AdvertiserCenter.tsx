import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, TrendingUp, Eye, CheckCircle, XCircle } from "lucide-react";

export default function AdvertiserCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar anúncios do usuário com dados de afiliados
  const { data: myListings, isLoading } = useQuery({
    queryKey: ["my-listings-with-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, title, price, currency, cover_image, affiliate_enabled, affiliate_commission_rate,
          affiliate_requests(
            id, status, message, created_at,
            affiliates(id, affiliate_code, user_id)
          ),
          affiliate_commissions(
            id, commission_amount, status, created_at
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar estatísticas do anunciante
  const { data: stats } = useQuery({
    queryKey: ["advertiser-stats"],
    queryFn: async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("affiliate_enabled", true);

      if (!listings) return null;

      const listingIds = listings.map(l => l.id);

      // Total de afiliados ativos
      const { count: totalAffiliates } = await supabase
        .from("affiliate_requests")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds)
        .eq("status", "approved");

      // Total de comissões pagas
      const { data: commissions } = await supabase
        .from("affiliate_commissions")
        .select("commission_amount")
        .in("listing_id", listingIds);

      const totalCommissions = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      // Vendas via afiliados
      const { count: affiliateSales } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds)
        .not("affiliate_id", "is", null);

      return {
        totalAffiliates: totalAffiliates || 0,
        totalCommissions,
        affiliateSales: affiliateSales || 0,
      };
    },
  });

  // Aprovar/rejeitar solicitação de afiliado
  const updateAffiliateRequest = useMutation({
    mutationFn: async ({ requestId, status, listingId }: { 
      requestId: string; 
      status: 'approved' | 'rejected';
      listingId: string;
    }) => {
      const { error } = await supabase
        .from("affiliate_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);
      
      if (error) throw error;

      // Se aprovado, criar link de afiliado automaticamente
      if (status === 'approved') {
        const { data: request } = await supabase
          .from("affiliate_requests")
          .select("affiliate_id")
          .eq("id", requestId)
          .single();

        if (request) {
          const { data: trackingCode, error: trackingError } = await supabase.rpc('generate_tracking_code');
          if (trackingError) throw trackingError;

          const { error: linkError } = await supabase
            .from("affiliate_links")
            .insert({
              affiliate_id: request.affiliate_id,
              listing_id: listingId,
              tracking_code: trackingCode,
            });
          
          if (linkError) throw linkError;
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast({ 
        title: status === 'approved' ? "Afiliado aprovado!" : "Solicitação rejeitada",
        description: status === 'approved' ? "Link de afiliado criado automaticamente" : undefined
      });
      queryClient.invalidateQueries({ queryKey: ["my-listings-with-affiliates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar solicitação", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Atualizar comissão de um anúncio
  const updateCommissionRate = useMutation({
    mutationFn: async ({ listingId, rate }: { listingId: string; rate: number }) => {
      const { error } = await supabase
        .from("listings")
        .update({ affiliate_commission_rate: rate * 100 }) // Converter para centavos
        .eq("id", listingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Taxa de comissão atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["my-listings-with-affiliates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar comissão", 
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Central do Anunciante</h1>
        <p className="text-muted-foreground">
          Gerencie seus afiliados e controle as comissões dos seus produtos
        </p>
      </header>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
                <p className="text-2xl font-bold">{stats?.totalAffiliates || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.totalCommissions || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas via Afiliados</p>
                <p className="text-2xl font-bold text-green-600">{stats?.affiliateSales || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listings">Meus Anúncios</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="commissions">Relatório de Comissões</TabsTrigger>
        </TabsList>

        {/* Meus Anúncios */}
        <TabsContent value="listings" className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Anúncios com Afiliados</h2>
          
          <div className="space-y-4">
            {myListings?.filter(listing => listing.affiliate_enabled).map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {listing.cover_image && (
                        <img 
                          src={listing.cover_image} 
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(listing.price || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Afiliados: {listing.affiliate_requests?.filter(r => r.status === 'approved').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Comissão: {(listing.affiliate_commission_rate || 0) / 100}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Nova % de comissão"
                      className="w-40"
                      min="0"
                      max="50"
                      step="0.1"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector(`input[placeholder="Nova % de comissão"]`) as HTMLInputElement;
                        const rate = parseFloat(input.value);
                        if (rate >= 0 && rate <= 50) {
                          updateCommissionRate.mutate({ listingId: listing.id, rate });
                          input.value = "";
                        }
                      }}
                      disabled={updateCommissionRate.isPending}
                    >
                      Atualizar Comissão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Solicitações de Afiliação */}
        <TabsContent value="requests" className="space-y-4">
          <h2 className="text-xl font-semibold">Solicitações de Afiliação Pendentes</h2>
          
          <div className="space-y-4">
            {myListings?.flatMap(listing => 
              listing.affiliate_requests?.filter(req => req.status === 'pending').map(request => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Afiliado: #{request.affiliates?.affiliate_code}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Código: {request.affiliates?.affiliate_code}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Solicitado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {request.message && (
                          <div className="bg-muted p-3 rounded mt-2">
                            <p className="text-sm"><strong>Mensagem:</strong></p>
                            <p className="text-sm">{request.message}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => updateAffiliateRequest.mutate({
                            requestId: request.id,
                            status: 'approved',
                            listingId: listing.id
                          })}
                          disabled={updateAffiliateRequest.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAffiliateRequest.mutate({
                            requestId: request.id,
                            status: 'rejected',
                            listingId: listing.id
                          })}
                          disabled={updateAffiliateRequest.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) || []}
          </div>
        </TabsContent>

        {/* Relatório de Comissões */}
        <TabsContent value="commissions" className="space-y-4">
          <h2 className="text-xl font-semibold">Relatório de Comissões</h2>
          
          <div className="space-y-4">
            {myListings?.flatMap(listing => 
              listing.affiliate_commissions?.map(commission => (
                <Card key={commission.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          -{formatCurrency(commission.commission_amount)}
                        </p>
                        <Badge 
                          variant={
                            commission.status === 'paid' ? 'default' :
                            commission.status === 'confirmed' ? 'secondary' : 'outline'
                          }
                        >
                          {commission.status === 'pending' ? 'Pendente' :
                           commission.status === 'confirmed' ? 'Confirmado' : 'Pago'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) || []}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}