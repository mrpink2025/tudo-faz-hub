import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/utils/logger";

interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  newMessages: boolean;
  newListings: boolean;
  systemUpdates: boolean;
}

export function NotificationCenter() {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [mockNotifications] = useState([
    {
      id: '1',
      title: 'Bem-vindo ao TudoFaz!',
      message: 'Explore os anúncios em sua região',
      type: 'info' as const,
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      title: 'Novo anúncio próximo',
      message: 'Encontrado: iPhone 14 Pro - R$ 3.500',
      type: 'success' as const,
      read: true,
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: false,
    emailNotifications: true,
    newMessages: true,
    newListings: false,
    systemUpdates: true,
  });

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Load notification settings
  useEffect(() => {
    if (user?.id) {
      const savedSettings = localStorage.getItem(`notification-settings-${user.id}`);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          logger.error('Error loading notification settings', { error });
        }
      }
    }
  }, [user?.id]);

  // Save notification settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    if (user?.id) {
      localStorage.setItem(`notification-settings-${user.id}`, JSON.stringify(updated));
      logger.info('Notification settings updated', { settings: updated });
    }
  };

  // Request browser notification permission
  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        updateSettings({ browserNotifications: true });
        toast({ title: t('notifications.permission_granted') });
      } else {
        updateSettings({ browserNotifications: false });
        toast({ 
          title: t('notifications.permission_denied'),
          variant: 'destructive'
        });
      }
    }
  };

  // Send test notification
  const sendTestNotification = () => {
    if (browserPermission === 'granted') {
      new Notification('TudoFaz - Teste', {
        body: 'Notificação de teste funcionando!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notificações
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <BellOff className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Settings */}
            <div className="space-y-3 border-b pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Notificações do browser
                </Label>
                {browserPermission === 'default' ? (
                  <Button 
                    onClick={requestBrowserPermission}
                    size="sm"
                    variant="outline"
                  >
                    Ativar
                  </Button>
                ) : (
                  <Switch
                    checked={settings.browserNotifications && browserPermission === 'granted'}
                    onCheckedChange={(checked) => {
                      if (checked && browserPermission !== 'granted') {
                        requestBrowserPermission();
                      } else {
                        updateSettings({ browserNotifications: checked });
                      }
                    }}
                    disabled={browserPermission === 'denied'}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Novas mensagens</Label>
                <Switch
                  checked={settings.newMessages}
                  onCheckedChange={(checked) => updateSettings({ newMessages: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Novos anúncios</Label>
                <Switch
                  checked={settings.newListings}
                  onCheckedChange={(checked) => updateSettings({ newListings: checked })}
                />
              </div>

              {browserPermission === 'granted' && settings.browserNotifications && (
                <Button 
                  onClick={sendTestNotification}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Testar notificação
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {mockNotifications.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma notificação
                </div>
              ) : (
                mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}