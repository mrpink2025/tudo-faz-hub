-- Fix remaining functions missing search_path security setting

-- Update all functions that are missing SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.send_notification_email(user_email text, subject text, message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Registrar notificação na tabela (se necessário criar tabela de notificações)
    -- Por enquanto apenas uma função placeholder que pode ser chamada via trigger
    RAISE NOTICE 'Email notification would be sent to % with subject: %', user_email, subject;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_pending_listing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Notificar admins sobre novo anúncio pendente
    PERFORM send_notification_email(
        'admin@tudofaz.com',
        'Novo anúncio pendente de aprovação',
        'Um novo anúncio foi enviado e está aguardando aprovação: ' || NEW.title
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = new.email,
    email_confirmed_at = new.email_confirmed_at,
    last_sign_in_at = new.last_sign_in_at,
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, email_confirmed_at, last_sign_in_at, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at,
    NEW.last_sign_in_at,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_site_settings_public()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- This function is no longer needed since we removed the public views
  -- Keep as placeholder for compatibility
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;