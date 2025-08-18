import { useState, useEffect } from "react";
import { Bell, Package, Truck, CheckCircle, XCircle, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}

const notificationIcons = {
  order_placed: Package,
  order_confirmed: Package,
  order_shipped: Truck,
  order_delivered: CheckCircle,
  order_cancelled: XCircle,
};

export const UnifiedNotifications = () => {
  const { 
    notifications: orderNotifications, 
    unreadCount: orderUnreadCount, 
    markAsRead: markOrderAsRead, 
    markAllAsRead: markAllOrderAsRead, 
    isLoading 
  } = useOrderNotifications();

  const [localNotifications, setLocalNotifications] = useState<LocalNotification[]>([]);

  useEffect(() => {
    // Simular notificações locais iniciais
    const mockNotifications: LocalNotification[] = [
      {
        id: '1',
        title: 'Bem-vindo!',
        message: 'Sua conta foi criada com sucesso. Explore os recursos disponíveis.',
        type: 'success',
        read: false,
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: '2',
        title: 'Novo anúncio pendente',
        message: 'Você tem um novo anúncio aguardando aprovação.',
        type: 'info',
        read: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsedNotifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setLocalNotifications(parsedNotifications);
      } catch {
        setLocalNotifications(mockNotifications);
        localStorage.setItem('notifications', JSON.stringify(mockNotifications));
      }
    } else {
      setLocalNotifications(mockNotifications);
      localStorage.setItem('notifications', JSON.stringify(mockNotifications));
    }
  }, []);

  const localUnreadCount = localNotifications.filter(n => !n.read).length;
  const totalUnreadCount = orderUnreadCount + localUnreadCount;

  const markLocalAsRead = (id: string) => {
    const updated = localNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setLocalNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllLocalAsRead = () => {
    const updated = localNotifications.map(n => ({ ...n, read: true }));
    setLocalNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const removeLocalNotification = (id: string) => {
    const updated = localNotifications.filter(n => n.id !== id);
    setLocalNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const addNotification = (notification: Omit<LocalNotification, 'id' | 'timestamp'>) => {
    const newNotification: LocalNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    const updated = [newNotification, ...localNotifications];
    setLocalNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  // Expor função globalmente para outros componentes
  useEffect(() => {
    (window as any).addNotification = addNotification;
  }, [localNotifications]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'hsl(var(--primary))';
      case 'warning': return 'hsl(45 93% 47%)';
      case 'error': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Agora há pouco";
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return dateObj.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notificações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="general">Gerais</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="text-sm text-muted-foreground">
                    {totalUnreadCount} não lidas
                  </span>
                  {totalUnreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        markAllOrderAsRead();
                        markAllLocalAsRead();
                      }}
                      className="text-xs"
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-96">
                  {[...orderNotifications, ...localNotifications].length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {[...orderNotifications, ...localNotifications]
                        .sort((a, b) => {
                          const dateA = 'created_at' in a ? new Date(a.created_at) : a.timestamp;
                          const dateB = 'created_at' in b ? new Date(b.created_at) : b.timestamp;
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map((notification) => {
                          const isOrder = 'created_at' in notification;
                          const Icon = isOrder 
                            ? notificationIcons[notification.type as keyof typeof notificationIcons] || Bell
                            : Bell;
                          
                          return (
                            <div
                              key={notification.id}
                              className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
                                !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                              }`}
                              onClick={() => {
                                if (!notification.read) {
                                  if (isOrder) {
                                    markOrderAsRead(notification.id);
                                  } else {
                                    markLocalAsRead(notification.id);
                                  }
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 ${!notification.read ? "text-blue-600" : "text-muted-foreground"}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(isOrder ? notification.created_at : notification.timestamp)}
                                  </p>
                                </div>
                                {!isOrder && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLocalNotification(notification.id);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="text-sm text-muted-foreground">
                    {orderUnreadCount} não lidas
                  </span>
                  {orderUnreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAllOrderAsRead()}
                      className="text-xs"
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-96">
                  {orderNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhuma notificação de pedidos
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {orderNotifications.map((notification) => {
                        const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell;
                        
                        return (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
                              !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                            }`}
                            onClick={() => !notification.read && markOrderAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 ${!notification.read ? "text-blue-600" : "text-muted-foreground"}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="general" className="mt-0">
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="text-sm text-muted-foreground">
                    {localUnreadCount} não lidas
                  </span>
                  {localUnreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={markAllLocalAsRead}
                      className="text-xs"
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-96">
                  {localNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação geral</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {localNotifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-border hover:bg-muted/50 transition-colors ${
                            !notification.read ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getTypeColor(notification.type) }}
                                />
                                <h4 className="text-sm font-medium">{notification.title}</h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {notification.timestamp.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markLocalAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeLocalNotification(notification.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};