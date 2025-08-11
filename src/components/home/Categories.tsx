import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Wrench, Home, Car, Smartphone, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  { icon: ShoppingBag, label: "Compras", q: "compras" },
  { icon: Wrench, label: "Serviços", q: "servicos" },
  { icon: Home, label: "Imóveis", q: "imoveis" },
  { icon: Briefcase, label: "Empregos", q: "empregos" },
  { icon: Car, label: "Veículos", q: "veiculos" },
  { icon: Smartphone, label: "Eletrônicos", q: "eletronicos" },
];

const Categories = () => {
  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <h2 className="font-display text-2xl mb-6">Categorias em destaque</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map(({ icon: Icon, label, q }) => (
            <Link key={q} to={`/explorar?categoria=${q}`} aria-label={`Explorar ${label}`}>
              <Card className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] group-hover:bg-[hsl(var(--muted))] transition-colors">
                      <Icon className="" />
                    </span>
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Ver anúncios de {label.toLowerCase()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
