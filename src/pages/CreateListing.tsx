import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useValidation } from "@/hooks/useValidation";
import { listingSchema, type ListingInput } from "@/lib/validationSchemas";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { 
  Camera, 
  MapPin, 
  Tag, 
  FileText, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { SizeSelector } from "@/components/listings/SizeSelector";

const MAX_PHOTOS = 10;

const CreateListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { data: categories } = useCategories();
  const { t, i18n } = useTranslation();
  const roots = useMemo(() => (categories ?? []).filter((c: any) => !c.parent_id), [categories]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [rootId, setRootId] = useState<string>("");
  const [subId, setSubId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  // Affiliate settings
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [commissionRate, setCommissionRate] = useState<string>("5");
  // E-commerce settings
  const [sellable, setSellable] = useState(false);
  const [inventoryCount, setInventoryCount] = useState<string>("0");
  const [maxQuantityPerPurchase, setMaxQuantityPerPurchase] = useState<string>("");
  // Address fields
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  // Size settings
  const [sizeRequired, setSizeRequired] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<{ sizeId: string; stockQuantity: number }[]>([]);

  const subcategories = useMemo(
    () => (categories ?? []).filter((c: any) => c.parent_id === rootId),
    [categories, rootId]
  );

  // Categorias que requerem tamanhos
  const getCategoryType = (categoryName: string): "shoes" | "clothes" | "accessories" | null => {
    const name = categoryName.toLowerCase();
    if (name.includes("sapato") || name.includes("tênis") || name.includes("calçado") || name.includes("bota") || name.includes("sandália")) {
      return "shoes";
    }
    if (name.includes("roupa") || name.includes("camisa") || name.includes("calça") || name.includes("vestido") || name.includes("blusa") || name.includes("camiseta")) {
      return "clothes";
    }
    if (name.includes("acessório") || name.includes("bolsa") || name.includes("mochila") || name.includes("chapéu") || name.includes("boné")) {
      return "accessories";
    }
    return null;
  };

  const selectedCategory = categories?.find(c => c.id === subId);
  const categoryType = selectedCategory ? getCategoryType(selectedCategory.name_pt || "") : null;

  useEffect(() => {
    document.title = `${editId ? t("edit.pageTitle") : t("create.pageTitle")} - tudofaz.com`;
  }, [t, editId]);

  // Load listing data for editing
  useEffect(() => {
    if (editId) {
      const loadListing = async () => {
        const { data: listing, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", editId)
          .single();

        if (error) {
          toast({
            title: "Erro ao carregar anúncio",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (listing) {
          setTitle(listing.title || "");
          setDescription(listing.description || "");
          setPrice(listing.price?.toString() || "");
          setRootId(listing.category_id || "");
          setAffiliateEnabled(listing.affiliate_enabled || false);
          setCommissionRate((listing.affiliate_commission_rate / 100)?.toString() || "5");
          setSellable(listing.sellable || false);
          setInventoryCount(listing.inventory_count?.toString() || "0");
          setMaxQuantityPerPurchase(listing.max_quantity_per_purchase?.toString() || "");
          setSizeRequired(listing.size_required || false);
          
          // Load location data
          const { data: location } = await supabase
            .from("listing_locations")
            .select("*")
            .eq("listing_id", editId)
            .single();

          if (location) {
            setAddress1(location.address_line1 || "");
            setAddress2(location.address_line2 || "");
            setNeighborhood(location.neighborhood || "");
            setCity(location.city || "");
            setStateUf(location.state || "");
          }
        }
      };

      loadListing();
    }
  }, [editId, toast]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    setFiles(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        toast({ title: t("create.loginRequiredTitle"), description: t("create.loginRequiredDesc") });
        navigate("/entrar");
        return;
      }

      if (!rootId) {
        toast({ title: t("create.chooseCategory") });
        return;
      }
      if (!subId) {
        toast({ title: t("create.chooseSubcategory") });
        return;
      }

      if (!city) {
        toast({ title: "Informe a cidade" });
        return;
      }
      if (!stateUf) {
        toast({ title: "Informe o estado (UF)" });
        return;
      }

      const parsedPrice = price ? Math.round(parseFloat(price) * 100) : null;
      const locationPublic = city ? (neighborhood ? `${city} - ${neighborhood}` : city) : null;
      
      let listingId = editId;
      
      if (editId) {
        // Update existing listing
        const totalInventory = sizeRequired && selectedSizes.length > 0
          ? selectedSizes.reduce((total, size) => total + size.stockQuantity, 0)
          : parseInt(inventoryCount) || 0;

        const { error } = await supabase
          .from("listings")
          .update({
            category_id: subId,
            title,
            description,
            price: parsedPrice,
            currency: "BRL",
            location: locationPublic,
            affiliate_enabled: affiliateEnabled,
            affiliate_commission_rate: affiliateEnabled ? parseFloat(commissionRate) * 100 : 0,
            sellable,
            inventory_count: sellable ? totalInventory : 0,
            max_quantity_per_purchase: sellable && maxQuantityPerPurchase ? parseInt(maxQuantityPerPurchase) || null : null,
            size_required: sizeRequired,
          })
          .eq("id", editId);

        if (error) throw error;
      } else {
        // Create new listing
        const totalInventory = sizeRequired && selectedSizes.length > 0
          ? selectedSizes.reduce((total, size) => total + size.stockQuantity, 0)
          : parseInt(inventoryCount) || 0;

        const { data, error } = await supabase
          .from("listings")
          .insert({
            user_id: userId,
            category_id: subId,
            title,
            description,
            price: parsedPrice,
            currency: "BRL",
            status: "published",
            approved: true,
            location: locationPublic,
            affiliate_enabled: affiliateEnabled,
            affiliate_commission_rate: affiliateEnabled ? parseFloat(commissionRate) * 100 : 0,
            sellable,
            inventory_count: sellable ? totalInventory : 0,
            max_quantity_per_purchase: sellable && maxQuantityPerPurchase ? parseInt(maxQuantityPerPurchase) || null : null,
            size_required: sizeRequired,
          })
          .select("id")
          .maybeSingle();

        if (error) throw error;
        listingId = data?.id;
      }

      // Save private location details
      if (listingId) {
        if (editId) {
          // Update existing location
          const { error: locErr } = await supabase
            .from("listing_locations")
            .upsert({
              listing_id: listingId,
              address_line1: address1 || null,
              address_line2: address2 || null,
              neighborhood: neighborhood || null,
              city,
              state: stateUf,
            });
          if (locErr) {
            logger.error("Error updating location", { error: locErr, listingId });
          }
        } else {
          // Insert new location
          const { error: locErr } = await supabase.from("listing_locations").insert({
            listing_id: listingId,
            address_line1: address1 || null,
            address_line2: address2 || null,
            neighborhood: neighborhood || null,
            city,
            state: stateUf,
          });
          if (locErr) {
            logger.error("Error inserting location", { error: locErr, listingId });
          }
        }
      }

      // Upload photos (up to 10)
      let uploadedUrls: string[] = [];
      if (listingId && files.length) {
        const results = await Promise.allSettled(
          files.slice(0, MAX_PHOTOS).map(async (file, i) => {
            const path = `${userId}/${listingId}/${String(i).padStart(2, "0")}-${Date.now()}-${file.name}`;
            const { error: uploadErr } = await supabase
              .storage
              .from("listing-images")
              .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
            if (uploadErr) throw uploadErr;
            const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
            return { url: pub.publicUrl, position: i };
          })
        );
        const successes = results.filter(r => r.status === "fulfilled") as PromiseFulfilledResult<{ url: string; position: number; }>[];
        uploadedUrls = successes.map(s => s.value.url);

        if (successes.length) {
          // Insert rows in listing_images
          await supabase.from("listing_images").insert(
            successes.map(s => ({ listing_id: listingId, url: s.value.url, position: s.value.position }))
          );
          // Set cover image if available
          await supabase.from("listings").update({ cover_image: uploadedUrls[0] }).eq("id", listingId);
        }
      }

      // Save sizes if required
      if (listingId) {
        // Delete existing sizes first (for both create and edit)
        await supabase
          .from("listing_sizes")
          .delete()
          .eq("listing_id", listingId);

        // Insert new sizes if required
        if (sizeRequired && selectedSizes.length > 0) {
          const { error: sizesError } = await supabase
            .from("listing_sizes")
            .insert(
              selectedSizes.map(size => ({
                listing_id: listingId,
                size_id: size.sizeId,
                stock_quantity: size.stockQuantity,
              }))
            );
          if (sizesError) {
            logger.error("Error saving sizes", { error: sizesError, listingId });
          }
        }
      }

      toast({ title: editId ? "Anúncio atualizado com sucesso!" : t("create.success") });
      if (listingId) navigate(`/anuncio/${listingId}`);
    } catch (err: any) {
      logger.error("Error creating/updating listing", { error: err, editId });
      toast({ title: t("create.error") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {editId ? "Editar" : "Novo"} Anúncio
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            {editId ? "Editar Anúncio" : "Criar Anúncio"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {editId ? "Atualize as informações do seu anúncio" : "Preencha os dados para criar um anúncio incrível"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Informações Básicas</CardTitle>
                  <CardDescription>Título, descrição e categoria do seu anúncio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("create.fields.title")} <Badge variant="secondary">Obrigatório</Badge>
                </Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: iPhone 15 Pro Max 256GB Novo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  {t("create.fields.description")}
                </Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={6} 
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="Descreva detalhadamente seu produto ou serviço..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-root" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t("create.fields.category")} <Badge variant="secondary">Obrigatório</Badge>
                  </Label>
                  <Select 
                    value={rootId} 
                    onValueChange={(value) => { 
                      setRootId(value); 
                      setSubId(""); 
                    }}
                  >
                    <SelectTrigger className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={t("create.fields.select")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {roots.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name_pt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory" className="text-sm font-medium">
                    {t("create.fields.subcategory")} <Badge variant="secondary">Obrigatório</Badge>
                  </Label>
                  <Select 
                    value={subId} 
                    onValueChange={setSubId}
                    disabled={!rootId}
                  >
                    <SelectTrigger className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={t("create.fields.select")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {subcategories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name_pt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rootId && subcategories.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("create.fields.noSubcategories")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preço */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Preço</CardTitle>
                  <CardDescription>Defina o valor do seu produto ou serviço</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  {t("create.fields.priceBRL")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input 
                    id="price" 
                    type="number" 
                    min="0" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="0,00"
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("create.fields.optional")} - Deixe em branco se preferir negociar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Localização</CardTitle>
                  <CardDescription>Onde seu produto ou serviço está localizado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Cidade <Badge variant="secondary">Obrigatório</Badge>
                  </Label>
                  <Input 
                    id="city" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    required 
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Estado (UF) <Badge variant="secondary">Obrigatório</Badge>
                  </Label>
                  <Input 
                    id="state" 
                    value={stateUf} 
                    onChange={(e) => setStateUf(e.target.value.toUpperCase())} 
                    required 
                    maxLength={2}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                    placeholder="SP"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-sm font-medium">
                  Bairro (opcional)
                </Label>
                <Input 
                  id="neighborhood" 
                  value={neighborhood} 
                  onChange={(e) => setNeighborhood(e.target.value)} 
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Vila Madalena"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address1" className="text-sm font-medium">
                  Endereço (opcional, não público)
                </Label>
                <Input 
                  id="address1" 
                  value={address1} 
                  onChange={(e) => setAddress1(e.target.value)} 
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Rua das Flores, 123"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address2" className="text-sm font-medium">
                  Complemento (opcional)
                </Label>
                <Input 
                  id="address2" 
                  value={address2} 
                  onChange={(e) => setAddress2(e.target.value)} 
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Apto 45, Bloco B"
                />
              </div>
            </CardContent>
          </Card>

          {/* E-commerce */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Venda Online</CardTitle>
                  <CardDescription>Configure se o produto pode ser vendido diretamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <Label className="text-base font-medium">Produto Vendável</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Marque se este produto pode ser comprado diretamente online
                  </p>
                </div>
                <Switch 
                  checked={sellable} 
                  onCheckedChange={setSellable}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              
              {sellable && (
                <div className="space-y-4 animate-fade-in">
                  {/* Só mostra estoque geral se não for produto com tamanhos */}
                  {!sizeRequired && (
                    <div className="space-y-2">
                      <Label htmlFor="inventory" className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Quantidade em Estoque
                      </Label>
                      <Input 
                        id="inventory" 
                        type="number" 
                        min="0" 
                        value={inventoryCount} 
                        onChange={(e) => setInventoryCount(e.target.value)} 
                        placeholder="Ex: 10, 50, 100"
                        className="transition-all duration-200 focus:ring-2 focus:ring-purple-200"
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade de produtos disponíveis para venda online
                      </p>
                    </div>
                  )}
                  
                  {/* Alerta quando produto tem tamanhos */}
                  {sizeRequired && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium">
                        📏 Estoque gerenciado por tamanhos
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Configure o estoque individual de cada tamanho na seção "Gerenciamento de Tamanhos"
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxQuantity" className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Limite por Compra (opcional)
                    </Label>
                    <Input 
                      id="maxQuantity" 
                      type="number" 
                      min="1" 
                      value={maxQuantityPerPurchase} 
                      onChange={(e) => setMaxQuantityPerPurchase(e.target.value)} 
                      placeholder="Ex: 2, 5, 10"
                      className="transition-all duration-200 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo que cada pessoa pode comprar por pedido. Deixe vazio para sem limite.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tamanhos - só aparece para categorias relevantes */}
          {categoryType && (
            <SizeSelector
              listingId={editId || undefined}
              categoryType={categoryType}
              onSizeRequiredChange={setSizeRequired}
              onSizesChange={setSelectedSizes}
              sizeRequired={sizeRequired}
            />
          )}

          {/* Afiliados */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Sistema de Afiliados</CardTitle>
                  <CardDescription>Permita que outros divulguem seu produto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <Label className="text-base font-medium">Sistema de Afiliados</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Permita que outros usuários divulguem seu produto e ganhem comissão
                  </p>
                </div>
                <Switch 
                  checked={affiliateEnabled} 
                  onCheckedChange={setAffiliateEnabled}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
              
              {affiliateEnabled && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="commission" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Taxa de Comissão (%)
                  </Label>
                  <Input 
                    id="commission" 
                    type="number" 
                    min="0" 
                    max="50" 
                    step="0.5"
                    value={commissionRate} 
                    onChange={(e) => setCommissionRate(e.target.value)} 
                    placeholder="Ex: 5, 10, 15"
                    className="transition-all duration-200 focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Porcentagem que será paga aos afiliados por venda gerada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Camera className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Fotos do Produto</CardTitle>
                  <CardDescription>Adicione até {MAX_PHOTOS} fotos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photos" className="text-sm font-medium">
                  {t("create.fields.photosLabel", { max: MAX_PHOTOS })}
                </Label>
                <div className="relative">
                  <Input 
                    id="photos" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFiles} 
                    className="transition-all duration-200 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {t("create.fields.photosCount", { count: files.length, max: MAX_PHOTOS })}
                  </p>
                  {files.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 h-12 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {editId ? "Atualizando..." : t("create.buttons.publishing")}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {editId ? "Atualizar Anúncio" : t("create.buttons.publish")}
                </div>
              )}
            </Button>
            <Link to="/" className="flex-1">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 text-lg font-medium border-2 hover:bg-muted/50 transition-all duration-300"
              >
                {t("create.buttons.cancel")}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
