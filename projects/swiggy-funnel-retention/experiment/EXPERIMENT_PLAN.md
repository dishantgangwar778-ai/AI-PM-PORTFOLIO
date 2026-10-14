# Quick Reorder — Experiment Plan

## Question
Does surfacing a Quick Reorder card increase the seven-day second delivered-order rate for eligible returning customers?

## Design
- **Control:** current home/browse experience.
- **Treatment:** Quick Reorder card that builds a reviewable cart, with current-price, item-availability and serviceability validation.
- **Assignment:** randomize at customer level to avoid cross-session contamination; validate feasibility with the implementation team.
- **Eligibility:** define eligible prior delivered order, account state, serviceable address and complete follow-up before launch.
- **Primary metric:** eligible assigned customers with a second delivered order within seven days divided by eligible assigned customers with complete seven-day follow-up.
- **Guardrails:** cancellations, delivered order value, discount cost, support contacts, price mismatches, unavailable items, checkout errors and complaints.

## Analysis plan
1. Pre-register eligibility, exclusions, assignment, primary metric and observation window.
2. Calculate sample size using a validated baseline, chosen minimum detectable effect, significance level and power.
3. Check randomization balance and instrumentation quality before interpreting results.
4. Report absolute and relative changes with confidence intervals; avoid declaring a winner if the test is underpowered or guardrails deteriorate.
5. Separate intention-to-treat results from exploratory segment analysis.

## Illustrative planning target
A move from 5% to 7% (+2 percentage points) is an illustrative target only. It is not a result, forecast, or evidence that the feature works. Validate the baseline and power calculation before setting a final target.

## Current status
Proposed experiment only. No live experiment has been run; no causal impact is established.
