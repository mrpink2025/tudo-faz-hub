import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListingSizes } from "@/hooks/useSizes";
import { cn } from "@/lib/utils";

interface ProductSizeSelectorProps {
  listingId: string;
  selectedSize?: string;
  onSizeChange: (sizeId: string | undefined) => void;
  className?: string;
}

export function ProductSizeSelector({ 
  listingId, 
  selectedSize, 
  onSizeChange,
  className 
}: ProductSizeSelectorProps) {
  const { data: listingSizes = [] } = useListingSizes(listingId);

  if (!listingSizes.length) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Selecione o tamanho</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {listingSizes.map((listingSize) => {
            const isAvailable = listingSize.stock_quantity > 0;
            const isSelected = selectedSize === listingSize.size_id;
            
            return (
              <Button
                key={listingSize.size_id}
                variant={isSelected ? "default" : "outline"}
                disabled={!isAvailable}
                onClick={() => onSizeChange(isSelected ? undefined : listingSize.size_id)}
                className={cn(
                  "h-12 text-sm font-medium relative",
                  !isAvailable && "opacity-50 cursor-not-allowed",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {listingSize.size.name}
                {!isAvailable && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center text-xs">
                    Esgotado
                  </div>
                )}
              </Button>
            );
          })}
        </div>
        
        {selectedSize && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Tamanho selecionado:</span>{" "}
              {listingSizes.find(ls => ls.size_id === selectedSize)?.size.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Estoque disponível: {listingSizes.find(ls => ls.size_id === selectedSize)?.stock_quantity || 0} unidades
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}