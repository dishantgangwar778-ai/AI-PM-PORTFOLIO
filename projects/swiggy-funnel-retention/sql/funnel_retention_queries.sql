-- Swiggy Funnel & Retention Analytics
-- Synthetic portfolio dataset only; not Swiggy internal data.
-- Adapt table/column names to the supplied dataset schema before execution.

-- 1) Funnel counts (event-level). Assumes events(user_id, session_id, event_name, event_time).
WITH funnel AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event_name = 'app_open' THEN session_id END) AS app_open,
    COUNT(DISTINCT CASE WHEN event_name = 'restaurant_view' THEN session_id END) AS restaurant_view,
    COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN session_id END) AS add_to_cart,
    COUNT(DISTINCT CASE WHEN event_name = 'checkout' THEN session_id END) AS checkout,
    COUNT(DISTINCT CASE WHEN event_name = 'order_placed' THEN session_id END) AS order_placed
  FROM events
  WHERE event_time >= '2025-01-01' AND event_time < '2025-07-01'
)
SELECT stage, sessions,
       ROUND(100.0 * sessions / NULLIF(LAG(sessions) OVER (ORDER BY stage_order), 0), 2) AS conversion_from_previous_pct,
       ROUND(100.0 * (1 - sessions * 1.0 / NULLIF(LAG(sessions) OVER (ORDER BY stage_order), 0)), 2) AS dropoff_from_previous_pct
FROM funnel
CROSS JOIN LATERAL (VALUES
  (1, 'App open', app_open),
  (2, 'Restaurant view', restaurant_view),
  (3, 'Add to cart', add_to_cart),
  (4, 'Checkout', checkout),
  (5, 'Order placed', order_placed)
) AS stages(stage_order, stage, sessions)
ORDER BY stage_order;

-- 2) Order-frequency distribution. Assumes orders(order_id, customer_id, order_status).
WITH customer_orders AS (
  SELECT customer_id, COUNT(DISTINCT order_id) AS order_count
  FROM orders
  WHERE order_status IN ('placed', 'delivered')
  GROUP BY customer_id
)
SELECT CASE WHEN order_count >= 3 THEN '3+' ELSE CAST(order_count AS VARCHAR) END AS order_frequency,
       COUNT(*) AS customers,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS customer_share_pct
FROM customer_orders
GROUP BY CASE WHEN order_count >= 3 THEN '3+' ELSE CAST(order_count AS VARCHAR) END
ORDER BY MIN(order_count);

-- 3) Seven-day second delivered order rate.
-- Validate eligibility and ensure every included customer has a full 7-day follow-up.
-- Assumes customers(customer_id, eligible_at) and orders(customer_id, order_time, order_status).
WITH eligible AS (
  SELECT customer_id, eligible_at
  FROM customers
  WHERE eligible_at < CURRENT_DATE - INTERVAL '7 days'
), repeaters AS (
  SELECT DISTINCT e.customer_id
  FROM eligible e
  JOIN orders o ON o.customer_id = e.customer_id
    AND o.order_status = 'delivered'
    AND o.order_time > e.eligible_at
    AND o.order_time <= e.eligible_at + INTERVAL '7 days'
)
SELECT COUNT(DISTINCT r.customer_id) AS repeat_customers,
       COUNT(DISTINCT e.customer_id) AS eligible_customers,
       ROUND(100.0 * COUNT(DISTINCT r.customer_id) / NULLIF(COUNT(DISTINCT e.customer_id), 0), 2) AS seven_day_repeat_rate_pct
FROM eligible e
LEFT JOIN repeaters r ON r.customer_id = e.customer_id;

-- 4) Cancellation rate. Validate status values and denominator.
SELECT COUNT(*) FILTER (WHERE order_status = 'cancelled') AS cancelled_orders,
       COUNT(*) AS placed_orders,
       ROUND(100.0 * COUNT(*) FILTER (WHERE order_status = 'cancelled') / NULLIF(COUNT(*), 0), 2) AS cancellation_rate_pct
FROM orders
WHERE order_time >= '2025-01-01' AND order_time < '2025-07-01';
