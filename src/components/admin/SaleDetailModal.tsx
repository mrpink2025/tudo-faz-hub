import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SalesAnalytics } from "@/hooks/useSalesReports";
import { 
  CreditCard, 
  Package, 
  User, 
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Hash
} from "lucide-react";

interface SaleDetailModalProps {
  sale: SalesAnalytics | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailModal = ({ sale, isOpen, onClose }: SaleDetailModalProps) => {
  if (!sale) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'confirmed': return 'secondary';
      case 'shipped': return 'outline';
      case 'pending': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Transação #{sale.order_id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Status do Pedido
              </h3>
              <Badge variant={getStatusColor(sale.status)} className="text-sm">
                {getStatusText(sale.status)}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Total
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(sale.amount / 100)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Informações do Pedido */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Informações do Pedido
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID do Pedido:</span>
                <p className="font-mono break-all">{sale.order_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data da Compra:</span>
                <p>{formatDate(sale.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade de Itens:</span>
                <p>{sale.total_items} {sale.total_items === 1 ? 'item' : 'itens'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Moeda:</span>
                <p>{sale.currency.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Comprador */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Comprador
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{sale.buyer_name || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-mono">{sale.buyer_email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ID do Cliente:</span>
                <p className="font-mono text-xs">{sale.buyer_id}</p>
              </div>
            </div>
          </div>

          {/* Informações do Vendedor */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendedor
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{sale.seller_name || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-mono">{sale.seller_email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ID do Vendedor:</span>
                <p className="font-mono text-xs">{sale.seller_id}</p>
              </div>
            </div>
          </div>

          {/* Comissão de Afiliado (se houver) */}
          {sale.affiliate_commission > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Programa de Afiliados
                </h3>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-muted-foreground">Comissão de Afiliado:</span>
                    <p className="font-semibold text-orange-600">
                      {formatPrice(sale.affiliate_commission / 100)}
                    </p>
                  </div>
                  {sale.affiliate_id && (
                    <div>
                      <span className="text-muted-foreground">ID do Afiliado:</span>
                      <p className="font-mono text-xs">{sale.affiliate_id}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Taxa de Comissão:</span>
                    <p>
                      {((sale.affiliate_commission / sale.amount) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Informações de Análise */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Análise da Venda
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data da Venda:</span>
                <p>{new Date(sale.sale_date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Horário da Venda:</span>
                <p>{sale.sale_hour}:00 - {sale.sale_hour + 1}:00</p>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <Separator />
          <div className="bg-primary/5 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Resumo Financeiro</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valor do Pedido:</span>
                <span className="font-semibold">{formatPrice(sale.amount / 100)}</span>
              </div>
              {sale.affiliate_commission > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Comissão de Afiliado:</span>
                  <span>-{formatPrice(sale.affiliate_commission / 100)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Receita Líquida:</span>
                <span className="text-green-600">
                  {formatPrice((sale.amount - sale.affiliate_commission) / 100)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};