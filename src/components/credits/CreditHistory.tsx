import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CreditTransaction {
  id: string;
  credits: number;
  amount: number | null;
  type: string;
  created_at: string;
  metadata: any;
  stripe_session_id: string | null;
}

interface CreditHistoryProps {
  onClose: () => void;
}

export function CreditHistory({ onClose }: CreditHistoryProps) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === "all" || tx.type === filter
  );

  const getTransactionIcon = (type: string, credits: number) => {
    if (credits > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      purchase: t("credits.transaction_type.purchase"),
      usage: t("credits.transaction_type.usage"),
      refund: t("credits.transaction_type.refund"),
      bonus: t("credits.transaction_type.bonus")
    };
    return typeMap[type] || type;
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case "purchase": return "default";
      case "usage": return "secondary";
      case "refund": return "outline";
      case "bonus": return "destructive";
      default: return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("credits.history")}
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t("common.loading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("credits.history")}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </CardTitle>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">{t("credits.filter_by")}:</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("credits.all_types")}</SelectItem>
              <SelectItem value="purchase">{t("credits.transaction_type.purchase")}</SelectItem>
              <SelectItem value="usage">{t("credits.transaction_type.usage")}</SelectItem>
              <SelectItem value="refund">{t("credits.transaction_type.refund")}</SelectItem>
              <SelectItem value="bonus">{t("credits.transaction_type.bonus")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("credits.no_transactions")}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type, transaction.credits)}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                    {transaction.metadata?.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {transaction.metadata.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      transaction.credits > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.credits > 0 ? "+" : ""}{transaction.credits} créditos
                    </span>
                  </div>
                  {transaction.amount && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(transaction.amount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}