export type Extracted = Record<string, string>;

export interface VisionProvider {
  extract(imageHint: string, kind: "scam" | "transaction"): Promise<Extracted>;
}

const SMS: Extracted = {
  sender: "Standard Bank",
  message:
    "URGENT SECURITY ALERT. Your Standard Bank account has been temporarily restricted. Verify your details now at https://standardbank-secure.co.za/verify. You will need to confirm your OTP. Failure to verify within 2 hours may result in account suspension. Share your OTP. From Standard Bank Security Team.",
  url: "https://standardbank-secure.co.za/verify",
  phone: "",
  requested_action: "Verify details and confirm OTP",
  otp_request: "yes",
  pin_request: "no",
  payment_request: "no",
  urgency: "High",
  impersonation: "Appears to impersonate Standard Bank",
};

const EMAIL: Extracted = {
  sender: "security@standardbank-alert.co.za",
  message:
    "From Standard Bank Security. URGENT: Your account requires verification. We detected unusual activity. Please verify your account within 24 hours. Click the link. VERIFY MY ACCOUNT. Failure may result in temporary account restrictions.",
  url: "https://standardbank-alert.co.za/verify",
  phone: "",
  requested_action: "Click VERIFY MY ACCOUNT",
  otp_request: "no",
  pin_request: "no",
  payment_request: "no",
  urgency: "High",
  impersonation: "Lookalike sender domain",
};

const WHATSAPP: Extracted = {
  sender: "STANDARD BANK SUPPORT",
  message:
    "From Standard Bank. We've detected unusual activity on your account. Click here: standardbank-help-secure.com. Please reply with your OTP to complete verification. Share your OTP.",
  url: "standardbank-help-secure.com",
  phone: "",
  requested_action: "Click link and reply with OTP",
  otp_request: "yes",
  pin_request: "no",
  payment_request: "no",
  urgency: "High",
  impersonation: "Appears to impersonate Standard Bank Support",
};

const TXN: Extracted = {
  date: "05 Sep 2026",
  merchant: "ABC Insurance",
  amount: "R286.00",
  reference: "ABC INS PREM",
  type: "Debit Order",
};

export function mockExtract(imageHint: string, kind: "scam" | "transaction"): Extracted {
  const h = imageHint.toLowerCase();
  if (kind === "transaction" || h.includes("transaction") || h.includes("statement")) return { ...TXN };
  if (h.includes("email")) return { ...EMAIL };
  if (h.includes("whatsapp")) return { ...WHATSAPP };
  return { ...SMS };
}

export const visionProvider: VisionProvider = {
  async extract(imageHint, kind) {
    return mockExtract(imageHint, kind);
  },
};
