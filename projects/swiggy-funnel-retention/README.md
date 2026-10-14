# Swiggy Food Delivery Funnel & Retention Analytics

> Independent Associate Product Manager portfolio case study using **synthetic data** for January–June 2025. These are **not Swiggy internal metrics**. Quick Reorder is a proposed product concept; no live experiment has been run.

## Presentation

- **[View the PowerPoint deck online](https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fraw.githubusercontent.com%2Fdishantgangwar778-ai%2FAI-PM-PORTFOLIO%2Frefs%2Fheads%2Fmain%2Fprojects%2Fswiggy-funnel-retention%2FSwiggy_Funnel_Retention_APM_Portfolio_Deck.pptx&wdOrigin=BROWSELINK)** — Microsoft Office web viewer.
- **[Download the PowerPoint (.pptx)](https://raw.githubusercontent.com/dishantgangwar778-ai/AI-PM-PORTFOLIO/main/projects/swiggy-funnel-retention/Swiggy_Funnel_Retention_APM_Portfolio_Deck.pptx)** — direct file link.

## Project overview
This project examines the food-delivery journey from app open to order placement, describes order-frequency and seven-day repeat behaviour, and translates observed patterns into a product hypothesis and measurement plan.

## Key findings (synthetic dataset)
- **12,000** app-open sessions; **2,559** order-placed funnel sessions.
- **21.33%** app-open-to-order-placed conversion (2,559 / 12,000).
- Largest observed step drop-off: **45.44%** from restaurant view to add-to-cart.
- **76.20%** of ordering customers placed exactly one order (1,511 / 1,983).
- Reported seven-day second delivered-order rate: **5.00%** (78 / 1,561 eligible customers); validate cohort SQL and eligibility before treating this as decision-grade.
- **2,296** delivered orders from 2,559 placed orders; 263 cancelled.

These descriptive metrics show where to investigate; they do not establish why users abandon or fail to return.

## Product proposal: Quick Reorder
A home-screen card lets eligible customers rebuild a previous order into a **reviewable cart**, after re-checking current item availability, prices, fees, address and serviceability. Checkout and payment confirmation remain under customer control.

## Experiment plan
- **Hypothesis:** Quick Reorder increases the seven-day second delivered-order rate.
- **Control:** existing ordering experience.
- **Treatment:** Quick Reorder card plus reviewable cart and live validation.
- **Primary metric:** eligible assigned customers with a second delivered order within seven days / eligible assigned customers with a complete seven-day follow-up.
- **Guardrails:** cancellations, delivered order value, discount cost, support contacts, availability and price-validation errors.
- **Illustrative target:** 5% to 7% (+2 percentage points), a planning target—not a forecast or result.
- No live A/B test has been run.

## Repository contents
- `sql/` — analysis queries.
- `dashboard/` — static HTML dashboard.
- `product/` — Quick Reorder PRD and experiment notes.
- `case-study/` — written case study.
- PowerPoint deck is in the project folder root; use the presentation links above.

## Reproducibility & caveats
The data is synthetic. Confirm schema and event/status values before running SQL. The funnel’s order-placed stage is not the same as a delivered order. Retrospective seven-day cohorts need a complete follow-up window. Delivery comparisons are observational and do not establish causation. Validate AOV and cohort calculations against the underlying SQL before using them as baselines.

## Author
Dishant Kumar · Associate Product Manager portfolio project
