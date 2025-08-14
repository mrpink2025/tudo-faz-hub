import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useValidation } from '@/hooks/useValidation';
import { messageSchema } from '@/lib/validationSchemas';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientEmail,
  onBack
}) => {
  const { user } = useSupabaseAuth();
  const { validate } = useValidation();
  const { messages, loading, sending, sendMessage } = useRealTimeChat(recipientId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validate(messageSchema, {
      content: newMessage.trim(),
      recipient_id: recipientId
    }, false);
    
    if (!validation.success || !newMessage.trim() || sending) return;

    await sendMessage(newMessage.trim(), recipientId);
    setNewMessage('');
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM HH:mm', { locale: pt });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando mensagens...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card p-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {recipientName?.[0]?.toUpperCase() || recipientEmail?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{recipientName || recipientEmail}</h3>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;