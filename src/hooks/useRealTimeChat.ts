import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useRateLimit } from './useRateLimit';
import { useValidation } from './useValidation';
import { messageSchema } from '@/lib/validationSchemas';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

interface Conversation {
  other_user_id: string;
  other_user_email: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useRealTimeChat = (recipientId?: string) => {
  const { user } = useSupabaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Buscar conversas do usuário
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_conversations_with_last_message', {
        user_uuid: user.id
      });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      logger.error('Erro ao buscar conversas', { error, userId: user?.id });
    }
  }, [user]);

  // Buscar mensagens de uma conversa específica
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marcar mensagens como lidas
      await supabase.rpc('mark_messages_as_read', {
        conversation_user: otherUserId
      });

      // Atualizar lista de conversas para remover contador de não lidas
      await fetchConversations();
    } catch (error) {
      logger.error('Erro ao buscar mensagens', { error, otherUserId });
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [user, fetchConversations]);

  // Enviar nova mensagem
  const sendMessage = useCallback(async (content: string, toUserId: string) => {
    if (!user || !content.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          recipient_id: toUserId
        });

      if (error) throw error;
      
      toast.success('Mensagem enviada!');
    } catch (error) {
      logger.error('Erro ao enviar mensagem', { error, toUserId, content });
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  }, [user]);

  // Apagar conversa
  const deleteConversation = useCallback(async (otherUserId: string) => {
    if (!user) return;

    try {
      // Deletar todas as mensagens entre os dois usuários
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`);

      if (error) throw error;

      // Deletar registros de leitura
      await supabase
        .from('user_message_reads')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_user_id', otherUserId);

      // Limpar mensagens locais se estiver na conversa ativa
      setMessages([]);
      
      // Atualizar lista de conversas
      await fetchConversations();
      
      toast.success('Conversa apagada com sucesso!');
    } catch (error) {
      logger.error('Erro ao apagar conversa', { error, otherUserId });
      toast.error('Erro ao apagar conversa');
    }
  }, [user, fetchConversations]);

  // Configurar realtime para mensagens
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Verificar se a mensagem é relevante para o usuário atual
          const isRelevantMessage = newMessage.sender_id === user.id || newMessage.recipient_id === user.id;
          
          if (!isRelevantMessage) return;
          
          // Se estamos na conversa ativa, adicionar a mensagem
          if (recipientId) {
            const isFromCurrentConversation = 
              (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
              (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id);
              
            if (isFromCurrentConversation) {
              setMessages(prev => {
                // Evitar duplicatas
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });
              
              // Marcar como lida se foi recebida
              if (newMessage.sender_id === recipientId) {
                supabase.rpc('mark_messages_as_read', {
                  conversation_user: recipientId
                });
              }
            }
          }
          
          // Sempre atualizar lista de conversas
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, fetchConversations]);

  // Carregar conversas iniciais
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Carregar mensagens quando recipientId muda
  useEffect(() => {
    if (recipientId && user) {
      fetchMessages(recipientId);
    }
  }, [recipientId, user, fetchMessages]);

  return {
    messages,
    conversations,
    loading,
    sending,
    sendMessage,
    fetchMessages,
    fetchConversations,
    deleteConversation
  };
};