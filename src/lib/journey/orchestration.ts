import type { NodeStatus, WorkflowNodeId } from "@/lib/chat/types";

export type OrchIcon =
  | "understand"
  | "evidence"
  | "signals"
  | "knowledge"
  | "assess"
  | "explain"
  | "recommend"
  | "clarify"
  | "match"
  | "connect";

export type OrchStep = {
  id: WorkflowNodeId;
  title: string;
  detail: string;
  icon: OrchIcon;
};

export type OrchSpec = {
  title: string;
  pipeline: string;
  blurb: string;
  capabilities: string[];
  steps: OrchStep[];
};

export const ORCH: Record<string, OrchSpec> = {
  idle: {
    title: "AI Orchestration",
    pipeline: "Understand → Analyse → Explain → Recommend",
    blurb: "Start a request on the left to see how the assistant analyses it and routes you to an official Standard Bank channel.",
    capabilities: ["Vision / OCR", "RAG", "LLM", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "OCR", title: "Read the evidence", detail: "Vision / OCR", icon: "evidence" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Official Standard Bank guidance", icon: "knowledge" },
      { id: "REASONING", title: "Assess risk", detail: "LLM reasoning", icon: "assess" },
      { id: "EXPLAIN", title: "Explain", detail: "Generate explanation", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "Channel orchestration", icon: "recommend" },
    ],
  },
  scam_detection: {
    title: "Scam Detection",
    pipeline: "Detect → Analyse → Explain → Recommend",
    blurb: "AI is analysing the message to identify potential scams and provide guidance.",
    capabilities: ["Vision / OCR", "RAG", "LLM", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "OCR", title: "Read the evidence", detail: "Vision / OCR", icon: "evidence" },
      { id: "ENTITY_EXTRACTION", title: "Extract signals", detail: "Entity extraction", icon: "signals" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Standard Bank Security Centre", icon: "knowledge" },
      { id: "REASONING", title: "Assess risk", detail: "LLM reasoning", icon: "assess" },
      { id: "EXPLAIN", title: "Explain", detail: "Generate explanation", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "Channel orchestration", icon: "recommend" },
    ],
  },
  lost_card: {
    title: "Lost Card",
    pipeline: "Understand → Clarify → Explain → Connect",
    blurb: "AI is classifying the request, then guiding you to report the card in the Banking App.",
    capabilities: ["LLM", "RAG", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "JOURNEY", title: "Clarify the case", detail: "Lost or stolen", icon: "clarify" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Official card guidance", icon: "knowledge" },
      { id: "REASONING", title: "Plan the path", detail: "Journey orchestration", icon: "assess" },
      { id: "EXPLAIN", title: "Explain", detail: "How to report the card", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "App or phone", icon: "recommend" },
      { id: "BANKING_APP", title: "Connect", detail: "Authenticated Banking App", icon: "connect" },
    ],
  },
  transaction_analysis: {
    title: "Transaction Analysis",
    pipeline: "Detect → Analyse → Explain → Recommend",
    blurb: "AI is reading the statement, matching the debit, and explaining what you can do next.",
    capabilities: ["Vision / OCR", "RAG", "LLM", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "OCR", title: "Read the evidence", detail: "Vision / OCR", icon: "evidence" },
      { id: "ENTITY_EXTRACTION", title: "Extract signals", detail: "Merchant, amount, date", icon: "signals" },
      { id: "TRANSACTION_MATCHING", title: "Match the transaction", detail: "Synthetic statement match", icon: "match" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Debit-order guidance", icon: "knowledge" },
      { id: "EXPLAIN", title: "Explain", detail: "What this debit is", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "Banking App review", icon: "recommend" },
    ],
  },
  card_management: {
    title: "Card Assistant",
    pipeline: "Understand → Retrieve → Explain → Connect",
    blurb: "AI is matching your card question to official Card Settings guidance.",
    capabilities: ["LLM", "RAG", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Card Settings guidance", icon: "knowledge" },
      { id: "REASONING", title: "Assess the need", detail: "PIN, travel, online, on/off", icon: "assess" },
      { id: "EXPLAIN", title: "Explain", detail: "What you can do in the App", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "Open Card Settings", icon: "recommend" },
      { id: "BANKING_APP", title: "Connect", detail: "Authenticated Banking App", icon: "connect" },
    ],
  },
  general_faq: {
    title: "Ask Standard Bank",
    pipeline: "Understand → Retrieve → Explain → Recommend",
    blurb: "AI is retrieving public Standard Bank guidance and pointing you to the official page.",
    capabilities: ["RAG", "LLM", "ASR"],
    steps: [
      { id: "INTENT", title: "Understand", detail: "Intent recognition", icon: "understand" },
      { id: "KNOWLEDGE_RETRIEVAL", title: "Retrieve knowledge", detail: "Public help content", icon: "knowledge" },
      { id: "REASONING", title: "Reason", detail: "LLM answer grounded in RAG", icon: "assess" },
      { id: "EXPLAIN", title: "Explain", detail: "Generate explanation", icon: "explain" },
      { id: "RECOMMENDATION", title: "Recommend action", detail: "Official website", icon: "recommend" },
    ],
  },
};

export function orchFor(journey: string | null | undefined): OrchSpec {
  if (journey && ORCH[journey]) return ORCH[journey];
  return ORCH.idle;
}

export function statusLabel(status: NodeStatus): string {
  if (status === "done") return "Completed";
  if (status === "processing") return "Processing";
  return "Waiting";
}
