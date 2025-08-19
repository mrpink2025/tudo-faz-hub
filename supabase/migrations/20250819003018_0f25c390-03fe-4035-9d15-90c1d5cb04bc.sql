-- Habilitar realtime para mensagens
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;