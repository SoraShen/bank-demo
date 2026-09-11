"use client";

import { useDemo } from "@/components/chatbot/ChatProvider";

const PATHS = {
  lost_card: {
    title: "Report lost or stolen card",
    crumbs: ["Accounts", "Cards", "Card Settings", "Report lost or stolen card"],
    body: "Select a reason and follow the prompts in your authenticated Banking App. This screen is a demo handoff only.",
  },
  debit_order: {
    title: "Debit orders",
    crumbs: ["Accounts", "Debit Orders", "ABC Insurance R286.00"],
    body: "Eligibility is checked in the Standard Bank Banking App. This demo does not reverse or stop a debit order.",
  },
  card_settings: {
    title: "Card Settings",
    crumbs: ["Cards", "Card Settings", "Online purchases"],
    body: "Toggle online purchases, ATM, Tap & Go and overseas use here in a real session.",
  },
};

export function BankingAppHandoff() {
  const { handoff, setHandoff } = useDemo();
  if (!handoff) return null;
  const view = PATHS[handoff];
  return (
    <div className="sb-appmask">
      <div className="sb-app">
        <p className="sb-app__badge">Demo: Standard Bank Banking App handoff</p>
        <p className="sb-app__crumbs">{view.crumbs.join(" → ")}</p>
        <h3>{view.title}</h3>
        <p>{view.body}</p>
        <button type="button" onClick={() => setHandoff(null)}>
          Close demo screen
        </button>
      </div>
    </div>
  );
}
