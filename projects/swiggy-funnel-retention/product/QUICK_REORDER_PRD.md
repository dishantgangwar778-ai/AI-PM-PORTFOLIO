# One-Page Product Requirements: Quick Reorder

**Product area:** Food delivery · **Status:** Proposed concept · **Evidence:** Synthetic portfolio analysis

## Problem
In the synthetic funnel, the largest observed stage drop-off is restaurant view → add-to-cart (45.44%). This indicates where to investigate, but does not establish why customers leave. Customer-level data also shows a high share of one-order customers; the seven-day repeat baseline needs cohort validation.

## User problem hypothesis
Returning customers may face unnecessary effort rebuilding a familiar order. A quick-reorder entry point could reduce repeated browsing while preserving informed customer choice.

## Goal
Increase the eligible-customer seven-day second delivered-order rate without worsening cancellation, order economics, customer support burden, or order accuracy.

## Scope
- Display a Quick Reorder card to eligible returning customers.
- Show a clear summary of the previous order and current availability.
- Revalidate current item prices, fees, address and serviceability.
- Open a reviewable cart with edit/remove controls.
- Require explicit customer confirmation to proceed to checkout.

## Non-goals
- Automatic order placement or payment.
- Silent item substitutions.
- Promising the old price or availability.
- Discounts as a required part of the MVP.

## Requirements & acceptance criteria
1. Only show the card when an eligible prior order exists.
2. If an item is unavailable, identify it and let the customer remove or edit it; never silently substitute.
3. Display current item prices and applicable fees before checkout.
4. Revalidate delivery address and serviceability.
5. Let the customer review and edit the rebuilt cart.
6. Require an explicit checkout action; no purchase occurs from tapping the card alone.
7. Track exposure, tap, cart rebuild, item edits/removals, checkout start, order placed, order delivered, cancellation and validation errors.
8. Provide a safe fallback to normal browsing when the previous order cannot be rebuilt.

## Measurement
**Primary:** eligible assigned customers with a second delivered order within seven days / eligible assigned customers with a complete seven-day follow-up.

**Guardrails:** cancellation rate, delivered order value, discount cost, support contacts, item availability, price mismatch, checkout errors and customer complaints.

**Experiment:** randomize eligible customers into existing-experience control and Quick Reorder treatment. Predefine sample size, assignment unit, eligibility, exclusions and analysis window. The 5% → 7% (+2 percentage points) goal is illustrative only—not a measured outcome or forecast. Do not ship based solely on click-through rate.

## Risks
Stale prices/availability, low-quality past orders, address changes, confusing fees, repeat-order cannibalization, and misleading attribution. Mitigate with live validation, visible review/edit controls, guardrail monitoring and a controlled test.

## Data caveat
All supporting figures come from synthetic data and are not Swiggy internal metrics. The concept has not been tested in a live experiment.
