-- Configurar REPLICA IDENTITY para capturar dados completos nas mudanças
ALTER TABLE public.messages REPLICA IDENTITY FULL;