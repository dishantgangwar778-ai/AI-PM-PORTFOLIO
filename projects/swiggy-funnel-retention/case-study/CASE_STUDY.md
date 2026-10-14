# Swiggy Food Delivery Funnel & Retention Analytics

## Executive summary
This portfolio case study uses a synthetic January–June 2025 dataset to examine the food-delivery funnel and repeat ordering. The data is illustrative and is not Swiggy internal data.

## Problem framing
The funnel has its largest observed step-level loss between restaurant view and add-to-cart. This is a place to investigate, not proof of a specific user pain point. Potential causes should be validated through user research, event-level diagnostics, and controlled experiments.

## Funnel findings
| Stage | Sessions | Conversion from previous stage | Drop-off from previous stage |
|---|---:|---:|---:|
| App open | 12,000 | — | — |
| Restaurant view | 8,981 | 74.84% | 25.16% |
| Add to cart | 4,900 | 54.56% | 45.44% |
| Checkout | 3,452 | 70.45% | 29.55% |
| Order placed | 2,559 | 74.13% | 25.87% |

Overall app-open-to-order-placed conversion is 21.33% (2,559 / 12,000). Platform restaurant-view-to-add-to-cart rates were Web 55.28%, iOS 54.26%, and Android 54.11%; these small differences alone do not establish a platform-specific cause.

## Retention and order behaviour
Of 1,983 ordering customers, 1,511 placed exactly one order (76.20%), 387 placed two (19.52%), and 85 placed three or more (4.29%). Repeat-customer share is therefore 23.80% under this customer-level definition. A reported seven-day repeat metric is 78 / 1,561 = 5.00%; cohort eligibility, delivered-order definition, and complete follow-up window must be validated before treating it as a decision-grade baseline.

The dataset shows 2,559 placed orders, 2,296 delivered and 263 cancelled (10.28% of placed orders). A previously reported delivered-order AOV of ₹737.79 should be independently validated against the query and definition before being used as a baseline.

## Product hypothesis: Quick Reorder
Offer a home-screen card to help customers rebuild a previous order into a reviewable cart. Before checkout, revalidate current price, item availability, fees, delivery address and serviceability. Customers can edit or remove items and must explicitly confirm checkout. Do not place orders automatically or silently substitute unavailable items.

## Experiment proposal
- **Hypothesis:** Quick Reorder increases the share of eligible customers who place a second delivered order within seven days.
- **Control:** existing experience.
- **Treatment:** Quick Reorder card and reviewable cart with current-price and availability validation.
- **Primary metric:** eligible assigned customers with a second delivered order within seven days divided by eligible assigned customers with a complete seven-day follow-up.
- **Guardrails:** cancellation rate, delivered order value, discount cost, support contacts, item availability, price mismatch and checkout errors.
- **Illustrative target:** 5% to 7% (+2 percentage points). This is a planning target, not an observed result or forecast.
- **Decision:** define sample size, assignment unit, eligibility and analysis plan before launch; monitor guardrails and avoid claiming causality from retrospective data.

## Limitations
All data is synthetic. The funnel identifies where users leave, not why. Order placement differs from delivery. Cohort definitions and the seven-day repeat calculation need validation; AOV also needs query-level validation. No live experiment has been conducted, so impact is unproven.
