# MakeMyTrip Flight Booking — Product Teardown

> **[VIEW PDF — MakeMyTrip Flight Booking Teardown](./MakeMyTrip_Flight_Booking_Teardown_3_12_Pages.pdf)**  
> Independent product teardown and proposed decision-support concept  
> **Important:** This is an independent portfolio analysis, not an official MakeMyTrip product or feature. The proposed recommendation logic is illustrative, and no live A/B test has been conducted.

## 1. Summary

This teardown examines the domestic flight-booking journey from search results through comparison, selection, review and payment. It explores a potential decision-friction problem: travellers can filter flights, but may still need to manually reconcile trade-offs across price, departure time, duration, stops and baggage.

**Opportunity hypothesis:** help travellers evaluate options against their own stated priorities, rather than making them repeatedly switch between one-dimensional sorting modes.

## 2. Target user and context

**Primary persona:** a domestic, price-conscious traveller with a firm budget and non-negotiable constraints around departure time and baggage.

Illustrative trip used in the case study:
- Route: New Delhi (DEL) → Bengaluru (BLR)
- Date: 24 October
- Travellers: 1 adult, economy
- Example constraints: budget up to ₹7,000, morning departure, non-stop flight and 15 kg baggage

These trip details and flight examples are illustrative scenario data, not live inventory or current fares.

## 3. Journey reviewed

1. **Search:** enter origin, destination, dates and cabin class.
2. **Results:** scan a list of flight options.
3. **Compare:** change filters and sorting to evaluate trade-offs.
4. **Select:** commit to a flight.
5. **Review:** confirm itinerary and passenger details.
6. **Payment:** complete the reservation and receive confirmation.

The case study focuses on the results, comparison and selection stages, where repeated evaluation may create friction.

## 4. What works and potential friction

### Existing strengths observed in the reviewed experience
- A comprehensive filter set for airline, baggage, stops and refund policies.
- Upfront display of base fare in the results list.
- Broad flight-option discovery in a familiar list-based journey.

### Opportunity areas / hypotheses
- **Multi-attribute evaluation:** users may need to mentally compare price, timing, duration, stops and baggage across multiple cards.
- **Limited alignment explanation:** the interface may not clearly explain which option best fits a traveller's combined priorities.
- **One-dimensional sorting:** sorting by cheapest or fastest can force users to repeatedly switch modes to evaluate different trade-offs.
- **Memory burden:** users may need to remember their constraints while moving between results and flight details.

These are product hypotheses from an independent teardown, not measured evidence of user abandonment or conversion loss.

## 5. Root-cause hypothesis

Filtering narrows the option set, but does not necessarily synthesise trade-offs across the traveller's combined preferences.

A traveller may accept a modest price premium if a flight better matches their schedule, baggage needs and stop preferences. The product opportunity is to make that fit understandable without hiding the alternatives.

## 6. Proposed concept: Explainable Best Match

The proposed concept shifts the experience from **option discovery** toward **guided evaluation and trade-off transparency**.

### Proposed flow

1. **State priorities:** capture budget, departure window, stops, baggage and other hard constraints.
2. **Rank eligible options:** apply hard constraints first, then weigh stated preferences.
3. **Explain the recommendation:** show why the recommended flight fits the user's constraints.
4. **Compare alternatives:** retain clear Cheapest and Fastest options alongside Best Match.
5. **Continue booking:** let the traveller select, review and proceed through the existing booking journey.

**Definition:** Best Match is not necessarily the cheapest or fastest flight. It is the available option that most closely fits the user's explicitly stated priorities.

### Example explanation

An illustrative Best Match card could explain:
- within the stated ₹7,000 budget;
- morning departure aligns with the traveller's schedule;
- non-stop route reduces travel time; and
- baggage allowance matches the stated requirement.

The example recommendation and flight details are illustrative only.

## 7. Recommendation logic — concept, not production algorithm

A conceptual scoring model could:
- exclude flights that violate hard constraints;
- score remaining options against preference weights;
- show the strongest matching option;
- disclose the factors contributing to the match; and
- fall back to the standard results experience when confidence is low or no suitable option exists.

The score should not be presented as objective truth. Users should be able to inspect trade-offs and choose another flight.

## 8. Trust, edge cases and failure handling

| Scenario | Proposed response |
|---|---|
| No strong match / low confidence | Suppress the Best Match banner and let users adjust constraints |
| Fare changes | Refresh the fare, clearly flag the change and recompute the recommendation |
| Flight sells out | Block selection and surface the closest available alternative |
| User changes preferences | Recompute the match and visibly update the recommendation |

The proposed experience should never imply that a stale recommendation or fare is still valid.

## 9. Experiment proposal

**Hypothesis:** helping users identify a flight that matches their stated preferences and explaining the trade-offs will reduce decision friction and improve successful booking conversion.

| Element | Design |
|---|---|
| Control | Existing flight ranking and list interface |
| Treatment | Stated-preference intake plus Explainable Best Match |
| Primary metric | Search-to-successful-booking conversion |
| Secondary metric | Time to flight selection |
| Diagnostic metric | Best Match adoption rate |
| Guardrails | Cancellation rate, refund rate, support-contact rate and post-interaction CSAT |

No live experiment has been run. The metrics are a proposed measurement framework; no lift or conversion impact is claimed.

## 10. Key product principles

- Explain why a recommendation fits; do not rely on a badge alone.
- Keep Cheapest and Fastest alternatives visible.
- Separate hard constraints from weighted preferences.
- Recompute when price, availability or user preferences change.
- Preserve user control and avoid overstating recommendation confidence.
- Measure successful bookings alongside post-booking trust guardrails.

## Project classification

This is an independent product teardown with a proposed AI-assisted decision-support concept. It is not an official MakeMyTrip feature, production algorithm or validated experiment.
