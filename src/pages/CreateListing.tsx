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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useValidation } from "@/hooks/useValidation";
import { listingSchema, type ListingInput } from "@/lib/validationSchemas";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

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
  // Address fields
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

  const subcategories = useMemo(
    () => (categories ?? []).filter((c: any) => c.parent_id === rootId),
    [categories, rootId]
  );

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

      const parsedPrice = price ? parseInt(price, 10) : null;
      const locationPublic = city ? (neighborhood ? `${city} - ${neighborhood}` : city) : null;
      
      let listingId = editId;
      
      if (editId) {
        // Update existing listing
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
            inventory_count: sellable ? parseInt(inventoryCount) || 0 : 0,
          })
          .eq("id", editId);

        if (error) throw error;
      } else {
        // Create new listing
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
            inventory_count: sellable ? parseInt(inventoryCount) || 0 : 0,
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
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{editId ? "Editar Anúncio" : t("create.pageTitle")}</h1>
        <p className="text-muted-foreground">{editId ? "Atualize as informações do seu anúncio" : t("create.pageSubtitle")}</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="title">{t("create.fields.title")}</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t("create.fields.description")}</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">{t("create.fields.priceBRL")}</Label>
          <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("create.fields.optional") as string} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category-root">{t("create.fields.category")}</Label>
          <select
            id="category-root"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={rootId}
            onChange={(e) => { setRootId(e.target.value); setSubId(""); }}
            required
          >
            <option value="" disabled>{t("create.fields.select")}</option>
            {roots.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name_pt}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subcategory">{t("create.fields.subcategory")}</Label>
          <select
            id="subcategory"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            required
          >
            <option value="" disabled>{t("create.fields.select")}</option>
            {subcategories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name_pt}</option>
            ))}
          </select>
          {rootId && subcategories.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("create.fields.noSubcategories")}</p>
          )}
        </div>

        {/* Endereço (somente cidade/bairro públicos) */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">Estado (UF)</Label>
            <Input id="state" value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase())} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="neighborhood">Bairro (opcional)</Label>
            <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address1">Endereço (opcional, não público)</Label>
            <Input id="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address2">Complemento (opcional)</Label>
            <Input id="address2" value={address2} onChange={(e) => setAddress2(e.target.value)} />
          </div>
        </div>

        {/* Configurações de E-commerce */}
        <div className="grid gap-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Produto Vendável</Label>
              <p className="text-sm text-muted-foreground">
                Marque se este produto pode ser comprado diretamente online
              </p>
            </div>
            <Switch 
              checked={sellable} 
              onCheckedChange={setSellable}
            />
          </div>
          
          {sellable && (
            <div className="grid gap-2">
              <Label htmlFor="inventory">Quantidade em Estoque</Label>
              <Input 
                id="inventory" 
                type="number" 
                min="0" 
                value={inventoryCount} 
                onChange={(e) => setInventoryCount(e.target.value)} 
                placeholder="Ex: 10, 50, 100"
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de produtos disponíveis para venda online
              </p>
            </div>
          )}
        </div>

        {/* Configurações de Afiliados */}
        <div className="grid gap-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sistema de Afiliados</Label>
              <p className="text-sm text-muted-foreground">
                Permita que outros usuários divulguem seu produto e ganhem comissão
              </p>
            </div>
            <Switch 
              checked={affiliateEnabled} 
              onCheckedChange={setAffiliateEnabled}
            />
          </div>
          
          {affiliateEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="commission">Taxa de Comissão (%)</Label>
              <Input 
                id="commission" 
                type="number" 
                min="0" 
                max="50" 
                step="0.5"
                value={commissionRate} 
                onChange={(e) => setCommissionRate(e.target.value)} 
                placeholder="Ex: 5, 10, 15"
              />
              <p className="text-xs text-muted-foreground">
                Porcentagem que será paga aos afiliados por venda gerada
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="photos">{t("create.fields.photosLabel", { max: MAX_PHOTOS })}</Label>
          <Input id="photos" type="file" accept="image/*" multiple onChange={handleFiles} />
          <p className="text-xs text-muted-foreground">{t("create.fields.photosCount", { count: files.length, max: MAX_PHOTOS })}</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? (editId ? "Atualizando..." : t("create.buttons.publishing")) : (editId ? "Atualizar Anúncio" : t("create.buttons.publish"))}
          </Button>
          <Link to="/">
            <Button type="button" variant="outline">{t("create.buttons.cancel")}</Button>
          </Link>
        </div>
      </form>
    </main>
  );
};

export default CreateListing;
