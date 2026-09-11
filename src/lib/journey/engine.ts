import type { ChatMessage, Intent, Session, WorkflowNodeId, WorkflowState } from "@/lib/chat/types";
import { classifyIntent, journeyFor } from "@/lib/journey/intents";
import { emptyWorkflow, markWorkflow, withInput } from "@/lib/journey/workflow";
import { knowledgeProvider, matchSignals, matchTransaction } from "@/lib/rag/retrieve";
import { mockExtract } from "@/lib/vision/extract";
import { db } from "@/lib/mock-db";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export const emptySession = (): Session => ({
  journey: null,
  intent: "NONE",
  awaiting: null,
  inputMode: "text",
});

export function welcomeMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I'm your Standard Bank AI Assistant. Check a suspicious message, report a lost card, explain a charge, or find an official channel.",
      card: { kind: "capabilities", title: "How can I help?" },
      choices: [
        { id: "scam", label: "Is this a scam?", action: "cap:scam" },
        { id: "lost", label: "I lost my card", action: "cap:lost" },
        { id: "charge", label: "What's this charge?", action: "cap:charge" },
        { id: "card", label: "Help with my card", action: "cap:card" },
        { id: "ask", label: "Ask Standard Bank", action: "cap:ask" },
      ],
    },
  ];
}

const OFFICIAL = {
  security: "https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre",
  scams: "https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre/bank-safely/scams",
  manageCard: "https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre/manage-your-card",
  card: "https://www.standardbank.co.za/southafrica/personal/products-and-services/bank-with-us/credit-cards/managing-your-card",
  help: "https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre",
  trust: "https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre/bank-safely/trust-call",
};

export type EngineStage = {
  delay: number;
  done: WorkflowNodeId[];
  active?: WorkflowNodeId;
  messages?: ChatMessage[];
};

export type EngineOut = {
  session: Session;
  messages: ChatMessage[];
  workflow: WorkflowState;
  stages?: EngineStage[];
  handoff?: "lost_card" | "debit_order" | "card_settings" | null;
};

function bot(text: string, extra?: Partial<ChatMessage>): ChatMessage {
  return { id: uid("b"), role: "bot", text, ...extra };
}

export function demoSrc(hint = ""): string {
  const h = hint.toLowerCase();
  if (h.includes("email")) return "/demo/scam-email.png";
  if (h.includes("whatsapp")) return "/demo/scam-whatsapp.png";
  if (h.includes("transaction") || h.includes("statement")) return "/demo/transaction-statement.png";
  return "/demo/scam-sms.png";
}

export function startCapability(id: string, session: Session): EngineOut {
  const map: Record<string, string> = {
    scam: "I received this SMS from Standard Bank. Is it real?",
    lost: "I lost my card.",
    charge: "I don't recognise this charge.",
    card: "I need help with my card.",
    ask: "What accounts does Standard Bank offer?",
  };
  return handleText(map[id] ?? "Help", { ...session, awaiting: null });
}

export function isStructuredTurn(text: string, session: Session) {
  if (session.awaiting) return true;
  const intent = classifyIntent(text);
  return ![
    "GENERAL_FAQ",
    "SECURITY_FAQ",
    "BANKING_APP_HELP",
    "CONTACT_SUPPORT",
    "BRANCH_SUPPORT",
    "NONE",
  ].includes(intent);
}

export function handleText(text: string, session: Session): EngineOut {
  if (session.awaiting === "lost-reason") return lostReason(text, session);
  if (session.awaiting === "stolen-tx") return stolenTx(text, session);
  if (session.awaiting === "upload-scam" && /skip|no image|continue/i.test(text))
    return finishScam(session, mockExtract("scam-sms", "scam"));
  if (session.awaiting === "upload-txn" && /skip|no image|continue/i.test(text))
    return finishTxn(session, mockExtract("transaction", "transaction"));

  const intent = classifyIntent(text);
  const journey = journeyFor(intent);
  const next: Session = { ...session, intent, journey, awaiting: null };
  let wf = withInput(emptyWorkflow(journey), session.inputMode === "voice");
  wf = markWorkflow(wf, [], "INTENT");

  if (intent === "SCAM_DETECTION" || intent === "FRAUD_REPORT") return startScam(next, wf);
  if (intent === "LOST_CARD" || intent === "STOLEN_CARD") return startLost(next, wf, intent);
  if (intent === "UNKNOWN_TRANSACTION" || intent === "DEBIT_ORDER_REVERSE" || intent === "DEBIT_ORDER_STOP")
    return startTxn(next, wf);
  if (intent.startsWith("CARD_")) return cardHelp(next, wf, intent);
  return faq(text, next);
}

