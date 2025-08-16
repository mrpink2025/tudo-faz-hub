import { useState } from "react";
import { Star, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProductReviews } from "@/hooks/useEcommerce";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface ProductReviewsProps {
  listingId: string;
  canReview?: boolean;
  orderId?: string;
}

export function ProductReviews({ listingId, canReview = false, orderId }: ProductReviewsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState<any>(null);

  const { user } = useSupabaseAuth();
  const { reviews, rating: listingRating, addReview, updateReview } = useProductReviews(listingId);
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    if (!orderId && !editingReview) {
      toast({
        title: "Erro",
        description: "ID do pedido não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingReview) {
        await updateReview.mutateAsync({
          reviewId: editingReview.id,
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        await addReview.mutateAsync({
          listingId,
          orderId: orderId!,
          rating,
          comment: comment.trim() || undefined,
        });
      }
      
      setIsDialogOpen(false);
      setComment("");
      setRating(5);
      setEditingReview(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openEditDialog = (review: any) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || "");
    setIsDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingReview(null);
    setRating(5);
    setComment("");
    setIsDialogOpen(false);
  };

  const averageRating = (listingRating as any)?.average_rating || 0;
  const reviewCount = (listingRating as any)?.review_count || 0;

  const userReview = reviews?.find(review => review.user_id === user?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">Avaliações</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                ({reviewCount} avaliações)
              </span>
            </div>
          </div>

          {canReview && !userReview && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Avaliar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingReview ? "Editar Avaliação" : "Avaliar Produto"}
                  </DialogTitle>
                  <DialogDescription>
                    Compartilhe sua experiência com este produto
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nota</label>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setRating(i + 1)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 cursor-pointer transition-colors ${
                              i < rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Comentário (opcional)
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Conte sobre sua experiência com o produto..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetDialog}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={addReview.isPending || updateReview.isPending}
                  >
                    {editingReview ? "Atualizar" : "Enviar"} Avaliação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium">
                        Usuário Verificado
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        {review.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            Sua avaliação
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {review.comment && (
                      <p className="text-sm mt-2 break-words">{review.comment}</p>
                    )}
                  </div>
                </div>

                {review.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(review)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Este produto ainda não possui avaliações</p>
            {canReview && (
              <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}