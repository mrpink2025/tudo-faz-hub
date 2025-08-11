import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

type Listing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
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
  return (
    <Link to={`/anuncio/${listing.id}`} aria-label={`Ver anúncio ${listing.title}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
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
