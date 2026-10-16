# ReturnIQ — AI-Powered Returns Intelligence & Mitigation Engine

[![Live Demo](https://img.shields.io/badge/Live_Demo-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://returniq-527158472417.asia-southeast1.run.app)
[![Accuracy](https://img.shields.io/badge/Golden_Set_Accuracy-95.0%25-success?style=for-the-badge)](./datasets/ReturnIQ_Golden_Evaluation_Report.xlsx)
[![Regression Gate](https://img.shields.io/badge/Regression_Gate-35%2F35_Passing-brightgreen?style=for-the-badge)](./docs/TESTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

> ReturnIQ transforms unstructured customer return feedback into structured root-cause intelligence, connects defect patterns to financial loss, and tracks mitigation experiments to help protect e-commerce margins.

## Overview
ReturnIQ is an AI-powered returns intelligence portfolio project. It classifies customer return comments, surfaces recurring product and supplier issues, prioritizes potential interventions by estimated weekly financial impact, and supports human review of low-confidence predictions.

## Product capabilities
- **AI root-cause classification:** Organizes return feedback into Quality/Defect, Size/Fit, Customer Preference, Fulfillment/Shipping, and Technical/Compatibility categories.
- **Human-in-the-loop review:** Flags low-confidence predictions for review and manual correction.
- **Regression evaluation:** Includes a golden evaluation dataset and deterministic checks to assess model changes.
- **Action Center:** Connects recurring return drivers with prioritized mitigation ideas and estimated weekly savings.
- **Experiment tracking:** Records mitigation experiments and return-rate deltas.
- **Structured export:** Supports a schema-oriented returns data export.

## Screenshots
### Executive dashboard
![Executive dashboard](./assets/dashboard_overview.png)

### Returns analysis
![Returns analysis](./assets/returns_analysis.png)

### Action Center
![Action Center](./assets/action_center.png)

### Experiment Center
![Experiment Center](./assets/experiment_center.png)

### AI evaluation
![AI evaluation](./assets/ai_benchmark.png)

## Evaluation snapshot
The supplied project materials report:
- Golden-set accuracy: **95.0%** on 100 labeled examples
- Macro F1 score: **0.952**
- Regression suite: **35/35 passing**, with a reported release-gate score of **96.4%**
- Human correction baseline: **2.8%**
- An experiment with a reported **-10.7% return-rate delta**

These are project-reported evaluation figures; see the accompanying dataset and evaluation documents for methodology and context.

## Documentation
- [Product Requirements Document](./docs/PRD.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Technical case study](./docs/CASE_STUDY.md)
- [Testing and evaluation](./docs/TESTING.md)
- [Product roadmap](./docs/ROADMAP.md)
- [Architecture decisions](./docs/DECISIONS.md)
- [Technical evaluation evidence PDF](./assets/ReturnIQ_Technical_Evaluation_Evidence.pdf)

## Run locally
Prerequisites: Node.js 18+ and Python 3.10+ for the evaluation script.

```bash
npm install
cp .env.example .env
# Add your own Gemini API key to the local .env file if needed.
npm run dev
```

Run the benchmark script:

```bash
python scripts/evaluate_golden_set.py
```

Never commit a real API key. The `.env.example` file is a placeholder template.

## Live demo
https://returniq-527158472417.asia-southeast1.run.app

## Author
Dishant Kumar — AI Product Management & AI Engineering
