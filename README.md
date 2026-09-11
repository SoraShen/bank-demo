# Standard Bank AI Banking Assistant (Huawei Cloud demo)

Unauthorised demonstration. Not connected to Standard Bank core systems.

```bash
cd standard-bank-demo
cp .env.example .env.local   # optional LLM/ASR keys
npm install
npm run dev
```

Open http://localhost:3000

- Top bar: scenario autoplay / Replay / Reset
- Right: AI orchestration
- Bottom-right Need Help: chat
- Without API keys the five journeys still run on the local mock engine
