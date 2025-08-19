import { useListingVoltages } from "@/hooks/useVoltages";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface ProductVoltageDisplayProps {
  listingId: string;
}

export function ProductVoltageDisplay({ listingId }: ProductVoltageDisplayProps) {
  const { data: listingVoltages = [], isLoading } = useListingVoltages(listingId);

  if (isLoading || listingVoltages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Voltagens Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {listingVoltages.map((lv) => (
            <Badge 
              key={lv.id} 
              variant={lv.stock_quantity > 0 ? "default" : "secondary"}
              className="text-sm"
            >
              {lv.voltage.name}
              {lv.stock_quantity === 0 && " - Esgotado"}
            </Badge>
          ))}
        </div>
        
        {listingVoltages.some(lv => lv.stock_quantity > 0) && (
          <p className="text-sm text-muted-foreground mt-3">
            💡 <strong>Dica:</strong> Selecione a voltagem desejada no carrinho de compras.
          </p>
        )}
      </CardContent>
    </Card>
  );
}