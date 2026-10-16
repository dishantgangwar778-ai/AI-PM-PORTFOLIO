# ReturnIQ Architecture

## System overview
The supplied project describes a browser-based React/TypeScript application deployed as a container on Google Cloud Run, with an Nginx front end and calls to the Gemini API for structured classification.

## Main components
1. **Client application:** Dashboard, returns analysis, review queue, action center, and experiment views.
2. **Ingestion and validation:** Reads returns data and checks input consistency.
3. **AI classification:** Sends return comments for structured root-cause classification.
4. **Human review:** Supports review of low-confidence classifications.
5. **Action prioritization:** Groups return drivers and estimates potential weekly impact.
6. **Experiment tracking:** Records interventions and outcome deltas.
7. **Evaluation:** Runs the golden-set benchmark and regression checks.

## Technology stack
- React, TypeScript, Vite, Tailwind CSS
- Gemini API
- Python, pandas, scikit-learn for evaluation utilities
- Docker, Nginx, Google Cloud Run
- GitHub Actions workflow supplied with the project

## Security note
Keep real credentials in local environment variables or a deployment secret manager. Never commit a populated `.env` file or expose a real API key in client-side code.
