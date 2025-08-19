import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useSizes, useListingSizes, useUpdateListingSizes } from "@/hooks/useSizes";
import { Trash2, Plus, Ruler } from "lucide-react";

interface SizeSelectorProps {
  listingId?: string;
  categoryType: "shoes" | "clothes" | "accessories";
  onSizeRequiredChange?: (required: boolean) => void;
  onSizesChange?: (sizes: { sizeId: string; stockQuantity: number }[]) => void;
  sizeRequired?: boolean;
  readonly?: boolean;
}

export function SizeSelector({ 
  listingId, 
  categoryType, 
  onSizeRequiredChange, 
  onSizesChange,
  sizeRequired = false,
  readonly = false 
}: SizeSelectorProps) {
  const { data: availableSizes = [] } = useSizes(categoryType);
  const { data: listingSizes = [] } = useListingSizes(listingId || "");
  const updateListingSizes = useUpdateListingSizes();
  
  const [selectedSizes, setSelectedSizes] = useState<{ sizeId: string; stockQuantity: number }[]>(
    listingSizes.map(ls => ({ sizeId: ls.size_id, stockQuantity: ls.stock_quantity }))
  );

  // Atualizar selectedSizes quando os dados do banco carregarem
  useEffect(() => {
    if (listingSizes.length > 0) {
      setSelectedSizes(listingSizes.map(ls => ({ sizeId: ls.size_id, stockQuantity: ls.stock_quantity })));
    }
  }, [listingSizes]);

  // Notificar mudanças nos tamanhos para o componente pai
  useEffect(() => {
    if (onSizesChange) {
      onSizesChange(selectedSizes);
    }
  }, [selectedSizes, onSizesChange]);

  const handleSizeRequiredChange = (checked: boolean) => {
    onSizeRequiredChange?.(checked);
    if (!checked) {
      const newSizes: { sizeId: string; stockQuantity: number }[] = [];
      setSelectedSizes(newSizes);
      onSizesChange?.(newSizes);
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
    <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Ruler className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Gerenciamento de Tamanhos</CardTitle>
            <CardDescription>Configure os tamanhos disponíveis e estoques</CardDescription>
          </div>
        </div>
        {!readonly && (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-blue-600" />
                <Label className="text-base font-medium">Produto Requer Tamanho</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Ative se o produto for vendido em diferentes tamanhos
              </p>
            </div>
            <Switch
              checked={sizeRequired}
              onCheckedChange={handleSizeRequiredChange}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        )}
      </CardHeader>

      {sizeRequired && (
        <CardContent className="space-y-6">
          {/* Lista de tamanhos selecionados */}
          {selectedSizes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Tamanhos Configurados:</Label>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedSizes.length} tamanho{selectedSizes.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {selectedSizes.map((selectedSize) => (
                  <div key={selectedSize.sizeId} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                    <Badge variant="outline" className="font-medium">
                      {getSizeName(selectedSize.sizeId)}
                    </Badge>
                    
                    {!readonly && (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-sm font-medium min-w-[60px]">Estoque:</Label>
                          <Input
                            type="number"
                            min="0"
                            value={selectedSize.stockQuantity}
                            onChange={(e) => updateStock(selectedSize.sizeId, parseInt(e.target.value) || 0)}
                            className="w-24 h-9"
                            placeholder="0"
                          />
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSize(selectedSize.sizeId)}
                          className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {readonly && (
                      <span className="text-sm text-muted-foreground font-medium">
                        Estoque: {selectedSize.stockQuantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar novo tamanho */}
          {!readonly && getAvailableSizesToAdd().length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Adicionar Tamanho:</Label>
              <div className="flex gap-2">
                <Select onValueChange={addSize}>
                  <SelectTrigger className="flex-1">
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
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const firstAvailable = getAvailableSizesToAdd()[0];
                    if (firstAvailable) addSize(firstAvailable.id);
                  }}
                  disabled={getAvailableSizesToAdd().length === 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione todos os tamanhos que estarão disponíveis para este produto
              </p>
            </div>
          )}

          {/* Mensagem quando não há tamanhos */}
          {!readonly && selectedSizes.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Ruler className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                Nenhum tamanho configurado ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione tamanhos para permitir que os clientes escolham
              </p>
            </div>
          )}

          {/* Botão salvar (só para edição) */}
          {!readonly && listingId && (
            <Button 
              onClick={handleSave}
              disabled={updateListingSizes.isPending}
              className="w-full h-11"
            >
              {updateListingSizes.isPending ? "Salvando..." : "Salvar Configurações de Tamanho"}
            </Button>
          )}

          {/* Informação sobre estoque total */}
          {selectedSizes.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Estoque Total:</span>
                <Badge className="bg-blue-600">
                  {selectedSizes.reduce((total, size) => total + size.stockQuantity, 0)} unidades
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}