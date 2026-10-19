# AI Product Management Portfolio

Selected AI product, analytics, and product strategy projects by Dishant Kumar.

## Featured project: ReturnIQ

**ReturnIQ** is an AI-powered e-commerce returns intelligence and mitigation platform concept. The repository now includes a React + TypeScript portfolio dashboard preview alongside product documentation, evaluation datasets, scripts, and the project dossier.

- **[Open the ReturnIQ project](./projects/returniq/README.md)**
- **[Live demo](https://returniq-527158472417.asia-southeast1.run.app)**
- **[Technical evaluation dossier](./projects/returniq/assets/ReturnIQ_Technical_Evaluation_Evidence.pdf)**
- **[Product case study](./projects/returniq/docs/CASE_STUDY.md)**
- **[ReturnIQ CI workflow](./.github/workflows/returniq-checks.yml)**
- **[Frontend source](./projects/returniq/src/App.tsx)**

> **Repository & deployment transparency:** The existing live demo is hosted on Google Cloud Run. The React dashboard source now committed in this repository is a portfolio preview populated with illustrative sample records; it is not represented as the source code of the currently deployed Cloud Run app and is not connected to production data. The GitHub Actions workflow runs deterministic Python artifact checks and, when frontend source/configuration is present, installs dependencies and runs the TypeScript/Vite production build. The repository does not yet commit an npm lockfile, so dependency installation currently uses `npm install` rather than a lockfile-enforced `npm ci`.

### Evaluation notes

The project dossier reports 95.0% accuracy and 0.952 Macro F1 on a 100-record golden set, alongside 35/35 artifact regression checks and a 96.4% composite quality-gate score. The committed scripts evaluate saved predictions, dataset/documentation invariants, and experiment arithmetic; they do not independently prove live model inference or causal business impact.

The EXP-1041 cohort counts are documented as a **synthetic simulation**. The reported -10.7% relative delta is a calculation from those counts, not verified live-customer impact. See the [experiment notes](./projects/returniq/docs/EXPERIMENT_EXP_1041.md).

## Explore

Browse the `projects/` directory for additional product case studies and artifacts.
