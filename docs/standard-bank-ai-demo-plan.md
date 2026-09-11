# Standard Bank AI Banking Assistant — Implementation Plan

Unauthorised Huawei Cloud demonstration. Not a Standard Bank production integration.

## Architecture

```
DemoBar
Cloned Personal site (scroll) | WorkflowPanel (AI orchestration)
Need Help FAB → Chat overlay
```

Customer chat is the experience. Right panel is backend orchestration (no raw APIs).

Server routes keep keys off the browser:

- `POST /api/ai/chat` — intent + reply (LLM, mock fallback)
- `POST /api/ai/transcribe` — ASR
- `POST /api/ai/vision` — multimodal OCR, filename-keyed mock fallback

Providers: `AIProvider`, `ASRProvider`, `VisionProvider`, `KnowledgeProvider`, `JourneyEngine`, `ChannelConnector`.

## Sitemap

| Route | Source |
|---|---|
| `/` | Clone of https://www.standardbank.co.za/southafrica/personal |
| Official SB URLs | Open in new tab (Security Centre, Help Centre, card guides) |

Keys: `standardbank-co-za-6ab60ee3` / `southafrica-personal-6f2fd995`.

## Five journeys

1. **Scam** — upload → OCR → signals vs Security Centre KB → HIGH risk → Fraud Line / Security Centre (no case filed)
2. **Lost card** — Lost/Stolen → official App path Accounts → Cards → Card Settings → Report lost or stolen (no block/replace claim)
3. **Charge** — statement OCR → ABC Insurance R286 debit order → App handoff (no reverse success)
4. **Card assistant** — online / PIN / overseas / on-off from public Card Settings
5. **Ask Standard Bank** — keyword RAG + official link

## Mock DB

`data/standard-bank/{knowledge,scam_intelligence,journeys,channels,demo_data}`

Real: public SB pages, phone numbers, documented App steps.  
Mock: customer, transactions, scam examples, risk score, App screens.  
Future: authenticated core APIs.

## Env

```
AI_LLM_BASE_URL= AI_LLM_API_KEY= AI_LLM_MODEL=
AI_ASR_BASE_URL= AI_ASR_API_KEY= AI_ASR_MODEL=
```

Missing keys → deterministic demo still runs.

## Phases

1. Scaffold + clone homepage  
2. Demo bar + workflow panel + Need Help chat  
3. Data + RAG + journeys + API fallbacks  
4. Autoplay + mock App + docs + QA
