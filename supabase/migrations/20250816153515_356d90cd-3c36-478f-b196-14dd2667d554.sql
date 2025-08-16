-- Criar função para obter analytics de vendas (sem view)
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE(
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  buyer_id UUID,
  seller_id UUID,
  affiliate_id UUID,
  affiliate_commission INTEGER,
  buyer_email TEXT,
  buyer_name TEXT,
  seller_email TEXT,
  seller_name TEXT,
  total_items BIGINT,
  sale_date DATE,
  sale_hour INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    DATE(o.created_at) as sale_date,
    EXTRACT(hour FROM o.created_at)::INTEGER as sale_hour
  FROM orders o
  LEFT JOIN profiles bp ON o.user_id = bp.id
  LEFT JOIN profiles sp ON o.seller_id = sp.id
  LEFT JOIN (
    SELECT 
      order_id,
      COUNT(*) as total_items
    FROM order_items 
    GROUP BY order_id
  ) oi ON o.id = oi.order_id
  WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  AND o.status != 'cancelled';
END;
$$;

-- Função para métricas resumidas de vendas
CREATE OR REPLACE FUNCTION public.get_sales_summary(
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
  total_orders_today BIGINT,
  revenue_today NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  top_day_sales BIGINT;
BEGIN
  -- Métricas básicas
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0) / 100.0,
    COALESCE(AVG(amount), 0) / 100.0
  INTO total_sales, total_revenue, avg_order_value
  FROM orders o
  WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  AND o.status != 'cancelled';

  -- Dia com mais vendas
  SELECT 
    TO_CHAR(DATE(created_at), 'DD/MM/YYYY')
  INTO top_selling_day
  FROM orders o
  WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  AND o.status != 'cancelled'
  GROUP BY DATE(o.created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Horário de pico
  SELECT EXTRACT(hour FROM created_at)::INTEGER
  INTO peak_hour
  FROM orders o
  WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
  AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  AND o.status != 'cancelled'
  GROUP BY EXTRACT(hour FROM o.created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Vendas hoje
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0) / 100.0
  INTO total_orders_today, revenue_today
  FROM orders o
  WHERE DATE(o.created_at) = CURRENT_DATE
  AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  AND o.status != 'cancelled';

  RETURN QUERY SELECT 
    get_sales_summary.total_sales,
    get_sales_summary.total_revenue,
    get_sales_summary.avg_order_value,
    get_sales_summary.top_selling_day,
    get_sales_summary.peak_hour,
    get_sales_summary.total_orders_today,
    get_sales_summary.revenue_today;
END;
$$;