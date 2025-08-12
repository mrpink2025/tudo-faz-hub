import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const MAX_PHOTOS = 10;

const CreateListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
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
    document.title = "Publicar anúncio - tudofaz.com";
  }, []);

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
        toast({ title: "Faça login", description: "Você precisa estar autenticado para publicar." });
        navigate("/entrar");
        return;
      }

      if (!rootId) {
        toast({ title: "Escolha uma categoria" });
        return;
      }
      if (!subId) {
        toast({ title: "Escolha uma subcategoria" });
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

      toast({ title: "Publicado", description: "Seu anúncio foi criado com sucesso." });
      if (listingId) navigate(`/anuncio/${listingId}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível publicar o anúncio." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Publicar anúncio</h1>
        <p className="text-muted-foreground">Crie seu anúncio com título, descrição, preço, categoria e fotos.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">Preço (BRL)</Label>
          <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Opcional" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category-root">Categoria</Label>
          <select
            id="category-root"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={rootId}
            onChange={(e) => { setRootId(e.target.value); setSubId(""); }}
            required
          >
            <option value="" disabled>Selecione</option>
            {roots.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name_pt}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subcategory">Subcategoria</Label>
          <select
            id="subcategory"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            required
          >
            <option value="" disabled>Selecione</option>
            {subcategories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name_pt}</option>
            ))}
          </select>
          {rootId && subcategories.length === 0 && (
            <p className="text-xs text-muted-foreground">Esta categoria não possui subcategorias. Selecione outra.</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="photos">Fotos do anúncio (até {MAX_PHOTOS})</Label>
          <Input id="photos" type="file" accept="image/*" multiple onChange={handleFiles} />
          <p className="text-xs text-muted-foreground">{files.length} de {MAX_PHOTOS} selecionadas</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Publicando…" : "Publicar"}</Button>
          <Link to="/">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </main>
  );
};

export default CreateListing;
