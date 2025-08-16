-- Fix remaining database functions that need search_path

CREATE OR REPLACE FUNCTION public.get_affiliate_analytics(p_affiliate_id uuid, p_start_date timestamp without time zone DEFAULT (now() - '30 days'::interval), p_end_date timestamp without time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_clicks integer;
  unique_clicks integer;
  conversions integer;
  total_earnings integer;
  conversion_rate numeric;
  avg_commission numeric;
BEGIN
  -- Get total clicks (optimized with index)
  SELECT COUNT(*) INTO total_clicks
  FROM affiliate_clicks ac
  JOIN affiliate_links al ON ac.affiliate_link_id = al.id
  WHERE al.affiliate_id = p_affiliate_id
  AND ac.clicked_at BETWEEN p_start_date AND p_end_date;
  
  -- Get unique clicks by IP
  SELECT COUNT(DISTINCT ac.visitor_ip) INTO unique_clicks
  FROM affiliate_clicks ac
  JOIN affiliate_links al ON ac.affiliate_link_id = al.id
  WHERE al.affiliate_id = p_affiliate_id
  AND ac.clicked_at BETWEEN p_start_date AND p_end_date;
  
  -- Get conversions
  SELECT COUNT(*) INTO conversions
  FROM affiliate_commissions
  WHERE affiliate_id = p_affiliate_id
  AND created_at BETWEEN p_start_date AND p_end_date;
  
  -- Get total earnings
  SELECT COALESCE(SUM(commission_amount), 0) INTO total_earnings
  FROM affiliate_commissions
  WHERE affiliate_id = p_affiliate_id
  AND created_at BETWEEN p_start_date AND p_end_date
  AND status = 'approved';
  
  -- Calculate conversion rate
  conversion_rate := CASE 
    WHEN total_clicks > 0 THEN (conversions::numeric / total_clicks::numeric) * 100
    ELSE 0
  END;
  
  -- Calculate average commission
  avg_commission := CASE 
    WHEN conversions > 0 THEN total_earnings::numeric / conversions::numeric
    ELSE 0
  END;
  
  RETURN jsonb_build_object(
    'total_clicks', total_clicks,
    'unique_clicks', unique_clicks,
    'conversions', conversions,
    'total_earnings', total_earnings,
    'conversion_rate', round(conversion_rate, 2),
    'average_commission', round(avg_commission, 2),
    'period_start', p_start_date,
    'period_end', p_end_date
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_affiliate_payouts(p_batch_size integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  processed_count integer := 0;
  total_amount integer := 0;
  affiliate_record record;
BEGIN
  -- Process affiliates with available balance >= 5000 (R$ 50.00)
  FOR affiliate_record IN 
    SELECT id, available_balance, user_id
    FROM affiliates 
    WHERE available_balance >= 5000
    AND status = 'active'
    ORDER BY available_balance DESC
    LIMIT p_batch_size
  LOOP
    -- Create withdrawal request
    INSERT INTO affiliate_withdrawals (
      affiliate_id,
      amount,
      status,
      requested_at
    ) VALUES (
      affiliate_record.id,
      affiliate_record.available_balance,
      'pending',
      NOW()
    );
    
    -- Update affiliate balance
    UPDATE affiliates 
    SET available_balance = 0,
        withdrawn_balance = withdrawn_balance + affiliate_record.available_balance,
        updated_at = NOW()
    WHERE id = affiliate_record.id;
    
    processed_count := processed_count + 1;
    total_amount := total_amount + affiliate_record.available_balance;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_affiliates', processed_count,
    'total_amount', total_amount,
    'processed_at', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO user_message_reads (user_id, conversation_user_id, last_read_at)
  VALUES (auth.uid(), conversation_user, now())
  ON CONFLICT (user_id, conversation_user_id)
  DO UPDATE SET 
    last_read_at = now(),
    updated_at = now();
END;
$function$;