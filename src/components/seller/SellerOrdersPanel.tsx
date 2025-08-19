import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSellerOrders } from "@/hooks/useEcommerce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const statusIcons = {
  pending: Package,
  confirmed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500", 
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export const SellerOrdersPanel = () => {
  const { t } = useTranslation();
  const { orders = [], isLoading } = useSellerOrders();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      toast({
        title: t("seller.order_updated"),
        description: t("seller.order_updated"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("seller.update_error") + ": " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateOrder = (orderId: string, updates: any) => {
    updateOrderMutation.mutate({ orderId, updates });
  };

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons];
    const colorClass = statusColors[status as keyof typeof statusColors];
    
    return (
      <Badge className={`${colorClass} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status === "pending" ? t("seller.pending") :
         status === "confirmed" ? t("seller.confirmed") :
         status === "shipped" ? t("seller.shipped") :
         status === "delivered" ? t("seller.delivered") : t("seller.cancelled")}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  if (isLoading) {
    return <div>{t("seller.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("seller.manage_orders")}</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{orders.length} {t("seller.orders").toLowerCase()}</Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">{t("seller.all")}</TabsTrigger>
          <TabsTrigger value="pending">{t("seller.pending")}</TabsTrigger>
          <TabsTrigger value="confirmed">{t("seller.confirmed")}</TabsTrigger>
          <TabsTrigger value="shipped">{t("seller.shipped")}</TabsTrigger>
          <TabsTrigger value="delivered">{t("seller.delivered")}</TabsTrigger>
        </TabsList>

        {["all", "pending", "confirmed", "shipped", "delivered"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {orders
              .filter(order => tab === "all" || order.status === tab)
              .map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {t("seller.order_id")} #{order.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(order.status)}
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(order.amount)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`status-${order.id}`}>{t("seller.status")}</Label>
                          <Select
                            value={order.status}
                            onValueChange={(value) => 
                              handleUpdateOrder(order.id, { status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{t("seller.pending")}</SelectItem>
                              <SelectItem value="confirmed">{t("seller.confirmed")}</SelectItem>
                              <SelectItem value="shipped">{t("seller.shipped")}</SelectItem>
                              <SelectItem value="delivered">{t("seller.delivered")}</SelectItem>
                              <SelectItem value="cancelled">{t("seller.cancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`tracking-${order.id}`}>{t("seller.tracking_code")}</Label>
                          <Input
                            id={`tracking-${order.id}`}
                            value={order.tracking_code || ""}
                            onChange={(e) => 
                              handleUpdateOrder(order.id, { tracking_code: e.target.value })
                            }
                            placeholder={t("seller.tracking_code")}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`notes-${order.id}`}>{t("seller.seller_notes")}</Label>
                        <Textarea
                          id={`notes-${order.id}`}
                          value={order.seller_notes || ""}
                          onChange={(e) => 
                            handleUpdateOrder(order.id, { seller_notes: e.target.value })
                          }
                          placeholder={t("seller.seller_notes")}
                          rows={3}
                        />
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">{t("seller.order_items")}:</h4>
                          <div className="space-y-2">
                            {order.order_items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{item.listing?.title || "Item"}</span>
                                <div className="text-right">
                                  <span className="text-sm text-muted-foreground">
                                    {t("seller.quantity")}: {item.quantity}
                                  </span>
                                  <br />
                                  <span className="font-semibold">
                                    {formatPrice(item.total_price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};