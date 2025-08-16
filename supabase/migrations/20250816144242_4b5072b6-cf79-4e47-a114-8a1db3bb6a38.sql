-- Criar tabela de logs de atividades
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies para activity_logs
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_activity_logs_updated_at
BEFORE UPDATE ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();