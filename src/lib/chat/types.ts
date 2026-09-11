export type Intent =
  | "SCAM_DETECTION"
  | "LOST_CARD"
  | "STOLEN_CARD"
  | "CARD_ONLINE_PURCHASE"
  | "CARD_PIN"
  | "CARD_OVERSEAS"
  | "CARD_SECURITY"
  | "CARD_GENERAL"
  | "UNKNOWN_TRANSACTION"
  | "DEBIT_ORDER_REVERSE"
  | "DEBIT_ORDER_STOP"
  | "GENERAL_FAQ"
  | "SECURITY_FAQ"
  | "BANKING_APP_HELP"
  | "FRAUD_REPORT"
  | "CONTACT_SUPPORT"
  | "BRANCH_SUPPORT"
  | "NONE";

export type NodeStatus = "waiting" | "processing" | "done";

export type WorkflowNodeId =
  | "INPUT"
  | "ASR"
  | "VISION"
  | "OCR"
  | "ENTITY_EXTRACTION"
  | "INTENT"
  | "KNOWLEDGE_RETRIEVAL"
  | "SCAM_SIGNAL_MATCHING"
  | "TRANSACTION_MATCHING"
  | "REASONING"
  | "EXPLAIN"
  | "RECOMMENDATION"
  | "JOURNEY"
  | "SECURITY_GUIDANCE"
  | "BANKING_APP"
  | "FRAUD_LINE"
  | "WEBSITE"
  | "CONTACT_CENTRE"
  | "BRANCH";

export type Choice = {
  id: string;
  label: string;
  action: string;
  href?: string;
  mock?: boolean;
};

export type ChatCard = {
  kind: "capabilities" | "upload" | "analysis" | "risk" | "transaction" | "handoff";
  title?: string;
  body?: string;
  image?: string;
  fields?: { label: string; value: string }[];
  flags?: string[];
  risk?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot" | "status";
  text: string;
  card?: ChatCard;
  choices?: Choice[];
};

export type AppHandoff = "lost_card" | "debit_order" | "card_settings" | null;

export type Session = {
  journey: string | null;
  intent: Intent;
  awaiting: "upload-scam" | "upload-txn" | "lost-reason" | "stolen-tx" | null;
  lastImage?: string;
  extracted?: Record<string, string>;
  inputMode: "text" | "voice";
};

export type WorkflowNode = {
  id: WorkflowNodeId;
  title: string;
  detail: string;
  status: NodeStatus;
  icon?: string;
};

export type WorkflowState = {
  journey: string;
  title: string;
  pipeline: string;
  blurb: string;
  capabilities: string[];
  nodes: WorkflowNode[];
  active?: WorkflowNodeId;
  extract?: Record<string, string>;
};
