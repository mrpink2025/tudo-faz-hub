import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Settings, Check, X, Mail, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/utils/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createQueryKey, queryConfigs } from "@/utils/query-config";

interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  newMessages: boolean;
  newListingsInFavoriteCategories: boolean;
  priceAlerts: boolean;
  systemUpdates: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export function NotificationCenter() {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: false,
    emailNotifications: true,
    newMessages: true,
    newListingsInFavoriteCategories: false,
    priceAlerts: false,
    systemUpdates: true,
  });

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: createQueryKey('notifications', { userId: user?.id }),
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    ...queryConfigs.realtime
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('notifications') });
    }
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('notifications') });
      toast({ title: t('notifications.all_cleared') });
    }
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
      new Notification(t('notifications.test_title'), {
        body: t('notifications.test_message'),
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Show browser notification if enabled
          if (settings.browserNotifications && browserPermission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
            });
          }
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
          
          // Refresh notifications list
          queryClient.invalidateQueries({ queryKey: createQueryKey('notifications') });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, settings.browserNotifications, browserPermission, toast, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

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
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications">{t('notifications.notifications')}</TabsTrigger>
              <TabsTrigger value="settings">{t('notifications.settings')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="mt-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('notifications.recent')}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearAllMutation.mutate()}
                  >
                    {t('notifications.clear_all')}
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="max-h-64 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    {t('common.loading')}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    {t('notifications.no_notifications')}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsReadMutation.mutate(notification.id);
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url;
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(notification.type)}
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
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {t('notifications.settings')}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        {t('notifications.browser_notifications')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {browserPermission === 'denied' 
                          ? t('notifications.permission_denied_desc')
                          : t('notifications.browser_desc')
                        }
                      </p>
                    </div>
                    {browserPermission === 'default' ? (
                      <Button 
                        onClick={requestBrowserPermission}
                        size="sm"
                        variant="outline"
                      >
                        {t('notifications.enable')}
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
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('notifications.email_notifications')}
                    </Label>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t('notifications.new_messages')}
                    </Label>
                    <Switch
                      checked={settings.newMessages}
                      onCheckedChange={(checked) => updateSettings({ newMessages: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>{t('notifications.new_listings_favorite_categories')}</Label>
                    <Switch
                      checked={settings.newListingsInFavoriteCategories}
                      onCheckedChange={(checked) => updateSettings({ newListingsInFavoriteCategories: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>{t('notifications.price_alerts')}</Label>
                    <Switch
                      checked={settings.priceAlerts}
                      onCheckedChange={(checked) => updateSettings({ priceAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>{t('notifications.system_updates')}</Label>
                    <Switch
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => updateSettings({ systemUpdates: checked })}
                    />
                  </div>
                </div>

                {browserPermission === 'granted' && settings.browserNotifications && (
                  <Button 
                    onClick={sendTestNotification}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    {t('notifications.send_test')}
                  </Button>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}