# Architecture

Next.js 15 App Router. Clone of Standard Bank Personal at `/`. Demo chrome wraps the clone.

## Layers

- **UI:** `DemoBar`, `PersonalPage`, `WorkflowPanel`, `ChatAssistant`, `BankingAppHandoff`
- **JourneyEngine:** `src/lib/journey/engine.ts` — deterministic journeys + regex intent
- **RAG:** keyword `KnowledgeProvider` over `data/standard-bank/knowledge/articles.json`
- **Vision:** mock extract by filename; optional multimodal LLM via `/api/ai/vision`
- **ASR/LLM:** OpenAI-compatible server proxies; keys never in the browser

## Real vs mock

| Real public | Mock | Future |
|---|---|---|
| Official URLs, phone numbers, documented App steps | Customer, transactions, scam samples, risk, App UI | Authenticated APIs, real deep links |

## Env

`AI_LLM_*` and `AI_ASR_*` — see `.env.example`.
