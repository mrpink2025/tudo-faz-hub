import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const MAX_PHOTOS = 10;

const CreateListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const subcategories = useMemo(
    () => (categories ?? []).filter((c: any) => c.parent_id === rootId),
    [categories, rootId]
  );

  useEffect(() => {
    document.title = `${t("create.pageTitle")} - tudofaz.com`;
  }, [t]);

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

      const parsedPrice = price ? parseInt(price, 10) : null;
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
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;
      const listingId = data?.id;

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

      toast({ title: t("create.success") });
      if (listingId) navigate(`/anuncio/${listingId}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: t("create.error") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{t("create.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("create.pageSubtitle")}</p>
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

        <div className="grid gap-2">
          <Label htmlFor="photos">{t("create.fields.photosLabel", { max: MAX_PHOTOS })}</Label>
          <Input id="photos" type="file" accept="image/*" multiple onChange={handleFiles} />
          <p className="text-xs text-muted-foreground">{t("create.fields.photosCount", { count: files.length, max: MAX_PHOTOS })}</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? t("create.buttons.publishing") : t("create.buttons.publish")}</Button>
          <Link to="/">
            <Button type="button" variant="outline">{t("create.buttons.cancel")}</Button>
          </Link>
        </div>
      </form>
    </main>
  );
};

export default CreateListing;
