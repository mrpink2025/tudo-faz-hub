-- Permitir que usuários deletem suas próprias mensagens
CREATE POLICY "Users can delete their own conversations" ON public.messages
FOR DELETE USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);