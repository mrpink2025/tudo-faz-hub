import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAffiliates, useAffiliateListings, useAffiliateRequests, useAffiliateLinks, useAffiliateCommissions } from "@/hooks/useAffiliates";
import { useState } from "react";
import { Link, Copy, DollarSign, MousePointer, TrendingUp, Wallet, Target, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { WithdrawalModal } from "@/components/affiliate/WithdrawalModal";

export default function AffiliateCenter() {
  const { toast } = useToast();
  const { affiliateProfile, profileLoading, createAffiliate, updateAffiliate } = useAffiliates();
  const { availableListings, isLoading: listingsLoading } = useAffiliateListings();
  const { myRequests, requestAffiliation } = useAffiliateRequests();
  const { myLinks, createAffiliateLink } = useAffiliateLinks();
  const { commissions, stats } = useAffiliateCommissions();
  
  const [pixKey, setPixKey] = useState(affiliateProfile?.pix_key || "");
  const [requestMessage, setRequestMessage] = useState("");

  // Função para copiar link de afiliado
  const copyAffiliateLink = (trackingCode: string, listingId: string) => {
    const affiliateUrl = `${window.location.origin}/listing/${listingId}?ref=${trackingCode}`;
    navigator.clipboard.writeText(affiliateUrl);
    toast({ title: "Link copiado para a área de transferência!" });
  };

  // Função para formatar valores em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Se não tem perfil de afiliado, mostrar formulário de criação
  if (!affiliateProfile) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Torne-se um Afiliado</CardTitle>
            <CardDescription>
              Ganhe comissões divulgando produtos do nosso marketplace. 
              Crie seu perfil de afiliado para começar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pix">Chave PIX (opcional)</Label>
              <Input
                id="pix"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Sua chave PIX para receber comissões"
              />
            </div>
            <Button 
              onClick={() => createAffiliate.mutate({ pix_key: pixKey })}
              disabled={createAffiliate.isPending}
              className="w-full"
            >
              {createAffiliate.isPending ? "Criando..." : "Criar Perfil de Afiliado"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Central do Afiliado</h1>
        <p className="text-muted-foreground">
          Seu código de afiliado: <code className="font-mono bg-muted px-2 py-1 rounded">{affiliateProfile.affiliate_code}</code>
        </p>
      </header>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.available_balance || 0)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <WithdrawalModal 
                availableBalance={stats?.available_balance || 0}
                pixKey={affiliateProfile.pix_key || ""}
                formatCurrency={formatCurrency}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ganhos</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.total_earnings || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cliques</p>
                <p className="text-2xl font-bold">{stats?.totalClicks || 0}</p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Geradas</p>
                <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="links">Meus Links</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance dos Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Conversão:</span>
                    <span className="font-semibold">
                      {stats?.totalClicks > 0 
                        ? ((stats?.totalSales || 0) / stats.totalClicks * 100).toFixed(2)
                        : '0.00'
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valor por Clique:</span>
                    <span className="font-semibold">
                      {stats?.totalClicks > 0 
                        ? formatCurrency((stats?.total_earnings || 0) / stats.totalClicks)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Links Ativos:</span>
                    <span className="font-semibold">{myLinks?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myLinks?.slice(0, 3).map((link) => (
                    <div key={link.id} className="flex justify-between text-sm">
                      <span className="truncate">{link.listings?.title}</span>
                      <span className="font-semibold">{link.clicks_count} cliques</span>
                    </div>
                  ))}
                  {(!myLinks || myLinks.length === 0) && (
                    <p className="text-sm text-muted-foreground">Nenhum link criado ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Resumo Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Comissões Pendentes:</span>
                    <span className="font-semibold">
                      {commissions?.filter(c => c.status === 'pending').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Comissões Pagas:</span>
                    <span className="font-semibold">
                      {commissions?.filter(c => c.status === 'paid').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Produtos Disponíveis:</span>
                    <span className="font-semibold">{availableListings?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Produtos Disponíveis */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Produtos Disponíveis para Afiliação</h2>
          </div>
          
          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableListings?.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                  {listing.cover_image && (
                    <img 
                      src={listing.cover_image} 
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{listing.title}</h3>
                    <p className="text-lg font-bold text-green-600 mb-2">
                      {formatCurrency(listing.price || 0)}
                    </p>
                    <Badge variant="secondary" className="mb-3">
                      Comissão: {(listing.affiliate_commission_rate || 0) / 100}%
                    </Badge>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Mensagem para o anunciante (opcional)"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button 
                        onClick={() => {
                          requestAffiliation.mutate({ 
                            listingId: listing.id, 
                            message: requestMessage 
                          });
                          setRequestMessage("");
                        }}
                        disabled={requestAffiliation.isPending}
                        className="w-full"
                      >
                        Solicitar Afiliação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Solicitações */}
        <TabsContent value="requests" className="space-y-4">
          <h2 className="text-xl font-semibold">Minhas Solicitações</h2>
          
          <div className="space-y-4">
            {myRequests?.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{request.listings?.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Comissão: {(request.listings?.affiliate_commission_rate || 0) / 100}%
                      </p>
                      {request.message && (
                        <p className="text-sm bg-muted p-2 rounded">{request.message}</p>
                      )}
                    </div>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {request.status === 'pending' ? 'Pendente' :
                       request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </Badge>
                  </div>
                  
                  {request.status === 'approved' && (
                    <Button 
                      onClick={() => createAffiliateLink.mutate(request.listing_id)}
                      disabled={createAffiliateLink.isPending}
                      className="mt-3"
                    >
                      Criar Link de Afiliado
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Links de Afiliado */}
        <TabsContent value="links" className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Links de Afiliado</h2>
          
          <div className="space-y-4">
            {myLinks?.map((link) => (
              <Card key={link.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{link.listings?.title}</h3>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(link.listings?.price || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Cliques: {link.clicks_count}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <code className="flex-1 text-sm">
                      {window.location.origin}/listing/{link.listing_id}?ref={link.tracking_code}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyAffiliateLink(link.tracking_code, link.listing_id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comissões */}
        <TabsContent value="commissions" className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de Comissões</h2>
          
          <div className="space-y-4">
            {commissions?.map((commission) => (
              <Card key={commission.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{commission.listings?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Pedido #{commission.order_id?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(commission.commission_amount)}
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
            ))}
          </div>
        </TabsContent>

        {/* Perfil */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pix-update">Chave PIX</Label>
                <Input
                  id="pix-update"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Sua chave PIX para receber comissões"
                />
              </div>
              <Button 
                onClick={() => updateAffiliate.mutate({ pix_key: pixKey })}
                disabled={updateAffiliate.isPending}
              >
                {updateAffiliate.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}