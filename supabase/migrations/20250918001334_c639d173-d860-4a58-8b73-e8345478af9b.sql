-- ============================================================================
-- SISTEMA DE TRADUÇÃO EM TEMPO REAL - INFRAESTRUTURA
-- ============================================================================

-- Tabela para cache de traduções
CREATE TABLE public.translations_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  source_text TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'pt',
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'deepl',
  domain TEXT NOT NULL, -- 'listing.title', 'listing.description', 'static.terms', etc
  entity_id UUID NULL, -- ID do listing, page, etc
  quality_score INTEGER DEFAULT 100,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_translations_cache_hash ON public.translations_cache(content_hash);
CREATE INDEX idx_translations_cache_lookup ON public.translations_cache(source_lang, target_lang, domain);
CREATE INDEX idx_translations_cache_entity ON public.translations_cache(entity_id, domain);
CREATE INDEX idx_translations_cache_last_used ON public.translations_cache(last_used_at);

-- Tabela para glossário de tradução
CREATE TABLE public.translation_glossary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}', -- {"en": "TudoFaz", "es": "TudoFaz"}
  case_sensitive BOOLEAN DEFAULT false,
  domain TEXT NULL, -- opcional: aplicar apenas em domínios específicos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para jobs de tradução
CREATE TABLE public.translation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'translate', 'batch_translate', 'invalidate'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 5, -- 1-10, menor = maior prioridade
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB NULL,
  error_message TEXT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para jobs
CREATE INDEX idx_translation_jobs_status ON public.translation_jobs(status);
CREATE INDEX idx_translation_jobs_scheduled ON public.translation_jobs(scheduled_for);
CREATE INDEX idx_translation_jobs_priority ON public.translation_jobs(priority);

-- Tabela para traduções específicas de listings
CREATE TABLE public.listing_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  language TEXT NOT NULL,
  title TEXT NULL,
  description TEXT NULL,
  location TEXT NULL,
  slug TEXT NULL,
  last_source_updated TIMESTAMP WITH TIME ZONE NULL,
  translation_quality INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, language)
);

-- Índices para listing translations
CREATE INDEX idx_listing_translations_listing ON public.listing_translations(listing_id);
CREATE INDEX idx_listing_translations_lang ON public.listing_translations(language);

-- Tabela para conteúdo estático traduzido
CREATE TABLE public.static_content_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL, -- 'terms.title', 'privacy.body', etc
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- 'text', 'html', 'markdown'
  last_source_updated TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_key, language)
);

-- Índices para static content
CREATE INDEX idx_static_content_key ON public.static_content_translations(content_key);
CREATE INDEX idx_static_content_lang ON public.static_content_translations(language);

-- Tabela para métricas de tradução
CREATE TABLE public.translation_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  language TEXT NOT NULL,
  domain TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  total_chars INTEGER DEFAULT 0,
  provider_cost DECIMAL(10,6) DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0, -- ms
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, language, domain)
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_metrics ENABLE ROW LEVEL SECURITY;

-- Policies para translations_cache
CREATE POLICY "Public can read translations cache" 
ON public.translations_cache FOR SELECT USING (true);

CREATE POLICY "System can manage translations cache" 
ON public.translations_cache FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() IS NULL
);

CREATE POLICY "Admins can manage translations cache" 
ON public.translations_cache FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policies para translation_glossary
CREATE POLICY "Public can read glossary" 
ON public.translation_glossary FOR SELECT USING (true);

CREATE POLICY "Admins can manage glossary" 
ON public.translation_glossary FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policies para translation_jobs
CREATE POLICY "Admins can view translation jobs" 
ON public.translation_jobs FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can manage translation jobs" 
ON public.translation_jobs FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() IS NULL
);

-- Policies para listing_translations
CREATE POLICY "Public can read listing translations" 
ON public.listing_translations FOR SELECT USING (true);

CREATE POLICY "System can manage listing translations" 
ON public.listing_translations FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() IS NULL
);

