# VentureIQ

VentureIQ is an AI-powered business intelligence platform for founders and operators.  
It turns uploaded business data into grounded insights across P&L analysis, benchmarking, risk forecasting, regret analysis, and document Q&A.

## What It Does

- **P&L Engine**: validates uploaded financial CSV data, computes deterministic metrics, and adds AI narrative recommendations.
- **Benchmark Engine**: compares business performance against peer ranges, gated by validated P&L signals.
- **FutureProof Engine**: generates top risks and a 5-year threat timeline using company profile + financial signals.
- **Regret Engine**: estimates opportunity cost of past decisions with INR-focused outputs.
- **Document Analyzer**: parses PDF/CSV/TXT and answers questions over extracted text.
- **PDF Export**: generates a consolidated multi-page report from completed engine runs.

## Architecture Overview

- **Frontend**: Next.js App Router + React + TypeScript + Tailwind CSS + Recharts.
- **State**: React context providers for company profile and engine report data.
- **APIs**: server route handlers in `src/app/api/**`.
- **Validation Layer**: financial and input validators in `src/lib/validators.ts` and `src/lib/financial-parser.ts`.
- **AI Layer**: server-side model wrappers in `src/lib/ai-clients.ts`.
- **Export Layer**: client-side PDF generation in `src/components/shared/PdfExport.tsx`.

## Tech Stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Recharts
- Groq API
- Gemini API
- `pdfjs-dist` + `jspdf`

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env.local` and fill in real keys:

```bash
cp .env.example .env.local
```

Required variables:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality & Build Checks

Run these before push/deploy:

```bash
npm run lint
npm run type-check
npm run build
```

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import the project into Vercel.
3. Set environment variables:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
4. Use default build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: Next.js default
5. Deploy.

## Security Notes

- AI API keys are accessed only on the server via route handlers.
- `.env*` files are ignored by `.gitignore`.
- Document parsing is done client-side first; extracted text is sent to server APIs only when analysis is requested.
- Session storage is used for temporary company profile persistence in browser.

## Usage Flow

1. Complete onboarding.
2. Run P&L analysis with real CSV financial input.
3. Run Benchmark and FutureProof (gated on validated P&L data).
4. Run Regret Engine decisions analysis.
5. Optionally use Document Analyzer for uploaded documents.
6. Export final report PDF.

## Known Limitations

- AI responses depend on external model availability and quotas.
- Benchmark/FutureProof narratives are AI-generated but constrained by validated signals.
- Large document analysis can increase response time.
- No persisted multi-user backend/auth in this hackathon version.

## Future Improvements

- Add persisted projects and user accounts.
- Add server-side rate limiting and abuse controls.
- Add test suite (unit + integration + e2e).
- Improve document chunking/retrieval strategy for very large files.

## Project Structure

- `src/app` - routes, pages, API handlers
- `src/components` - engine UIs and shared UI components
- `src/contexts` - client state providers
- `src/lib` - validators, parsers, constants, AI wrappers

## Team

- Frontend: **Kamran**
- Logic and Backend: **Adeel**
- Logic and Backend: **Aatif**
