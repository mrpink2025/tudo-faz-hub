import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Edit, Eye, Pause, Play, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChunkedTranslatedText } from "@/components/ui/chunked-translated-text";
import { TranslatedText } from "@/components/ui/translated-text";
import { useTranslation } from "react-i18next";

export function MyListings() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories:category_id(name_pt),
          listing_images(url, position)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateListingStatus = useMutation({
    mutationFn: async ({ listingId, status }: { listingId: string; status: string }) => {
      const { error } = await supabase
        .from("listings")
        .update({ status })
        .eq("id", listingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast({ title: "Anúncio removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "Preço sob consulta";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(price / 100);
  };

  const getStatusBadge = (status: string, approved: boolean) => {
    if (!approved) {
      return <Badge variant="destructive">Aguardando Aprovação</Badge>;
    }
    
    switch (status) {
      case "published":
        return <Badge variant="default">Publicado</Badge>;
      case "paused":
        return <Badge variant="secondary">Pausado</Badge>;
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não possui anúncios.</p>
          <Button asChild>
            <Link to="/criar-anuncio">Criar Primeiro Anúncio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const coverImage = listing.listing_images?.[0]?.url || listing.cover_image || "/placeholder.svg";
        
        return (
          <Card key={listing.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={coverImage}
                    alt={listing.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      <ChunkedTranslatedText 
                        text={listing.title} 
                        domain="marketplace" 
                        as="span"
                        loadingSkeleton={false}
                        maxChunkSize={200}
                      />
                    </h3>
                    {getStatusBadge(listing.status, listing.approved)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {listing.categories?.name_pt}
                  </p>
                  
                  <p className="font-medium text-lg mb-2">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                  
                  {listing.sellable && (
                    <p className="text-sm text-muted-foreground">
                      Estoque: {listing.inventory_count || 0}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 min-w-0">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/anuncio/${listing.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      <TranslatedText text="Ver" domain="ui" />
                    </Link>
                  </Button>
                  
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/editar-anuncio/${listing.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      <TranslatedText text="Editar" domain="ui" />
                    </Link>
                  </Button>
                  
                  {listing.status === "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateListingStatus.mutate({
                        listingId: listing.id,
                        status: "paused"
                      })}
                      disabled={updateListingStatus.isPending}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      <TranslatedText text="Pausar" domain="ui" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateListingStatus.mutate({
                        listingId: listing.id,
                        status: "published"
                      })}
                      disabled={updateListingStatus.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <TranslatedText text="Ativar" domain="ui" />
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <TranslatedText text="Excluir" domain="ui" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <TranslatedText text="Confirmar Exclusão" domain="ui" />
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <TranslatedText text="Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita." domain="ui" />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          <TranslatedText text="Cancelar" domain="ui" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteListing.mutate(listing.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <TranslatedText text="Excluir" domain="ui" />
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}