export function handleUpload(image: string, session: Session): EngineOut {
  if (session.journey === "transaction_analysis" || session.awaiting === "upload-txn") {
    return finishTxn({ ...session, lastImage: image }, mockExtract(image, "transaction"));
  }
  return finishScam({ ...session, lastImage: image, journey: session.journey ?? "scam_detection" }, mockExtract(image, "scam"));
}

function startScam(session: Session, wf: WorkflowState): EngineOut {
  return {
    session: { ...session, awaiting: "upload-scam", journey: "scam_detection" },
    workflow: markWorkflow(wf, ["INTENT"], "OCR"),
    messages: [
      bot("I can help you check it. Upload a screenshot and I'll look for common scam indicators.", {
        card: {
          kind: "upload",
          title: "Upload screenshot",
          image: "/demo/scam-sms.png",
        },
        choices: [
          { id: "sms", label: "Sample SMS", action: "demo-upload:scam-sms" },
          { id: "email", label: "Sample email", action: "demo-upload:scam-email" },
          { id: "wa", label: "Sample WhatsApp", action: "demo-upload:scam-whatsapp" },
          { id: "up", label: "Upload", action: "upload:scam" },
        ],
      }),
    ],
  };
}

function finishScam(session: Session, extracted: Record<string, string>): EngineOut {
  const blob = Object.values(extracted).join(" ");
  const hits = matchSignals(blob);
  const image = demoSrc(session.lastImage);
  const flags = [
    (hits.find((h) => h.id === "SIGNAL-LINK") || extracted.url) && "Suspicious link",
    (hits.find((h) => h.id === "SIGNAL-OTP") || /otp/i.test(blob)) && "OTP request",
    (hits.find((h) => h.id === "SIGNAL-URGENCY") || /urgent|restrict|suspen/i.test(blob)) && "Language creating urgency",
    (hits.find((h) => h.id === "SIGNAL-IMPERSONATION") || /standard bank/i.test(blob)) && "Impersonates Standard Bank",
  ].filter(Boolean) as string[];
  const base = emptyWorkflow("scam_detection");
  const final = markWorkflow(
    base,
    ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
    undefined,
    extracted,
  );
  const next: Session = { ...session, awaiting: null, extracted, journey: "scam_detection", intent: "SCAM_DETECTION" };
  return {
    session: next,
    workflow: final,
    messages: [],
    stages: [
      { delay: 420, done: ["INTENT"], active: "OCR" },
      {
        delay: 640,
        done: ["INTENT", "OCR"],
        active: "ENTITY_EXTRACTION",
        messages: [
          bot("I found a suspicious link, an OTP request and language creating urgency."),
        ],
      },
      {
        delay: 720,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION"],
        active: "KNOWLEDGE_RETRIEVAL",
        messages: [
          bot("I'm comparing these signals with Standard Bank's published security guidance."),
        ],
      },
      { delay: 560, done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL"], active: "REASONING" },
      {
        delay: 640,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL", "REASONING"],
        active: "EXPLAIN",
        messages: [
          bot("Potential scam detected", {
            card: {
              kind: "risk",
              title: "Potential scam detected",
              risk: "HIGH",
              image,
              fields: [
                { label: "sender", value: extracted.sender || "Standard Bank" },
                { label: "url", value: extracted.url || "https://standardbank-secure.co.za/verify" },
                { label: "requested_action", value: extracted.requested_action || "Confirm OTP" },
              ],
              flags: flags.length ? flags : ["Compare this against official Security Centre guidance"],
            },
          }),
        ],
      },
      {
        delay: 500,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN"],
        active: "RECOMMENDATION",
        messages: [
          bot("The message asks for an OTP, directs you to an external link and threatens account suspension."),
        ],
      },
      {
        delay: 280,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
        messages: [
          bot("Don't click or reply. Don't share your OTP, PIN or password.", {
            choices: [
              { id: "rf", label: "Report fraud", action: "link:fraud", href: OFFICIAL.security },
              { id: "sc", label: "Security Centre", action: "link:sec", href: OFFICIAL.scams },
              { id: "call", label: "Call 0800 222 050", action: "tel:fraud", href: "tel:0800222050" },
              { id: "clicked", label: "I already clicked", action: "scam:clicked" },
            ],
          }),
        ],
      },
    ],
  };
}

function startLost(session: Session, wf: WorkflowState, intent: Intent): EngineOut {
  return {
    session: { ...session, awaiting: "lost-reason", journey: "lost_card", intent },
    workflow: markWorkflow(wf, ["INTENT"], "JOURNEY"),
    messages: [
      bot("I'm sorry to hear that. I can help you secure your card and guide you through the replacement process.\n\nWas your card lost or stolen?", {
        choices: [
          { id: "lost", label: "Lost", action: "lost:lost" },
          { id: "stolen", label: "Stolen", action: "lost:stolen" },
          { id: "unsure", label: "I'm not sure", action: "lost:unsure" },
        ],
      }),
    ],
  };
}

function lostReason(text: string, session: Session): EngineOut {
  const stolen = /stolen/i.test(text);
  const unsure = /not sure|unsure/i.test(text);
  if (stolen) {
    return {
      session: { ...session, awaiting: "stolen-tx", intent: "STOLEN_CARD" },
      workflow: markWorkflow(emptyWorkflow("lost_card"), ["INTENT", "JOURNEY"], "KNOWLEDGE_RETRIEVAL"),
      messages: [
        bot("Have you noticed any transactions you don't recognise?", {
          choices: [
            { id: "yes", label: "Yes", action: "stolen:yes" },
            { id: "no", label: "No", action: "stolen:no" },
          ],
        }),
      ],
    };
  }
  if (unsure) {
    return {
      session: { ...session, awaiting: "lost-reason" },
      workflow: markWorkflow(emptyWorkflow("lost_card"), ["INTENT"], "JOURNEY"),
      messages: [
        bot("If you think someone else may have it, treat it as stolen. Otherwise we can treat it as lost. Which fits better?", {
          choices: [
            { id: "lost", label: "Treat as lost", action: "lost:lost" },
            { id: "stolen", label: "Treat as stolen", action: "lost:stolen" },
          ],
        }),
      ],
    };
  }
  return lostHandoff(session);
}

function stolenTx(text: string, session: Session): EngineOut {
  if (/^yes$/i.test(text.trim()) || /unrecognised|don't recognise/i.test(text)) {
    return startScam(
      { ...session, journey: "scam_detection", intent: "FRAUD_REPORT", awaiting: null },
      emptyWorkflow("scam_detection"),
    );
  }
  return lostHandoff(session);
}

function lostHandoff(session: Session): EngineOut {
  const art = db.articles.find((a) => a.id === "CARD-002");
  const base = emptyWorkflow("lost_card");
  return {
    session: { ...session, awaiting: null },
    workflow: markWorkflow(
      base,
      ["INTENT", "JOURNEY", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
      "BANKING_APP",
    ),
    stages: [
      { delay: 360, done: ["INTENT", "JOURNEY"], active: "KNOWLEDGE_RETRIEVAL" },
      { delay: 420, done: ["INTENT", "JOURNEY", "KNOWLEDGE_RETRIEVAL"], active: "REASONING" },
      { delay: 420, done: ["INTENT", "JOURNEY", "KNOWLEDGE_RETRIEVAL", "REASONING"], active: "EXPLAIN" },
      {
        delay: 280,
        done: ["INTENT", "JOURNEY", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
        active: "BANKING_APP",
        messages: [
          bot(
            "You can report a lost or stolen card and request a replacement through the Standard Bank Banking App.\n\nAccounts → Cards → Card Settings → Report lost or stolen card → select reason → follow the prompts.\n\nLost or stolen cards: 0800 020 600 (international +27 10 824 1514).\n\nThis assistant does not block your card or order a replacement.",
            {
              card: { kind: "handoff", title: "Continue securely in the Standard Bank Banking App", body: art?.content },
              choices: [
                { id: "app", label: "Continue in App", action: "app:lost_card", mock: true },
                { id: "guide", label: "Open guide", action: "link:card", href: OFFICIAL.manageCard },
                { id: "tel", label: "Call 0800 020 600", action: "tel:card", href: "tel:0800020600" },
              ],
            },
          ),
        ],
      },
    ],
    messages: [],
  };
}

function startTxn(session: Session, wf: WorkflowState): EngineOut {
  return {
    session: { ...session, awaiting: "upload-txn", journey: "transaction_analysis" },
    workflow: markWorkflow(wf, ["INTENT"], "OCR"),
    messages: [
      bot("I can help you understand it. Upload a screenshot or statement showing the transaction.", {
        card: { kind: "upload", title: "Upload statement", image: "/demo/transaction-statement.png" },
        choices: [
          { id: "demo", label: "Sample statement", action: "demo-upload:transaction" },
          { id: "up", label: "Upload", action: "upload:txn" },
        ],
      }),
    ],
  };
}

function finishTxn(session: Session, extracted: Record<string, string>): EngineOut {
  const txn = matchTransaction(Object.values(extracted).join(" "));
  const base = emptyWorkflow("transaction_analysis");
  const image = demoSrc(session.lastImage || "transaction");
  const final = markWorkflow(
    base,
    ["INTENT", "OCR", "ENTITY_EXTRACTION", "TRANSACTION_MATCHING", "KNOWLEDGE_RETRIEVAL", "EXPLAIN", "RECOMMENDATION"],
    undefined,
    extracted,
  );
  return {
    session: { ...session, awaiting: null, extracted },
    workflow: final,
    messages: [],
    stages: [
      { delay: 400, done: ["INTENT"], active: "OCR" },
      { delay: 520, done: ["INTENT", "OCR"], active: "ENTITY_EXTRACTION" },
      { delay: 520, done: ["INTENT", "OCR", "ENTITY_EXTRACTION"], active: "TRANSACTION_MATCHING" },
      {
        delay: 480,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "TRANSACTION_MATCHING"],
        active: "KNOWLEDGE_RETRIEVAL",
        messages: [
          bot(`This appears to be a debit order from ${txn?.merchant ?? "ABC Insurance"} for ${extracted.amount || "R286.00"}.`, {
            card: {
              kind: "transaction",
              title: txn?.merchant ?? "ABC Insurance",
              image,
              fields: [
                { label: "Amount", value: extracted.amount || "R286.00" },
                { label: "Date", value: extracted.date || "05 Sep 2026" },
                { label: "Type", value: extracted.type || "Debit Order" },
                { label: "Reference", value: extracted.reference || "ABC INS PREM" },
              ],
            },
          }),
        ],
      },
      { delay: 400, done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "TRANSACTION_MATCHING", "KNOWLEDGE_RETRIEVAL"], active: "EXPLAIN" },
      {
        delay: 240,
        done: ["INTENT", "OCR", "ENTITY_EXTRACTION", "TRANSACTION_MATCHING", "KNOWLEDGE_RETRIEVAL", "EXPLAIN", "RECOMMENDATION"],
        messages: [
          bot(
            "If you don't recognise this debit order, Standard Bank provides options through the Banking App to review and manage eligible debit orders.\n\nEligibility is checked in the Standard Bank Banking App. This demo does not reverse or stop anything.",
            {
              choices: [
                { id: "rev", label: "Reverse debit order", action: "app:debit_order", mock: true },
                { id: "stop", label: "Stop future orders", action: "app:debit_order", mock: true },
                { id: "app", label: "Continue in App", action: "app:debit_order", mock: true },
              ],
            },
          ),
        ],
      },
    ],
  };
}

function cardHelp(session: Session, wf: WorkflowState, intent: Intent): EngineOut {
  const q =
    intent === "CARD_PIN"
      ? "PIN view"
      : intent === "CARD_OVERSEAS"
        ? "card abroad"
        : intent === "CARD_ONLINE_PURCHASE"
          ? "online purchases"
          : "card settings";
  const art = knowledgeProvider.search(q, "cards")[0];
  const text =
    intent === "CARD_PIN"
      ? "You can view your PIN in the authenticated Banking App (Manage → Cards → Card settings → View PIN). I cannot retrieve your actual PIN."
      : intent === "CARD_OVERSEAS"
        ? "Activate overseas use in the Banking App: select the card → Use Your Card Abroad → enter travel dates."
        : intent === "CARD_ONLINE_PURCHASE" || intent === "CARD_SECURITY"
          ? "You can manage online purchases and switch the card on or off from Card Settings in the Standard Bank Banking App."
          : "Card Settings in the Banking App covers on/off, ATM, card machines, online purchases, Tap & Go, wearables & wallets, and overseas use.";
  const base = emptyWorkflow("card_management");
  return {
    session: { ...session, awaiting: null },
    workflow: markWorkflow(base, ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"], "BANKING_APP", {
      Intent: intent,
    }),
    messages: [],
    stages: [
      { delay: 320, done: ["INTENT"], active: "KNOWLEDGE_RETRIEVAL" },
      { delay: 400, done: ["INTENT", "KNOWLEDGE_RETRIEVAL"], active: "REASONING" },
      { delay: 360, done: ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING"], active: "EXPLAIN" },
      {
        delay: 220,
        done: ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
        active: "BANKING_APP",
        messages: [
          bot(`${text}${art ? `\n\nSource: ${art.title}` : ""}`, {
            choices: [
              { id: "app", label: "Open Card Settings", action: "app:card_settings", mock: true },
              { id: "g", label: "Open guide", action: "link:card", href: OFFICIAL.card },
            ],
          }),
        ],
      },
    ],
  };
}

function faq(text: string, session: Session): EngineOut {
  const arts = knowledgeProvider.search(text);
  const art = arts[0];
  const reply = art
    ? `${art.content.slice(0, 420)}\n\nNext step: use the official Standard Bank page or Banking App. This assistant does not change your accounts.`
    : "I can help with scams, lost cards, unrecognised charges, card settings, Trust Call, and public product questions. For anything not on the public site: demo assumption, to be confirmed with Standard Bank during PoC.";
  const base = emptyWorkflow("general_faq");
  return {
    session: { ...session, awaiting: null },
    workflow: markWorkflow(base, ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"], undefined),
    messages: [],
    stages: [
      { delay: 280, done: ["INTENT"], active: "KNOWLEDGE_RETRIEVAL" },
      { delay: 360, done: ["INTENT", "KNOWLEDGE_RETRIEVAL"], active: "REASONING" },
      {
        delay: 240,
        done: ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
        messages: [
          bot(reply, {
            choices: art
              ? [{ id: "g", label: "Open Standard Bank Guide", action: "link", href: art.source_url }]
              : [{ id: "h", label: "Open Help Centre", action: "link", href: OFFICIAL.help }],
          }),
        ],
      },
    ],
  };
}

export function handleAction(action: string, session: Session): EngineOut {
  if (action.startsWith("cap:")) return startCapability(action.slice(4), session);
  if (action.startsWith("lost:")) return lostReason(action.slice(5), session);
  if (action.startsWith("stolen:")) return stolenTx(action.slice(7) === "yes" ? "yes" : "no", session);
  if (action.startsWith("demo-upload:")) return handleUpload(action.slice(12), session);
  if (action === "scam:clicked") {
    return {
      session,
      workflow: markWorkflow(
        emptyWorkflow("scam_detection"),
        ["INTENT", "OCR", "ENTITY_EXTRACTION", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"],
      ),
      messages: [
        bot(
          "If you've already clicked the link or shared sensitive information, contact Standard Bank immediately.\n\nCall the Fraud Line on 0800 222 050. Do not enter any further details on that site.",
          {
            choices: [
              { id: "call", label: "Call 0800 222 050", action: "tel:fraud", href: "tel:0800222050" },
              { id: "rf", label: "Report fraud", action: "link:fraud", href: OFFICIAL.security },
            ],
          },
        ),
      ],
    };
  }
  if (action.startsWith("app:")) {
    const kind = action.slice(4) as "lost_card" | "debit_order" | "card_settings";
    const journey = session.journey ?? "lost_card";
    return {
      session,
      workflow: markWorkflow(emptyWorkflow(journey), ["INTENT", "JOURNEY", "EXPLAIN", "RECOMMENDATION"], "BANKING_APP"),
      handoff: kind,
      messages: [
        bot(
          "Continue securely in the Standard Bank Banking App. Card reporting, debit-order changes and card settings are completed in your authenticated banking environment.\n\nDemo: Standard Bank Banking App handoff, not a live integration.",
        ),
      ],
    };
  }
  return { session, workflow: emptyWorkflow(session.journey ?? "idle"), messages: [] };
}
