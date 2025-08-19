-- Primeiro, adicionar as colunas sem constraint NOT NULL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Atualizar registros existentes com valores padrão
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, 'Usuário'),
  last_name = COALESCE(last_name, 'TudoFaz'),
  cpf = COALESCE(cpf, LPAD((random() * 99999999999)::bigint::text, 11, '0'))
WHERE first_name IS NULL OR last_name IS NULL OR cpf IS NULL;

-- Agora adicionar as constraints NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN cpf SET NOT NULL;

-- Adicionar constraint única para CPF
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- Adicionar constraint para validar formato do CPF (11 dígitos)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_format CHECK (cpf ~ '^\d{11}$');