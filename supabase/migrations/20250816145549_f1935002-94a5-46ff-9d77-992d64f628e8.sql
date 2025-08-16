-- Create optimized indexes for affiliate system performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_fraud_detection 
ON affiliate_clicks(visitor_ip, clicked_at, affiliate_link_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_performance 
ON affiliate_links(affiliate_id, listing_id, tracking_code);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_stats 
ON affiliate_commissions(affiliate_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_tracking 
ON orders(affiliate_id, tracking_code, status, created_at);

-- Create fraud detection function
CREATE OR REPLACE FUNCTION detect_affiliate_fraud(
  p_affiliate_link_id uuid,
  p_visitor_ip inet,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fraud_score integer := 0;
  fraud_reasons text[] := '{}';
  click_count integer;
  recent_clicks integer;
  suspicious_pattern boolean;
BEGIN
  -- Check for excessive clicks from same IP
  SELECT COUNT(*) INTO click_count
  FROM affiliate_clicks 
  WHERE visitor_ip = p_visitor_ip 
  AND affiliate_link_id = p_affiliate_link_id;
  
  IF click_count > 10 THEN
    fraud_score := fraud_score + 50;
    fraud_reasons := array_append(fraud_reasons, 'Excessive clicks from same IP');
  END IF;
  
  -- Check for rapid clicking patterns (more than 5 clicks in 1 hour)
  SELECT COUNT(*) INTO recent_clicks
  FROM affiliate_clicks 
  WHERE visitor_ip = p_visitor_ip 
  AND affiliate_link_id = p_affiliate_link_id
  AND clicked_at > NOW() - INTERVAL '1 hour';
  
  IF recent_clicks > 5 THEN
    fraud_score := fraud_score + 30;
    fraud_reasons := array_append(fraud_reasons, 'Rapid clicking pattern detected');
  END IF;
  
  -- Check for suspicious user agent patterns
  IF p_user_agent IS NULL OR 
     p_user_agent ILIKE '%bot%' OR 
     p_user_agent ILIKE '%crawler%' OR 
     p_user_agent ILIKE '%spider%' THEN
    fraud_score := fraud_score + 25;
    fraud_reasons := array_append(fraud_reasons, 'Suspicious user agent');
  END IF;
  
  -- Check for clicks outside business hours repeatedly (potential automation)
  SELECT EXISTS(
    SELECT 1 FROM affiliate_clicks 
    WHERE visitor_ip = p_visitor_ip 
    AND affiliate_link_id = p_affiliate_link_id
    AND EXTRACT(hour FROM clicked_at) NOT BETWEEN 8 AND 22
    GROUP BY date_trunc('day', clicked_at)
    HAVING COUNT(*) > 10
  ) INTO suspicious_pattern;
  
  IF suspicious_pattern THEN
    fraud_score := fraud_score + 20;
    fraud_reasons := array_append(fraud_reasons, 'Suspicious timing patterns');
  END IF;
  
  RETURN jsonb_build_object(
    'fraud_score', fraud_score,
    'is_suspicious', fraud_score >= 50,
    'is_fraudulent', fraud_score >= 75,
    'reasons', fraud_reasons
  );
END;
$$;

-- Create optimized affiliate analytics function
CREATE OR REPLACE FUNCTION get_affiliate_analytics(
  p_affiliate_id uuid,
  p_start_date timestamp DEFAULT NOW() - INTERVAL '30 days',
  p_end_date timestamp DEFAULT NOW()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create batch processing function for affiliate payouts
CREATE OR REPLACE FUNCTION process_affiliate_payouts(
  p_batch_size integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;