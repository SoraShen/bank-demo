export const DEMO_SCENARIOS = [
  { id: "scam", title: "Scam Detection" },
  { id: "lost", title: "Lost Card" },
  { id: "charge", title: "Transaction Analysis" },
  { id: "card", title: "Card Assistant" },
  { id: "ask", title: "Ask Standard Bank" },
] as const;

export type DemoStep = { user?: string; action?: string; delay?: number };

export const DEMO_SCRIPTS: Record<string, DemoStep[]> = {
  scam: [
    { user: "I received this SMS from Standard Bank. Is it real?" },
    { action: "demo-upload:scam-sms", delay: 400 },
  ],
  lost: [
    { user: "I lost my card." },
    { action: "lost:lost", delay: 800 },
  ],
  charge: [
    { user: "I don't recognise this charge." },
    { action: "demo-upload:transaction", delay: 900 },
  ],
  card: [{ user: "My card doesn't work online." }],
  ask: [{ user: "How do I use Trust Call?" }],
};

export const ALL_ORDER = ["scam", "lost", "charge", "card", "ask"];
