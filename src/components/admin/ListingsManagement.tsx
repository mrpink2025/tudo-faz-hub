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
import { useTranslation } from "react-i18next";
import { AdminTableSkeleton } from "@/components/ui/loading-skeletons";
import { queryConfigs, createQueryKey } from "@/utils/query-config";
import { Pencil, Trash2, Eye, Search, Check, X, Star } from "lucide-react";

export default function ListingsManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: createQueryKey("admin-listings", { search: searchTerm, status: statusFilter, approval: approvalFilter }),
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, price, currency, created_at, highlighted, approved, status, user_id, cover_image, location")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (approvalFilter !== "all") {
        query = query.eq("approved", approvalFilter === "approved");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    ...queryConfigs.admin
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.moderate.approved") });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-listings") });
    },
    onError: (e: any) => toast({ 
      title: t("admin.moderate.approve_error"), 
      description: e.message,
      variant: "destructive"
    }),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").update({ approved: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anúncio rejeitado" });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-listings") });
    },
    onError: (e: any) => toast({ 
      title: "Erro ao rejeitar", 
      description: e.message,
      variant: "destructive"
    }),
  });

  const toggleHighlight = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("listings").update({ highlighted: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('admin.moderate.highlight_updated') });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-listings") });
    },
    onError: (e: any) => toast({ 
      title: t("admin.moderate.highlight_error"), 
      description: e.message,
      variant: "destructive"
    }),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      // Primeiro deletar as imagens associadas
      const { error: imagesError } = await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", id);
      
      if (imagesError) throw imagesError;

      // Depois deletar o anúncio
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anúncio excluído com sucesso" });
      qc.invalidateQueries({ queryKey: createQueryKey("admin-listings") });
    },
    onError: (e: any) => toast({ 
      title: "Erro ao excluir anúncio", 
      description: e.message,
      variant: "destructive"
    }),
  });

  const getStatusBadge = (status: string, approved: boolean) => {
    if (!approved) return <Badge variant="destructive">Pendente</Badge>;
    if (status === "published") return <Badge variant="default">Publicado</Badge>;
    if (status === "draft") return <Badge variant="secondary">Rascunho</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Gerenciar Anúncios</h2>
        <p className="text-muted-foreground">Edite, aprove, destaque ou exclua anúncios</p>
      </header>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar por título</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Aprovação</label>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de anúncios */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : error ? (
        <div className="text-center p-4">
          <p className="text-muted-foreground">Erro: {error.message}</p>
        </div>
      ) : data && data.length ? (
        <div className="space-y-4">
          {data.map((listing: any) => (
            <Card key={listing.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {listing.cover_image && (
                      <img 
                        src={listing.cover_image} 
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {listing.location} • Criado em {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium">
                        {listing.price ? `${listing.currency || "BRL"} ${listing.price}` : "Sem preço"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {listing.highlighted && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                    {getStatusBadge(listing.status, listing.approved)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* Visualizar */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(`/anuncio/${listing.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>

                  {/* Editar */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(`/criar-anuncio?edit=${listing.id}`, '_blank')}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>

                  {/* Aprovar/Rejeitar */}
                  {!listing.approved ? (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => approve.mutate(listing.id)}
                      disabled={approve.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => reject.mutate(listing.id)}
                      disabled={reject.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  )}

                  {/* Destacar */}
                  <Button 
                    size="sm" 
                    variant={listing.highlighted ? "default" : "outline"}
                    onClick={() => toggleHighlight.mutate({ id: listing.id, value: !listing.highlighted })}
                    disabled={toggleHighlight.isPending}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    {listing.highlighted ? "Remover destaque" : "Destacar"}
                  </Button>

                  {/* Excluir */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o anúncio "{listing.title}"? 
                          Esta ação não pode ser desfeita e todas as imagens associadas também serão removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteListing.mutate(listing.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum anúncio encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}