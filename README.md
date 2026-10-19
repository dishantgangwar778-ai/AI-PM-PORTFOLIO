# AI Product Management Portfolio

Selected AI product, analytics, and product strategy projects by Dishant Kumar.

## Featured project: ReturnIQ

**ReturnIQ** is an AI-powered e-commerce returns intelligence and mitigation platform. It turns customer return comments into structured root-cause categories, routes low-confidence predictions for human review, prioritizes SKU-level opportunities, and documents mitigation experiment calculations.

- **[Open the ReturnIQ project](./projects/returniq/README.md)**
- **[Live demo](https://returniq-527158472417.asia-southeast1.run.app)**
- **[Technical evaluation dossier](./projects/returniq/assets/ReturnIQ_Technical_Evaluation_Evidence.pdf)**
- **[Product case study](./projects/returniq/docs/CASE_STUDY.md)**
- **[ReturnIQ CI workflow](./.github/workflows/returniq-checks.yml)**

> **Repository & deployment transparency:** The live demo is hosted on Google Cloud Run. This repository currently includes ReturnIQ documentation, evaluation datasets, test scripts, deployment-related configuration, and the project dossier. The complete React source directory (`src/`) and npm lockfile are not currently present here, so the CI workflow runs the Python artifact checks and explicitly skips the frontend build until those inputs are committed. A skipped frontend build is not a successful application build.

### Evaluation notes

The project dossier reports 95.0% accuracy and 0.952 Macro F1 on a 100-record golden set, alongside 35/35 artifact regression checks and a 96.4% composite quality-gate score. The committed scripts evaluate saved predictions, dataset/documentation invariants, and experiment arithmetic; they do not independently prove live model inference or causal business impact.

The EXP-1041 cohort counts are documented as a **synthetic simulation**. The reported -10.7% relative delta is a calculation from those counts, not verified live-customer impact. See the [experiment notes](./projects/returniq/docs/EXPERIMENT_EXP_1041.md).

## Explore

Browse the `projects/` directory for additional product case studies and artifacts.
