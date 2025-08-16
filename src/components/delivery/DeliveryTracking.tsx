import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Package, MapPin, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";

interface TrackingInfo {
  orderId: string;
  trackingCode?: string;
  status: string;
  estimatedDelivery?: string;
  courierName?: string;
  currentLocation?: string;
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
    location?: string;
  }>;
}

interface DeliveryTrackingProps {
  order: {
    id: string;
    tracking_code?: string;
    status: string;
    estimated_delivery_date?: string;
    delivery_method?: string;
    created_at: string;
    amount: number;
  };
}

export const DeliveryTracking = ({ order }: DeliveryTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "shipped": return "bg-purple-500";
      case "in_transit": return "bg-orange-500";
      case "out_for_delivery": return "bg-indigo-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "confirmed": return "Confirmado";
      case "shipped": return "Enviado";
      case "in_transit": return "Em Trânsito";
      case "out_for_delivery": return "Saindo para Entrega";
      case "delivered": return "Entregue";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  const handleTrackPackage = async () => {
    if (!order.tracking_code) return;
    
    setIsTracking(true);
    try {
      // Simular chamada para API de rastreamento dos Correios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em um ambiente real, você faria uma chamada para a API dos Correios
      // const response = await fetch(`/api/correios/track/${order.tracking_code}`);
      
      // Por enquanto, apenas abre o site dos Correios
      window.open(
        `https://www2.correios.com.br/sistemas/rastreamento/resultado_semcookie.cfm?objetos=${order.tracking_code}`,
        "_blank"
      );
    } finally {
      setIsTracking(false);
    }
  };

  const timeline = [
    {
      status: "confirmed",
      description: "Pedido confirmado pelo vendedor",
      timestamp: order.created_at,
      completed: ["confirmed", "shipped", "in_transit", "out_for_delivery", "delivered"].includes(order.status)
    },
    {
      status: "shipped",
      description: "Produto enviado",
      timestamp: order.created_at,
      completed: ["shipped", "in_transit", "out_for_delivery", "delivered"].includes(order.status)
    },
    {
      status: "in_transit",
      description: "Em trânsito",
      timestamp: order.created_at,
      completed: ["in_transit", "out_for_delivery", "delivered"].includes(order.status)
    },
    {
      status: "out_for_delivery",
      description: "Saindo para entrega",
      timestamp: order.created_at,
      completed: ["out_for_delivery", "delivered"].includes(order.status)
    },
    {
      status: "delivered",
      description: "Entregue",
      timestamp: order.created_at,
      completed: order.status === "delivered"
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Status da Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusText(order.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Pedido #{order.id.slice(0, 8)}
              </span>
            </div>
            {order.tracking_code && (
              <Button 
                variant="outline" 
                onClick={handleTrackPackage}
                disabled={isTracking}
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                {isTracking ? "Rastreando..." : "Rastrear nos Correios"}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Entrega */}
      {(order.tracking_code || order.estimated_delivery_date) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.tracking_code && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Código de Rastreamento:</span>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {order.tracking_code}
                </span>
              </div>
            )}
            
            {order.estimated_delivery_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Previsão de Entrega:</span>
                <span className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(order.estimated_delivery_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Método de Entrega:</span>
              <span className="text-sm">
                {order.delivery_method === "express" ? "Entrega Expressa" : 
                 order.delivery_method === "standard" ? "Entrega Padrão" : 
                 "Método Padrão"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de Rastreamento */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Rastreamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.status} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  event.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      event.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {event.description}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {event.completed ? formatDate(event.timestamp) : ""}
                    </span>
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={`w-0.5 h-6 ml-1 ${
                      event.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};