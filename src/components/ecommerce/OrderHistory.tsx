import { useState } from "react";
import { Package, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrderHistory } from "@/hooks/useEcommerce";
import { ProductReviews } from "./ProductReviews";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "Pendente",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { orders, isLoading } = useOrderHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Carregando histórico de pedidos...</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center p-8">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
        <p className="text-muted-foreground">
          Você ainda não fez nenhuma compra na plataforma.
        </p>
      </div>
    );
  }

  const groupedOrders = {
    all: orders,
    pending: orders.filter(order => order.status === 'pending'),
    processing: orders.filter(order => order.status === 'processing'),
    completed: orders.filter(order => ['delivered', 'completed'].includes(order.status)),
    cancelled: orders.filter(order => order.status === 'cancelled'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Histórico de Pedidos</h2>
        <p className="text-muted-foreground">
          Acompanhe seus pedidos e avalie os produtos que você comprou
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Todos ({groupedOrders.all.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({groupedOrders.pending.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processando ({groupedOrders.processing.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({groupedOrders.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelados ({groupedOrders.cancelled.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(groupedOrders).map(([status, orderList]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {orderList.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={statusColors[order.status as keyof typeof statusColors]}
                      >
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Detalhes do Pedido #{order.id.slice(0, 8)}
                            </DialogTitle>
                            <DialogDescription>
                              Informações completas do seu pedido
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge
                                  className={`mt-1 ${statusColors[order.status as keyof typeof statusColors]}`}
                                >
                                  {statusLabels[order.status as keyof typeof statusLabels]}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Total</label>
                                <p className="mt-1 text-lg font-semibold">
                                  R$ {(order.amount / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-3">Itens do Pedido</h4>
                              <div className="space-y-3">
                                {order.order_items?.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                    {item.listings.cover_image && (
                                      <img
                                        src={item.listings.cover_image}
                                        alt={item.listings.title}
                                        className="w-16 h-16 object-cover rounded-md"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-medium">{item.listings.title}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        Quantidade: {item.quantity} × R$ {(item.unit_price / 100).toFixed(2)}
                                      </p>
                                      <p className="text-sm font-medium">
                                        Subtotal: R$ {(item.total_price / 100).toFixed(2)}
                                      </p>
                                    </div>
                                    {order.status === 'completed' && (
                                      <div className="space-y-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                              <Star className="h-4 w-4 mr-2" />
                                              Avaliar
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                              <DialogTitle>Avaliar Produto</DialogTitle>
                                              <DialogDescription>
                                                {item.listings.title}
                                              </DialogDescription>
                                            </DialogHeader>
                                            <ProductReviews
                                              listingId={item.listing_id}
                                              canReview={true}
                                              orderId={order.id}
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {order.delivery_address && (
                              <div>
                                <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p>{(order.delivery_address as any)?.street}</p>
                                  <p>{(order.delivery_address as any)?.city}, {(order.delivery_address as any)?.state}</p>
                                  <p>CEP: {(order.delivery_address as any)?.zipCode}</p>
                                </div>
                              </div>
                            )}

                            {order.order_notes && (
                              <div>
                                <h4 className="font-medium mb-2">Observações</h4>
                                <p className="p-3 bg-muted rounded-lg">{order.order_notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        R$ {(order.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} item(s)
                      </p>
                    </div>
                    
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="flex -space-x-2">
                        {(order.order_items as any[])?.slice(0, 3).map((item: any, index: number) => (
                          <img
                            key={item.id}
                            src={item.listings.cover_image || "/placeholder.svg"}
                            alt={item.listings.title}
                            className="w-10 h-10 object-cover rounded-full border-2 border-background"
                            style={{ zIndex: 10 - index }}
                          />
                        ))}
                        {(order.order_items as any[])?.length > 3 && (
                          <div className="w-10 h-10 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{(order.order_items as any[])?.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {orderList.length === 0 && (
              <div className="text-center p-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado nesta categoria.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}