CREATE POLICY "Listing owners can manage their translations" 
ON public.listing_translations FOR ALL USING (
  listing_id IN (
    SELECT id FROM listings WHERE user_id = auth.uid()
  )
);

-- Policies para static_content_translations
CREATE POLICY "Public can read static content translations" 
ON public.static_content_translations FOR SELECT USING (true);

CREATE POLICY "Admins can manage static content translations" 
ON public.static_content_translations FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policies para translation_metrics
CREATE POLICY "Admins can view translation metrics" 
ON public.translation_metrics FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can manage translation metrics" 
ON public.translation_metrics FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() IS NULL
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Função para gerar hash de conteúdo
CREATE OR REPLACE FUNCTION public.generate_content_hash(
  p_source_text TEXT,
  p_source_lang TEXT,
  p_target_lang TEXT,
  p_domain TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    sha256(
      (p_source_text || '|' || p_source_lang || '|' || p_target_lang || '|' || p_domain)::bytea
    ), 
    'hex'
  );
END;
$$;

-- Função para aplicar glossário
CREATE OR REPLACE FUNCTION public.apply_glossary_to_text(
  p_text TEXT,
  p_target_lang TEXT,
  p_domain TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  glossary_record RECORD;
  result_text TEXT := p_text;
  translation TEXT;
BEGIN
  -- Aplicar termos do glossário
  FOR glossary_record IN 
    SELECT term, translations, case_sensitive
    FROM public.translation_glossary
    WHERE (domain IS NULL OR domain = p_domain)
    ORDER BY LENGTH(term) DESC -- Termos mais longos primeiro
  LOOP
    -- Extrair tradução para o idioma alvo
    translation := glossary_record.translations ->> p_target_lang;
    
    IF translation IS NOT NULL THEN
      IF glossary_record.case_sensitive THEN
        result_text := REPLACE(result_text, glossary_record.term, translation);
      ELSE
        result_text := REGEXP_REPLACE(
          result_text, 
          glossary_record.term, 
          translation, 
          'gi'
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN result_text;
END;
$$;

-- Função para atualizar métricas
CREATE OR REPLACE FUNCTION public.update_translation_metrics(
  p_language TEXT,
  p_domain TEXT,
  p_was_cache_hit BOOLEAN,
  p_char_count INTEGER,
  p_response_time INTEGER DEFAULT 0,
  p_cost DECIMAL DEFAULT 0
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.translation_metrics (
    date, language, domain, requests_count, cache_hits, cache_misses, 
    total_chars, provider_cost, avg_response_time
  ) VALUES (
    CURRENT_DATE, p_language, p_domain, 1,
    CASE WHEN p_was_cache_hit THEN 1 ELSE 0 END,
    CASE WHEN p_was_cache_hit THEN 0 ELSE 1 END,
    p_char_count, p_cost, p_response_time
  )
  ON CONFLICT (date, language, domain) 
  DO UPDATE SET
    requests_count = translation_metrics.requests_count + 1,
    cache_hits = translation_metrics.cache_hits + CASE WHEN p_was_cache_hit THEN 1 ELSE 0 END,
    cache_misses = translation_metrics.cache_misses + CASE WHEN p_was_cache_hit THEN 0 ELSE 1 END,
    total_chars = translation_metrics.total_chars + p_char_count,
    provider_cost = translation_metrics.provider_cost + p_cost,
    avg_response_time = (translation_metrics.avg_response_time + p_response_time) / 2,
    updated_at = now();
END;
$$;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translations_cache_updated_at
  BEFORE UPDATE ON public.translations_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_translation_glossary_updated_at
  BEFORE UPDATE ON public.translation_glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_translation_jobs_updated_at
  BEFORE UPDATE ON public.translation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_listing_translations_updated_at
  BEFORE UPDATE ON public.listing_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_static_content_translations_updated_at
  BEFORE UPDATE ON public.static_content_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();