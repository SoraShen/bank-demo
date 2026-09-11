import type { Intent } from "@/lib/chat/types";

const RULES: [RegExp, Intent][] = [
  [/scam|fake|phish|spoof|otp|this (sms|message|email|whatsapp)/i, "SCAM_DETECTION"],
  [/stolen/i, "STOLEN_CARD"],
  [/lost (my )?(debit |credit )?card|card.*(lost|missing)/i, "LOST_CARD"],
  [/charge|don't recognise|do not recognise|what('s| is) this|r\s?286|debit order/i, "UNKNOWN_TRANSACTION"],
  [/reverse/i, "DEBIT_ORDER_REVERSE"],
  [/stop (future )?debit/i, "DEBIT_ORDER_STOP"],
  [/online|doesn't work online|does not work online/i, "CARD_ONLINE_PURCHASE"],
  [/pin/i, "CARD_PIN"],
  [/overseas|abroad|travel/i, "CARD_OVERSEAS"],
  [/switch.*(off|on)|card off|freeze/i, "CARD_SECURITY"],
  [/card/i, "CARD_GENERAL"],
  [/trust call/i, "SECURITY_FAQ"],
  [/fraud/i, "FRAUD_REPORT"],
  [/branch/i, "BRANCH_SUPPORT"],
  [/app|banking app/i, "BANKING_APP_HELP"],
  [/account|product|verify/i, "GENERAL_FAQ"],
];

export function classifyIntent(text: string): Intent {
  for (const [re, intent] of RULES) if (re.test(text)) return intent;
  return "GENERAL_FAQ";
}

export function journeyFor(intent: Intent): string {
  if (intent === "SCAM_DETECTION" || intent === "FRAUD_REPORT") return "scam_detection";
  if (intent === "LOST_CARD" || intent === "STOLEN_CARD") return "lost_card";
  if (intent === "UNKNOWN_TRANSACTION" || intent === "DEBIT_ORDER_REVERSE" || intent === "DEBIT_ORDER_STOP")
    return "transaction_analysis";
  if (intent.startsWith("CARD_")) return "card_management";
  return "general_faq";
}
