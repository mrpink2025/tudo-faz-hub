import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";

type Listing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  cover_image: string | null;
};

const formatPrice = (value: number | null | undefined, currency: string | null | undefined) => {
  if (value == null) return "A combinar";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(value);
  } catch {
    return `${value}`;
  }
};

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const imgSrc = listing.cover_image || "/placeholder.svg";
  return (
    <Link to={`/anuncio/${listing.id}`} aria-label={`Ver anúncio ${listing.title}`}>
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_hsl(var(--primary)/0.35)] hover:ring-1 hover:ring-primary/30 hover:border-primary/40">
        <div className="bg-muted">
          <AspectRatio ratio={16 / 9}>
            <img
              src={imgSrc}
              alt={`Imagem do anúncio: ${listing.title}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </AspectRatio>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1 text-xl">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div className="font-medium text-foreground">{formatPrice(listing.price, listing.currency)}</div>
          {listing.location && <div>{listing.location}</div>}
          <time dateTime={listing.created_at}>{new Date(listing.created_at).toLocaleDateString("pt-BR")}</time>
        </CardContent>
      </Card>
    </Link>
  );
};
