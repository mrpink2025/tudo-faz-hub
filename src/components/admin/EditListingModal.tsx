import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useSizes, useUpdateListingSizes } from "@/hooks/useSizes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SizeSelector } from "@/components/listings/SizeSelector";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Save } from "lucide-react";

interface EditListingModalProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListingModal({ listingId, open, onOpenChange }: EditListingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const updateListingSizes = useUpdateListingSizes();

  // States for form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "BRL",
    category_id: "",
    location: "",
    status: "published",
    sellable: false,
    size_required: false,
    affiliate_enabled: false,
    affiliate_commission_rate: "",
    inventory_count: "",
    max_quantity_per_purchase: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<{ sizeId: string; stockQuantity: number }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  // Fetch listing data
  const { data: listing, isLoading } = useQuery({
    queryKey: ["admin-listing", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories:category_id(id, name_pt),
          listing_locations(*)
        `)
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!listingId,
  });

  // Fetch existing images
  const { data: listingImages } = useQuery({
    queryKey: ["listing-images", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", listingId)
        .order("position");
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!listingId,
  });

  // Load form data when listing is fetched
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || "",
        description: listing.description || "",
        price: listing.price ? (listing.price / 100).toString() : "",
        currency: listing.currency || "BRL",
        category_id: listing.category_id || "",
        location: listing.location || "",
        status: listing.status || "published",
        sellable: listing.sellable || false,
        size_required: listing.size_required || false,
        affiliate_enabled: listing.affiliate_enabled || false,
        affiliate_commission_rate: listing.affiliate_commission_rate?.toString() || "",
        inventory_count: listing.inventory_count?.toString() || "",
        max_quantity_per_purchase: listing.max_quantity_per_purchase?.toString() || "",
      });
    }
  }, [listing]);

  useEffect(() => {
    if (listingImages) {
      setExistingImages(listingImages);
    }
  }, [listingImages]);

  const getCategoryType = (categoryId: string): "clothes" | "shoes" | "accessories" => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name_pt?.toLowerCase() || '';
    
    if (categoryName.includes('calçad') || categoryName.includes('sapato') || categoryName.includes('tênis')) {
      return 'shoes';
    } else if (categoryName.includes('roupas') || categoryName.includes('camisa') || categoryName.includes('calça')) {
      return 'clothes';
    }
    return 'accessories';
  };

  // Update listing mutation
  const updateListing = useMutation({
    mutationFn: async (data: any) => {
      const priceInCents = data.price ? Math.round(parseFloat(data.price) * 100) : null;
      
      const updateData = {
        title: data.title,
        description: data.description,
        price: priceInCents,
        currency: data.currency,
        category_id: data.category_id,
        location: data.location,
        status: data.status,
        sellable: data.sellable,
        size_required: data.size_required,
        affiliate_enabled: data.affiliate_enabled,
        affiliate_commission_rate: data.affiliate_commission_rate ? parseInt(data.affiliate_commission_rate) : 0,
        inventory_count: data.inventory_count ? parseInt(data.inventory_count) : 0,
        max_quantity_per_purchase: data.max_quantity_per_purchase ? parseInt(data.max_quantity_per_purchase) : null,
        updated_at: new Date().toISOString(),
      };

      // Update listing
      const { error: listingError } = await supabase
        .from("listings")
        .update(updateData)
        .eq("id", listingId);

      if (listingError) throw listingError;

      // Upload new images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileName = `${listingId}_${Date.now()}_${i}.${file.name.split('.').pop()}`;
          
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          // Insert image record
          const { error: imageError } = await supabase
            .from("listing_images")
            .insert({
              listing_id: listingId,
              url: publicUrl,
              position: existingImages.length + i,
            });

          if (imageError) throw imageError;
        }
      }

      // Update sizes if applicable
      if (data.size_required && selectedSizes.length > 0) {
        await updateListingSizes.mutateAsync({
          listingId: listingId,
          sizes: selectedSizes,
        });
      }

      return true;
    },
    onSuccess: () => {
      toast({ title: "Anúncio atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listing", listingId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("listing_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-images", listingId] });
      toast({ title: "Imagem removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateListing.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando dados do anúncio...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Anúncio: {listing?.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange("category_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name_pt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* E-commerce Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de E-commerce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sellable"
                  checked={formData.sellable}
                  onCheckedChange={(checked) => handleInputChange("sellable", checked)}
                />
                <Label htmlFor="sellable">Produto vendável online</Label>
              </div>

              {formData.sellable && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inventory">Estoque</Label>
                      <Input
                        id="inventory"
                        type="number"
                        value={formData.inventory_count}
                        onChange={(e) => handleInputChange("inventory_count", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_quantity">Máximo por compra</Label>
                      <Input
                        id="max_quantity"
                        type="number"
                        value={formData.max_quantity_per_purchase}
                        onChange={(e) => handleInputChange("max_quantity_per_purchase", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="size_required"
                      checked={formData.size_required}
                      onCheckedChange={(checked) => handleInputChange("size_required", checked)}
                    />
                    <Label htmlFor="size_required">Produto requer seleção de tamanho</Label>
                  </div>

                  {formData.size_required && (
                    <SizeSelector
                      listingId={listingId}
                      categoryType={getCategoryType(formData.category_id)}
                      sizeRequired={formData.size_required}
                      readonly={false}
                      onSizeRequiredChange={(required) => handleInputChange("size_required", required)}
                      onSizesChange={setSelectedSizes}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <Label>Imagens Atuais</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt="Imagem do anúncio"
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                          onClick={() => deleteImage.mutate(image.id)}
                          disabled={deleteImage.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {images.length > 0 && (
                <div>
                  <Label>Novas Imagens</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Nova imagem ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div>
                <Label htmlFor="new-images">Adicionar Novas Imagens</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <input
                    id="new-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('new-images')?.click()}
                  >
                    Escolher Imagens
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateListing.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateListing.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateListing.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
