import { useState, useEffect } from "react";
import { useVoltages, useListingVoltages, useUpdateListingVoltages } from "@/hooks/useVoltages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Zap } from "lucide-react";

interface VoltageSelectorProps {
  listingId?: string;
  voltageRequired: boolean;
  readonly?: boolean;
  onVoltageRequiredChange?: (required: boolean) => void;
  onVoltagesChange?: (voltages: { voltageId: string; stockQuantity: number }[]) => void;
}

export function VoltageSelector({ 
  listingId, 
  voltageRequired, 
  readonly = false,
  onVoltageRequiredChange,
  onVoltagesChange
}: VoltageSelectorProps) {
  const { data: availableVoltages = [] } = useVoltages();
  const { data: listingVoltages = [] } = useListingVoltages(listingId || "");
  const updateListingVoltages = useUpdateListingVoltages();
  
  const [selectedVoltages, setSelectedVoltages] = useState<{ voltageId: string; stockQuantity: number }[]>([]);

  useEffect(() => {
    if (listingVoltages.length > 0) {
      const voltages = listingVoltages.map(lv => ({
        voltageId: lv.voltage_id,
        stockQuantity: lv.stock_quantity
      }));
      setSelectedVoltages(voltages);
      onVoltagesChange?.(voltages);
    }
  }, [listingVoltages, onVoltagesChange]);

  const addVoltage = (voltageId: string) => {
    const newVoltages = [...selectedVoltages, { voltageId, stockQuantity: 1 }];
    setSelectedVoltages(newVoltages);
    onVoltagesChange?.(newVoltages);
  };

  const removeVoltage = (voltageId: string) => {
    const newVoltages = selectedVoltages.filter(v => v.voltageId !== voltageId);
    setSelectedVoltages(newVoltages);
    onVoltagesChange?.(newVoltages);
  };

  const updateStock = (voltageId: string, stockQuantity: number) => {
    const newVoltages = selectedVoltages.map(v =>
      v.voltageId === voltageId ? { ...v, stockQuantity } : v
    );
    setSelectedVoltages(newVoltages);
    onVoltagesChange?.(newVoltages);
  };

  const saveVoltages = async () => {
    if (!listingId) return;
    
    await updateListingVoltages.mutateAsync({
      listingId,
      voltages: selectedVoltages
    });
  };

  const getVoltageName = (voltageId: string) => {
    return availableVoltages.find(v => v.id === voltageId)?.name || voltageId;
  };

  const availableToAdd = availableVoltages.filter(
    voltage => !selectedVoltages.some(sv => sv.voltageId === voltage.id)
  );

  if (readonly) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Voltagens Disponíveis
        </Label>
        {selectedVoltages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedVoltages.map(({ voltageId, stockQuantity }) => (
              <Badge key={voltageId} variant="secondary">
                {getVoltageName(voltageId)} ({stockQuantity} em estoque)
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma voltagem especificada</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Gestão de Voltagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="voltage-required"
            checked={voltageRequired}
            onCheckedChange={onVoltageRequiredChange}
          />
          <Label htmlFor="voltage-required">Produto requer seleção de voltagem</Label>
        </div>

        {voltageRequired && (
          <div className="space-y-4">
            {/* Selected Voltages */}
            {selectedVoltages.length > 0 && (
              <div className="space-y-2">
                <Label>Voltagens Selecionadas</Label>
                <div className="space-y-2">
                  {selectedVoltages.map(({ voltageId, stockQuantity }) => (
                    <div key={voltageId} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="secondary">{getVoltageName(voltageId)}</Badge>
                      <div className="flex items-center gap-2 ml-auto">
                        <Label htmlFor={`stock-${voltageId}`} className="text-sm">
                          Estoque:
                        </Label>
                        <Input
                          id={`stock-${voltageId}`}
                          type="number"
                          min="0"
                          value={stockQuantity}
                          onChange={(e) => updateStock(voltageId, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeVoltage(voltageId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Voltages to Add */}
            {availableToAdd.length > 0 && (
              <div className="space-y-2">
                <Label>Adicionar Voltagens</Label>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map((voltage) => (
                    <Button
                      key={voltage.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addVoltage(voltage.id)}
                    >
                      + {voltage.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {listingId && selectedVoltages.length > 0 && (
              <Button
                type="button"
                onClick={saveVoltages}
                disabled={updateListingVoltages.isPending}
              >
                {updateListingVoltages.isPending ? "Salvando..." : "Salvar Voltagens"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}