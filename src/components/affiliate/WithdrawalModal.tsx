import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, History, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WithdrawalModalProps {
  availableBalance: number;
  pixKey: string;
  formatCurrency: (value: number) => string;
}

export function WithdrawalModal({ availableBalance, pixKey, formatCurrency }: WithdrawalModalProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar histórico de saques
  const { data: withdrawals } = useQuery({
    queryKey: ['affiliate-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Mutação para solicitar saque
  const requestWithdrawal = useMutation({
    mutationFn: async (amount: number) => {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!affiliate) throw new Error('Perfil de afiliado não encontrado');

      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: affiliate.id,
          amount,
          pix_key: pixKey
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Saque solicitado!",
        description: "Seu pedido de saque foi registrado e será processado em até 48h."
      });
      setWithdrawalAmount("");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawalAmount.replace(',', '.')) * 100; // Converter para centavos
    
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para saque.",
        variant: "destructive"
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado é maior que seu saldo disponível.",
        variant: "destructive"
      });
      return;
    }

    if (amount < 1000) { // Mínimo R$ 10,00
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 10,00.",
        variant: "destructive"
      });
      return;
    }

    if (!pixKey) {
      toast({
        title: "Chave PIX necessária",
        description: "Configure sua chave PIX antes de solicitar um saque.",
        variant: "destructive"
      });
      return;
    }

    requestWithdrawal.mutate(amount);
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'completed': 'Concluído',
      'rejected': 'Rejeitado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusVariant = (status: string) => {
    const variantMap = {
      'pending': 'secondary' as const,
      'processing': 'default' as const,
      'completed': 'default' as const,
      'rejected': 'destructive' as const
    };
    return variantMap[status as keyof typeof variantMap] || 'secondary' as const;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={availableBalance < 1000}>
          <Wallet className="h-4 w-4 mr-2" />
          Solicitar Saque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Saque de Comissões
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Formulário de saque */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo disponível:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(availableBalance)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do saque (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="10"
                  max={availableBalance / 100}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Valor mínimo: R$ 10,00
                </p>
              </div>

              <div className="space-y-2">
                <Label>Chave PIX cadastrada:</Label>
                <div className="p-2 bg-muted rounded text-sm">
                  {pixKey || "Nenhuma chave PIX cadastrada"}
                </div>
              </div>

              <Button 
                onClick={handleWithdraw} 
                disabled={requestWithdrawal.isPending || !pixKey || availableBalance < 1000}
                className="w-full"
              >
                {requestWithdrawal.isPending ? "Processando..." : "Solicitar Saque"}
              </Button>
            </CardContent>
          </Card>

          {/* Histórico de saques */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Saques
            </h3>
            
            {withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {formatCurrency(withdrawal.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PIX: {withdrawal.pix_key}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado em: {new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}
                          </p>
                          {withdrawal.processed_at && (
                            <p className="text-xs text-muted-foreground">
                              Processado em: {new Date(withdrawal.processed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {withdrawal.admin_notes && (
                            <p className="text-xs bg-muted p-2 rounded mt-2">
                              Observações: {withdrawal.admin_notes}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(withdrawal.status)}>
                          {getStatusLabel(withdrawal.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum saque solicitado ainda.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}