import { useListingSizes } from "@/hooks/useSizes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductSizeDisplayProps {
  listingId: string;
  className?: string;
}

export function ProductSizeDisplay({ listingId, className }: ProductSizeDisplayProps) {
  const { data: listingSizes = [] } = useListingSizes(listingId);

  if (!listingSizes.length) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Tamanhos Disponíveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {listingSizes.map((listingSize) => {
            const isAvailable = listingSize.stock_quantity > 0;
            
            return (
              <div
                key={listingSize.size_id}
                className={cn(
                  "p-3 border rounded-lg text-center transition-all",
                  isAvailable 
                    ? "border-border bg-background hover:border-primary/50" 
                    : "border-border bg-muted/50 opacity-60"
                )}
              >
                <div className="font-medium text-sm mb-1">
                  {listingSize.size.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isAvailable ? (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {listingSize.stock_quantity} disponível
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs px-2 py-1">
                      Esgotado
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Você pode selecionar o tamanho desejado no cartão de compra abaixo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}