-- Criar view para relatórios de vendas
CREATE OR REPLACE VIEW public.sales_analytics AS
SELECT 
  o.id as order_id,
  o.created_at,
  o.amount,
  o.currency,
  o.status,
  o.user_id as buyer_id,
  o.seller_id,
  o.affiliate_id,
  o.affiliate_commission,
  bp.email as buyer_email,
  bp.full_name as buyer_name,
  sp.email as seller_email,
  sp.full_name as seller_name,
  COALESCE(oi.total_items, 0) as total_items,
  COALESCE(oi.unique_listings, 0) as unique_listings,
  DATE_TRUNC('day', o.created_at) as sale_date,
  DATE_TRUNC('week', o.created_at) as sale_week,
  DATE_TRUNC('month', o.created_at) as sale_month,
  EXTRACT(hour FROM o.created_at) as sale_hour
FROM orders o
LEFT JOIN profiles bp ON o.user_id = bp.id
LEFT JOIN profiles sp ON o.seller_id = sp.id
LEFT JOIN (
  SELECT 
    order_id,
    COUNT(*) as total_items,
    COUNT(DISTINCT listing_id) as unique_listings
  FROM order_items 
  GROUP BY order_id
) oi ON o.id = oi.order_id;

-- Criar função para obter métricas de vendas
CREATE OR REPLACE FUNCTION public.get_sales_metrics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_sales BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  top_selling_day TEXT,
  peak_hour INTEGER,
  conversion_rate NUMERIC,
  new_customers BIGINT,
  returning_customers BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  top_day_sales BIGINT;
  peak_sales_hour INTEGER;
BEGIN
  -- Filtrar por vendedor se especificado
  IF p_seller_id IS NOT NULL THEN
    SELECT 
      COUNT(*),
      COALESCE(SUM(amount), 0) / 100.0,
      COALESCE(AVG(amount), 0) / 100.0,
      COUNT(DISTINCT CASE WHEN date_trunc('day', created_at) >= p_start_date THEN user_id END),
      COUNT(DISTINCT CASE WHEN EXISTS (
        SELECT 1 FROM orders o2 
        WHERE o2.user_id = sa.buyer_id 
        AND o2.created_at < p_start_date
      ) THEN user_id END)
    INTO total_sales, total_revenue, avg_order_value, new_customers, returning_customers
    FROM sales_analytics sa
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
    AND (p_seller_id IS NULL OR seller_id = p_seller_id)
    AND status != 'cancelled';
  ELSE
    SELECT 
      COUNT(*),
      COALESCE(SUM(amount), 0) / 100.0,
      COALESCE(AVG(amount), 0) / 100.0,
      COUNT(DISTINCT CASE WHEN date_trunc('day', created_at) >= p_start_date THEN user_id END),
      COUNT(DISTINCT CASE WHEN EXISTS (
        SELECT 1 FROM orders o2 
        WHERE o2.user_id = sa.buyer_id 
        AND o2.created_at < p_start_date
      ) THEN user_id END)
    INTO total_sales, total_revenue, avg_order_value, new_customers, returning_customers
    FROM sales_analytics sa
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
    AND status != 'cancelled';
  END IF;

  -- Encontrar o dia com mais vendas
  SELECT 
    TO_CHAR(sale_date, 'YYYY-MM-DD'),
    COUNT(*)
  INTO top_selling_day, top_day_sales
  FROM sales_analytics
  WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR seller_id = p_seller_id)
  AND status != 'cancelled'
  GROUP BY sale_date
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Encontrar horário de pico
  SELECT sale_hour
  INTO peak_hour
  FROM sales_analytics
  WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR seller_id = p_seller_id)
  AND status != 'cancelled'
  GROUP BY sale_hour
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Taxa de conversão (placeholder - seria calculada com dados de visitação)
  conversion_rate := CASE 
    WHEN total_sales > 0 THEN (total_sales::NUMERIC / GREATEST(total_sales * 10, 1)) * 100
    ELSE 0 
  END;

  RETURN QUERY SELECT 
    get_sales_metrics.total_sales,
    get_sales_metrics.total_revenue,
    get_sales_metrics.avg_order_value,
    get_sales_metrics.top_selling_day,
    get_sales_metrics.peak_hour,
    get_sales_metrics.conversion_rate,
    get_sales_metrics.new_customers,
    get_sales_metrics.returning_customers;
END;
$$;

-- Política RLS para sales_analytics
CREATE POLICY "Admins can view sales analytics" 
ON public.sales_analytics FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));