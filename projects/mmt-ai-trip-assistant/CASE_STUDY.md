# MakeMyTrip AI Trip Assistant — Product Case Study

**By Dishant Kumar**  
**Project type:** AI product strategy / product case study  
**Product context:** MakeMyTrip travel discovery and trip-planning experience

> This is a portfolio concept and product proposal, not an official MakeMyTrip feature or a claim of employment/affiliation with MakeMyTrip. Proposed outcomes are hypotheses until validated with users and experiments.

## 1. The opportunity

Travel planning involves many connected decisions: destination, dates, budget, transport, stay, activities, and itinerary trade-offs. Users can be forced to switch between pages and compare options manually, making it harder to turn an initial travel idea into a confident, bookable plan.

**Opportunity statement:** Help travellers move from a broad trip intent to a relevant, editable itinerary with transparent options and clear paths to booking.

## 2. Target user and job to be done

**Primary user (working hypothesis):** A traveller who knows their destination or rough budget but wants help combining preferences into a practical plan.

**Job to be done:** “When I plan a trip, help me compare sensible options and build an itinerary that fits my dates, budget, and interests, so I can make decisions without repeatedly researching everything from scratch.”

This persona and job are hypotheses to validate through interviews and usability testing, not findings from a statistically representative study.

## 3. Core user problems

- **Fragmented planning:** Transport, accommodation, activities, and itinerary decisions can require repeated context switching.
- **Too many choices:** Search results may be difficult to compare against a traveller's personal constraints.
- **Low confidence:** Recommendations are less useful when their rationale, assumptions, or trade-offs are unclear.
- **Plans change:** Travellers need to edit preferences and regenerate only the affected parts of a plan.

## 4. Proposed experience

### AI trip-planning flow

1. **Capture intent** — destination, dates, travellers, budget, interests, pace, and constraints.
2. **Clarify gaps** — ask only high-impact follow-up questions when information is missing.
3. **Generate an itinerary** — propose a day-by-day plan with estimated time and budget ranges.
4. **Explain recommendations** — show why each suggestion fits, plus alternatives and assumptions.
5. **Edit and refine** — let users replace activities, change pace, adjust budget, or regenerate one day.
6. **Move to booking** — link users to relevant MakeMyTrip inventory where available; do not imply a booking has occurred until the user completes it.

## 5. Product principles and guardrails

- **User control:** Every itinerary item should be editable or dismissible.
- **Explainability:** Surface the reason for a recommendation and its key assumptions.
- **Freshness:** Clearly distinguish live availability/prices from estimates or cached information.
- **Grounding:** Do not invent hotels, attractions, prices, opening hours, or booking availability.
- **Safety and feasibility:** Flag travel-time conflicts, closed attractions, and unrealistic day plans.
- **Privacy:** Collect only the preferences needed for planning and explain how they are used.
- **Fallback:** When confidence is low, ask a question or present options rather than pretending certainty.

## 6. MVP scope

**In scope**
- Conversational trip-intent capture
- Day-by-day itinerary draft
- Budget and preference constraints
- Editable itinerary items
- Recommendation rationale and alternatives
- Clear estimated-vs-live price/availability labels
- Feedback capture on useful and irrelevant suggestions

**Out of scope for the first iteration**
- Automatically purchasing tickets or rooms
- Guaranteed real-time inventory without verified integrations
- Complex multi-city optimization across every transport mode
- Unsupported claims of personalized model performance

## 7. Prioritization

| Candidate | User value | Effort / dependency | MVP decision |
|---|---|---|---|
| Capture trip constraints | High | Low | P0 — build first |
| Generate editable itinerary | High | Medium | P0 — core experience |
| Explain recommendation rationale | High | Medium | P0 — trust requirement |
| Regenerate one day or item | High | Medium | P1 — improve control |
| Live price and availability integration | High | High / external dependency | P1 — only after API validation |
| Automatic booking | Medium initially | Very high / transactional risk | Defer |

## 8. Success metrics

**North-star candidate:** Percentage of trip-planning sessions that produce an itinerary the user saves or meaningfully edits.

**Quality and trust**
- Itinerary task-completion rate
- Recommendation acceptance and edit rate
- Unsupported-claim / hallucination rate from a reviewed test set
- Constraint-violation rate (budget, dates, travel time, preferences)
- User-reported confidence and satisfaction

**Efficiency**
- Time to first usable itinerary
- Number of turns needed to produce a usable plan
- Cost per successful planning session
- Latency per itinerary generation

**Business outcomes to validate**
- Click-through to relevant booking inventory
- Booking conversion and revenue per eligible session
- Cancellation or dissatisfaction guardrails

Metrics should be instrumented with explicit definitions, denominators, and data provenance. Targets should be set only after a baseline and pilot measurement plan exist.

## 9. Experiment plan

**Hypothesis:** A guided AI itinerary with editable recommendations helps users reach a usable plan faster than a conventional search-and-compare flow.

- **Control:** Existing trip-discovery flow or a clearly defined baseline prototype.
- **Treatment:** AI-assisted intent capture plus an editable itinerary and recommendation rationale.
- **Primary metric:** Successful itinerary completion, defined before launch.
- **Guardrails:** User trust, factual error rate, constraint violations, booking abandonment, and support complaints.
- **Method:** Moderated usability tests first, followed by a controlled experiment only when the product and instrumentation are ready.
- **Decision rule:** Scale only if the primary metric improves without unacceptable trust or quality regressions.

No experiment result is claimed here; this is a proposed validation plan.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Incorrect or stale travel details | Verified sources, freshness timestamps, and explicit uncertainty |
| Unrealistic itineraries | Travel-time checks, opening-hour checks, and feasibility constraints |
| Generic recommendations | Ask focused preference questions and provide alternatives |
| Over-trust in AI output | Explain rationale, expose assumptions, and preserve user control |
| API or inventory limitations | Separate planning from booking and clearly label unsupported actions |

## 11. Roadmap

- **Phase 1 — Discover:** Interview travellers, map planning journeys, and establish the baseline.
- **Phase 2 — Prototype:** Test intent capture, itinerary generation, editing, and explanation with realistic scenarios.
- **Phase 3 — Evaluate:** Build a curated evaluation set and score factuality, constraint satisfaction, and usability.
- **Phase 4 — Integrate:** Validate inventory/API dependencies and add live data only where reliable.
- **Phase 5 — Experiment:** Run a measured pilot with success metrics and guardrails.

## 12. What this case study demonstrates

- Problem framing and user-job definition
- AI product workflow and MVP scoping
- Value-versus-effort prioritization
- Trust, grounding, and AI quality guardrails
- Product metric design and experiment planning
- Clear separation between a proposed concept and validated outcomes

## 13. Limitations

This document describes a product concept. Persona details, expected benefits, and the experiment hypothesis require validation. It does not establish that the proposed AI assistant is deployed, integrated with MakeMyTrip systems, or proven to increase bookings or reduce planning time.

---

**Next step:** Pair this narrative with the existing MakeMyTrip teardown/prototype screenshots and the presentation artifact so reviewers can see the product experience as well as the reasoning.
