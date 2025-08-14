import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface CreditTransaction {
  id: string;
  credits: number;
  amount: number | null;
  type: string;
  created_at: string;
}

interface CreditStatsProps {
  transactions: CreditTransaction[];
  currentBalance: number;
}

export function CreditStats({ transactions, currentBalance }: CreditStatsProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const totalPurchased = transactions
      .filter(tx => tx.type === "purchase")
      .reduce((sum, tx) => sum + tx.credits, 0);

    const totalUsed = Math.abs(transactions
      .filter(tx => tx.type === "usage")
      .reduce((sum, tx) => sum + tx.credits, 0));

    const totalSpent = transactions
      .filter(tx => tx.type === "purchase" && tx.amount)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Dados para gráfico de barras (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyUsage = last7Days.map(date => {
      const dayTransactions = transactions.filter(tx => 
        tx.created_at.startsWith(date) && tx.type === "usage"
      );
      const used = Math.abs(dayTransactions.reduce((sum, tx) => sum + tx.credits, 0));
      
      return {
        date: new Date(date).toLocaleDateString("pt-BR", { 
          weekday: "short", 
          day: "numeric" 
        }),
        usage: used
      };
    });

    // Dados para gráfico de pizza (distribuição por tipo)
    const typeDistribution = [
      { 
        name: t("credits.transaction_type.purchase"), 
        value: totalPurchased,
        color: "#10b981"
      },
      { 
        name: t("credits.transaction_type.usage"), 
        value: totalUsed,
        color: "#ef4444" 
      },
      { 
        name: "Saldo", 
        value: currentBalance,
        color: "#3b82f6"
      }
    ].filter(item => item.value > 0);

    return {
      totalPurchased,
      totalUsed,
      totalSpent,
      dailyUsage,
      typeDistribution
    };
  }, [transactions, currentBalance, t]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(amount / 100);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Estatísticas Resumidas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Comprado</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalPurchased}
              </p>
              <p className="text-xs text-muted-foreground">créditos</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Usado</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalUsed}
              </p>
              <p className="text-xs text-muted-foreground">créditos</p>
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor Total Gasto</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(stats.totalSpent)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Uso Diário */}
      <Card>
        <CardHeader>
          <CardTitle>Uso nos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded">
            <p className="text-muted-foreground text-sm">
              Gráfico de barras - Uso nos últimos 7 dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição */}
      {stats.typeDistribution.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.typeDistribution.map((item, index) => (
                <div key={index} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                  <div className="w-4 h-4 rounded mx-auto mb-2" style={{ backgroundColor: item.color }}></div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">créditos</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}