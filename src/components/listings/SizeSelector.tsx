import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSizes, useListingSizes, useUpdateListingSizes } from "@/hooks/useSizes";
import { Trash2, Plus } from "lucide-react";

interface SizeSelectorProps {
  listingId?: string;
  categoryType: "shoes" | "clothes" | "accessories";
  onSizeRequiredChange?: (required: boolean) => void;
  sizeRequired?: boolean;
  readonly?: boolean;
}

export function SizeSelector({ 
  listingId, 
  categoryType, 
  onSizeRequiredChange, 
  sizeRequired = false,
  readonly = false 
}: SizeSelectorProps) {
  const { data: availableSizes = [] } = useSizes(categoryType);
  const { data: listingSizes = [] } = useListingSizes(listingId || "");
  const updateListingSizes = useUpdateListingSizes();
  
  const [selectedSizes, setSelectedSizes] = useState<{ sizeId: string; stockQuantity: number }[]>(
    listingSizes.map(ls => ({ sizeId: ls.size_id, stockQuantity: ls.stock_quantity }))
  );

  const handleSizeRequiredChange = (checked: boolean) => {
    onSizeRequiredChange?.(checked);
    if (!checked) {
      setSelectedSizes([]);
    }
  };

  const addSize = (sizeId: string) => {
    if (!selectedSizes.find(s => s.sizeId === sizeId)) {
      setSelectedSizes([...selectedSizes, { sizeId, stockQuantity: 1 }]);
    }
  };

  const removeSize = (sizeId: string) => {
    setSelectedSizes(selectedSizes.filter(s => s.sizeId !== sizeId));
  };

  const updateStock = (sizeId: string, stockQuantity: number) => {
    setSelectedSizes(selectedSizes.map(s => 
      s.sizeId === sizeId ? { ...s, stockQuantity } : s
    ));
  };

  const handleSave = () => {
    if (listingId) {
      updateListingSizes.mutate({ listingId, sizes: selectedSizes });
    }
  };

  const getSizeName = (sizeId: string) => {
    return availableSizes.find(s => s.id === sizeId)?.name || "";
  };

  const getAvailableSizesToAdd = () => {
    return availableSizes.filter(size => 
      !selectedSizes.find(s => s.sizeId === size.id)
    );
  };

  if (readonly && !sizeRequired) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tamanhos</CardTitle>
          {!readonly && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="size-required"
                checked={sizeRequired}
                onCheckedChange={handleSizeRequiredChange}
              />
              <Label htmlFor="size-required">Produto requer tamanho</Label>
            </div>
          )}
        </div>
      </CardHeader>

      {sizeRequired && (
        <CardContent className="space-y-4">
          {/* Lista de tamanhos selecionados */}
          {selectedSizes.length > 0 && (
            <div className="space-y-2">
              <Label>Tamanhos disponíveis:</Label>
              {selectedSizes.map((selectedSize) => (
                <div key={selectedSize.sizeId} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant="outline">{getSizeName(selectedSize.sizeId)}</Badge>
                  
                  {!readonly && (
                    <>
                      <div className="flex items-center gap-1 flex-1">
                        <Label className="text-xs">Estoque:</Label>
                        <Input
                          type="number"
                          min="0"
                          value={selectedSize.stockQuantity}
                          onChange={(e) => updateStock(selectedSize.sizeId, parseInt(e.target.value) || 0)}
                          className="w-20 h-8"
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSize(selectedSize.sizeId)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {readonly && (
                    <span className="text-sm text-muted-foreground">
                      Estoque: {selectedSize.stockQuantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo tamanho */}
          {!readonly && getAvailableSizesToAdd().length > 0 && (
            <div className="space-y-2">
              <Label>Adicionar tamanho:</Label>
              <Select onValueChange={addSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tamanho" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {getAvailableSizesToAdd().map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Botão salvar (só para edição) */}
          {!readonly && listingId && (
            <Button 
              onClick={handleSave}
              disabled={updateListingSizes.isPending}
              className="w-full"
            >
              {updateListingSizes.isPending ? "Salvando..." : "Salvar Tamanhos"}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}