import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';
import { format, isToday, isYesterday } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ChatListProps {
  onSelectChat: (userId: string, userName: string, userEmail: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const { conversations, loading } = useRealTimeChat();

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM', { locale: pt });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando conversas...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma conversa ainda</p>
          <p className="text-sm">Entre em contato com vendedores para iniciar uma conversa</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <div
            key={conversation.other_user_id}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelectChat(
              conversation.other_user_id,
              conversation.other_user_name,
              conversation.other_user_email
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {conversation.other_user_name?.[0]?.toUpperCase() || 
                 conversation.other_user_email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate">
                  {conversation.other_user_name || conversation.other_user_email}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {formatLastMessageTime(conversation.last_message_time)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message}
                </p>
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="h-5 min-w-[20px] text-xs">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatList;