import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CreateListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const roots = (categories ?? []).filter((c: any) => !c.parent_id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(roots[0]?.id || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Publicar anúncio - tudofaz.com";
  }, []);

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

      if (!categoryId) {
        toast({ title: "Escolha uma categoria" });
        return;
      }

      const parsedPrice = price ? parseInt(price, 10) : null;
      const { data, error } = await supabase.from("listings").insert({
        user_id: userId,
        category_id: categoryId,
        title,
        description,
        price: parsedPrice,
        currency: "BRL",
        status: "published",
        approved: true,
      }).select("id").maybeSingle();

      if (error) throw error;
      toast({ title: "Publicado", description: "Seu anúncio foi criado com sucesso." });
      if (data?.id) navigate(`/anuncio/${data.id}`);
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
        <p className="text-muted-foreground">Crie seu anúncio com título, descrição, preço e categoria.</p>
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
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>Selecione</option>
            {roots.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name_pt}</option>
            ))}
          </select>
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
