-- Criar sistema de afiliados - Migração corrigida

-- Primeiro, vamos verificar e criar o tipo de status de pedidos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_type') THEN
        CREATE TYPE order_status_type AS ENUM ('pending', 'paid', 'canceled', 'in_analysis', 'approved');
    END IF;
END $$;

-- Adicionar novos campos na tabela listings para afiliados
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS affiliate_commission_rate INTEGER DEFAULT 0; -- Porcentagem x100 (ex: 1500 = 15%)

-- Adicionar campos de afiliado na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_id UUID,
ADD COLUMN IF NOT EXISTS affiliate_commission INTEGER DEFAULT 0, -- Em centavos
ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Criar tabela de afiliados
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  pix_key TEXT,
  bank_account JSONB,
  total_earnings INTEGER DEFAULT 0, -- Em centavos
  available_balance INTEGER DEFAULT 0, -- Em centavos
  withdrawn_balance INTEGER DEFAULT 0, -- Em centavos
  status TEXT DEFAULT 'active', -- active, suspended, pending
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de solicitações de afiliação
CREATE TABLE IF NOT EXISTS public.affiliate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, listing_id)
);

-- Criar tabela de links de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tracking_code TEXT UNIQUE NOT NULL,
  clicks_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, listing_id)
);

-- Criar tabela de cliques de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  visitor_ip INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES public.orders(id)
);

-- Criar tabela de comissões
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  commission_rate INTEGER NOT NULL, -- Porcentagem x100
  commission_amount INTEGER NOT NULL, -- Em centavos
  order_amount INTEGER NOT NULL, -- Em centavos
  status TEXT DEFAULT 'pending', -- pending, confirmed, paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de saques
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Em centavos
  pix_key TEXT,
  bank_account JSONB,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Adicionar foreign key para affiliate_id na tabela orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_affiliate_id_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_affiliate_id_fkey 
        FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id);
    END IF;
END $$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;