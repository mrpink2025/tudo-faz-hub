import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

export function MessageNotifications() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Configurar realtime subscription para novas mensagens
    const subscription = supabase
      .channel(`new-messages-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Evitar notificação duplicada
          if (lastMessageId === newMessage.id) return;
          setLastMessageId(newMessage.id);

          // Mostrar toast de notificação apenas se o usuário não estiver na página de mensagens
          const isOnMessagesPage = window.location.pathname.includes('/mensagens');
          
          if (!isOnMessagesPage) {
            toast({
              title: t("notifications.new_message"),
              description: newMessage.content.length > 50 
                ? `${newMessage.content.substring(0, 50)}...` 
                : newMessage.content,
              action: (
                <div className="flex items-center gap-2 text-primary">
                  <MessageCircle className="w-4 h-4" />
                  <span>{t("notifications.view")}</span>
                </div>
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, toast, t, lastMessageId]);

  return null; // Component apenas para lógica, sem UI
}