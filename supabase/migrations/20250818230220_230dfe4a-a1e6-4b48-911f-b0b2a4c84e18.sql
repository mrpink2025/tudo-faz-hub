-- Limpar perfis duplicados de afiliados (manter apenas o mais antigo por usuário)
DELETE FROM affiliates 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM affiliates
  ORDER BY user_id, created_at ASC
);

-- Adicionar constraint única para user_id na tabela affiliates
ALTER TABLE affiliates 
ADD CONSTRAINT affiliates_user_id_unique UNIQUE (user_id);