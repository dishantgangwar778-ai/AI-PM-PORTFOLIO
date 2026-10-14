-- Swiggy Food Delivery Funnel & Retention Analytics
-- Independent portfolio project using synthetic data; NOT Swiggy internal data.
-- SQLite query templates. Validate schema/event/status values against source CSVs.

-- 1) Funnel event counts by distinct session
SELECT event_name, COUNT(DISTINCT session_id) AS sessions
FROM funnel_events
WHERE date(event_time) >= '2025-01-01'
  AND date(event_time) < '2025-07-01'
GROUP BY event_name;

-- 2) Core funnel stages, conversion from previous stage, and step drop-off
WITH f AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event_name='app_open' THEN session_id END) AS app_open,
    COUNT(DISTINCT CASE WHEN event_name='restaurant_view' THEN session_id END) AS restaurant_view,
    COUNT(DISTINCT CASE WHEN event_name='add_to_cart' THEN session_id END) AS add_to_cart,
    COUNT(DISTINCT CASE WHEN event_name='checkout' THEN session_id END) AS checkout,
    COUNT(DISTINCT CASE WHEN event_name='order_placed' THEN session_id END) AS order_placed
  FROM funnel_events
  WHERE date(event_time) >= '2025-01-01'
    AND date(event_time) < '2025-07-01'
)
SELECT 'App open' AS stage, app_open AS sessions, NULL AS conversion_pct, NULL AS dropoff_pct FROM f
UNION ALL
SELECT 'Restaurant view', restaurant_view,
       ROUND(100.0*restaurant_view/NULLIF(app_open,0),2),
       ROUND(100.0*(app_open-restaurant_view)/NULLIF(app_open,0),2) FROM f
UNION ALL
SELECT 'Add-to-cart', add_to_cart,
       ROUND(100.0*add_to_cart/NULLIF(restaurant_view,0),2),
       ROUND(100.0*(restaurant_view-add_to_cart)/NULLIF(restaurant_view,0),2) FROM f
UNION ALL
SELECT 'Checkout', checkout,
       ROUND(100.0*checkout/NULLIF(add_to_cart,0),2),
       ROUND(100.0*(add_to_cart-checkout)/NULLIF(add_to_cart,0),2) FROM f
UNION ALL
SELECT 'Order placed', order_placed,
       ROUND(100.0*order_placed/NULLIF(checkout,0),2),
       ROUND(100.0*(checkout-order_placed)/NULLIF(checkout,0),2) FROM f;

-- 3) Platform comparison: restaurant view -> add-to-cart
WITH p AS (
  SELECT s.platform,
    COUNT(DISTINCT CASE WHEN f.event_name='restaurant_view' THEN f.session_id END) AS restaurant_views,
    COUNT(DISTINCT CASE WHEN f.event_name='add_to_cart' THEN f.session_id END) AS add_to_carts
  FROM funnel_events f
  JOIN sessions s ON s.session_id=f.session_id
  WHERE date(f.event_time)>='2025-01-01'
    AND date(f.event_time)<'2025-07-01'
  GROUP BY s.platform
)
SELECT platform, restaurant_views, add_to_carts,
       ROUND(100.0*add_to_carts/NULLIF(restaurant_views,0),2) AS view_to_cart_pct
FROM p ORDER BY platform;

-- 4) Order frequency among customers with >=1 order in the period
WITH counts AS (
  SELECT customer_id, COUNT(DISTINCT order_id) AS n
  FROM orders
  WHERE date(order_date)>='2025-01-01' AND date(order_date)<'2025-07-01'
  GROUP BY customer_id
), grouped AS (
  SELECT CASE WHEN n=1 THEN 'Exactly 1'
              WHEN n=2 THEN 'Exactly 2'
              ELSE '3 or more' END AS bucket,
         COUNT(*) AS customers
  FROM counts GROUP BY bucket
)
SELECT bucket, customers,
       ROUND(100.0*customers/SUM(customers) OVER (),2) AS share_pct
FROM grouped
ORDER BY CASE bucket WHEN 'Exactly 1' THEN 1 WHEN 'Exactly 2' THEN 2 ELSE 3 END;

-- 5) Order outcomes and cancellation rate
SELECT COUNT(*) AS orders_placed,
       SUM(CASE WHEN lower(order_status)='delivered' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN lower(order_status)='cancelled' THEN 1 ELSE 0 END) AS cancelled,
       ROUND(100.0*SUM(CASE WHEN lower(order_status)='cancelled' THEN 1 ELSE 0 END)
             / NULLIF(COUNT(*),0),2) AS cancellation_pct
FROM orders
WHERE date(order_date)>='2025-01-01' AND date(order_date)<'2025-07-01';

-- Important: before calculating seven-day repeat delivered rate, confirm whether
-- order_date is placement or delivery date. Use delivery timestamps where available,
-- require a complete seven-day observation window, and match the case-study cohort
-- definition exactly. These templates need validation against the actual source schema.

-- Interpretation caution:
-- Counts are event/session counts, not necessarily a strict sequential user journey.
-- Confirm the funnel definition (and event ordering per session) before treating the
-- stage ratios as a cohort-based conversion funnel.
