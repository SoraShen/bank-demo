"use client";

import {
  ArrowClockwise,
  ChatCircleDots,
  CheckCircle,
  CreditCard,
  IdentificationCard,
  ImageSquare,
  Microphone,
  Paperclip,
  PaperPlaneTilt,
  Phone,
  Question,
  Receipt,
  ShieldCheck,
  ShieldWarning,
  Warning,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { startMicRecording, type MicRecorderControls } from "@/lib/audio/mic";
import type { ChatMessage, Choice, Session } from "@/lib/chat/types";
import { useDemo } from "./ChatProvider";
import "./chat.css";

const CAPS: Record<string, { hint: string; Icon: typeof ShieldWarning }> = {
  scam: { hint: "Check a screenshot", Icon: ShieldWarning },
  lost: { hint: "Report and replace", Icon: CreditCard },
  charge: { hint: "Match a debit", Icon: Receipt },
  card: { hint: "PIN, travel, online", Icon: IdentificationCard },
  ask: { hint: "Products and help", Icon: ChatCircleDots },
};

function demoImage(name: string) {
  if (name.includes("transaction") || name.includes("statement")) return "/demo/transaction-statement.png";
  if (name.includes("email")) return "/demo/scam-email.png";
  if (name.includes("whatsapp")) return "/demo/scam-whatsapp.png";
  return "/demo/scam-sms.png";
}

const SAMPLE_ACTIONS: Record<string, { src: string; label: string }> = {
  "demo-upload:scam-sms": { src: "/demo/scam-sms.png", label: "Sample SMS" },
  "demo-upload:scam-email": { src: "/demo/scam-email.png", label: "Sample email" },
  "demo-upload:scam-whatsapp": { src: "/demo/scam-whatsapp.png", label: "Sample WhatsApp" },
  "demo-upload:transaction": { src: "/demo/transaction-statement.png", label: "Sample statement" },
};

function placeholderFor(awaiting: Session["awaiting"], recording: boolean) {
  if (recording) return "";
  if (awaiting === "upload-scam" || awaiting === "upload-txn") return "Describe it, or attach";
  if (awaiting === "lost-reason") return "Lost, stolen, or not sure?";
  if (awaiting === "stolen-tx") return "Any unrecognised transactions?";
  return "Type a message";
}

const FIELD_LABELS: Record<string, string> = {
  sender: "Sender",
  url: "Link",
  requested_action: "Request",
  merchant: "Merchant",
  amount: "Amount",
  date: "Date",
  reference: "Reference",
  type: "Type",
  phone: "Phone",
};

const SKIP_FIELDS = new Set(["message", "otp_request", "pin_request", "payment_request", "urgency", "impersonation"]);

export function ChatAssistant() {
  const {
    open,
    busy,
    draft,
    setDraft,
    messages,
    awaiting,
    openChat,
    closeChat,
    resetChat,
    sendText,
    runAction,
  } = useDemo();
  const recRef = useRef<MicRecorderControls | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open, voiceHint]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  async function toggleMic() {
    if (recording) {
      const rec = recRef.current;
      recRef.current = null;
      setRecording(false);
      if (!rec) return;
      setVoiceHint("Converting speech");
      try {
        const data = await rec.stop();
        const res = await fetch("/api/ai/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioDataUrl: data }),
        });
        const json = (await res.json()) as { text?: string; error?: string };
        if (json.text) {
          setVoiceHint("");
          await sendText(json.text, { voice: true });
        } else {
          setVoiceHint(json.error || "Could not transcribe. Type instead.");
        }
      } catch {
        setVoiceHint("Speech recognition failed. Type instead.");
      }
      return;
    }
    try {
      recRef.current = await startMicRecording();
      setRecording(true);
      setVoiceHint("Recording. Click the mic to send.");
    } catch {
      setVoiceHint("Microphone permission denied. You can type instead.");
    }
  }

  function pickFile() {
    fileRef.current?.click();
  }

  function onChoice(action: string) {
    if (action.startsWith("upload:")) {
      pickFile();
      return;
    }
    void runAction(action);
  }

  const composerHint = voiceHint;
  const lastUser = messages.reduce((acc, x, idx) => (x.role === "user" ? idx : acc), -1);
  const hideWelcome = lastUser >= 0 || messages.length > 1;

  return (
    <div className="sb-chat">
      {!open && (
        <button type="button" className="sb-chat__fab" onClick={openChat} aria-label="Need help?">
          <span className="sb-chat__fab-label">Need help?</span>
          <span className="sb-chat__fab-icon">
            <Question size={28} weight="bold" />
          </span>
        </button>
      )}
      {open && (
        <div className="sb-chat__panel" role="dialog" aria-modal="true" aria-label="Standard Bank AI Assistant" aria-busy={busy}>
          <header className="sb-chat__header">
            <div className="sb-chat__brand">
              <span className="sb-chat__avatar" aria-hidden="true">
                <ShieldCheck size={20} weight="fill" />
              </span>
              <div>
                <h2>Standard Bank AI Assistant</h2>
                <p className="sb-chat__live">
                  <span className="sb-chat__live-dot" aria-hidden="true" />
                  Demo assistant
                </p>
              </div>
            </div>
            <div className="sb-chat__header-actions">
              <button type="button" className="sb-chat__icon-round" onClick={resetChat} aria-label="Start over">
                <ArrowClockwise size={16} weight="bold" />
              </button>
              <button type="button" className="sb-chat__icon-round" onClick={closeChat} aria-label="Close">
                <X size={16} weight="bold" />
              </button>
            </div>
          </header>
          <div className="sb-chat__msgs" ref={msgsRef} aria-live="polite">
            {messages.map((m, i) => (
              <Turn
                key={m.id}
                msg={m}
                onAction={onChoice}
                isLatest={i > lastUser}
                hideWelcome={hideWelcome}
              />
            ))}
            {busy && (
              <div className="sb-chat__typing" aria-label="Assistant is responding">
                <span className="sb-chat__typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Working
              </div>
            )}
          </div>
          <div className="sb-chat__dock">
            {composerHint ? (
              <p className="sb-chat__hint" data-tone={voiceHint.includes("fail") || voiceHint.includes("denied") || voiceHint.includes("Could not") ? "error" : undefined}>
                {composerHint}
              </p>
            ) : null}
            <form
              className="sb-chat__composer"
              data-recording={recording ? "true" : "false"}
              onSubmit={(e) => {
                e.preventDefault();
                if (recording) return;
                void sendText(draft);
              }}
            >
              <input
                ref={fileRef}
                className="sb-chat__file"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void runAction(`demo-upload:${f.name}`);
                }}
              />
              <button type="button" className="sb-chat__iconbtn" onClick={pickFile} disabled={busy || recording} aria-label="Attach screenshot">
                <Paperclip size={18} />
              </button>
              {recording ? (
                <span className="sb-chat__rec-label">Recording</span>
              ) : (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={placeholderFor(awaiting, recording)}
                  disabled={busy}
                  aria-label="Message"
                />
              )}
              <button
                type="button"
                className="sb-chat__iconbtn"
                data-on={recording ? "true" : "false"}
                onClick={() => void toggleMic()}
                disabled={busy}
                aria-label={recording ? "Stop recording and send" : "Voice input"}
              >
                <Microphone size={18} weight={recording ? "fill" : "regular"} />
              </button>
              <button type="submit" className="sb-chat__send" disabled={busy || recording || !draft.trim()} aria-label="Send">
                <PaperPlaneTilt size={18} weight="fill" />
              </button>
            </form>
            <p className="sb-chat__disclaimer">Unauthorised demo. Created by Huawei Cloud for demonstration only.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Turn({
  msg,
  onAction,
  isLatest,
  hideWelcome,
}: {
  msg: ChatMessage;
  onAction: (a: string) => void;
  isLatest: boolean;
  hideWelcome: boolean;
}) {
  if (msg.role === "status") return null;

  if (msg.card?.kind === "capabilities") {
    if (hideWelcome) return null;
    return (
      <div className="sb-chat__turn">
        <p className="sb-chat__hello">{msg.text}</p>
        <div className="sb-chat__caps">
          {msg.choices?.map((c) => {
            const meta = CAPS[c.id];
            const Icon = meta?.Icon ?? ChatCircleDots;
            return (
              <button key={c.id} type="button" className="sb-chat__cap" data-id={c.id} onClick={() => onAction(c.action)}>
                <span className="sb-chat__cap-ico">
                  <Icon size={18} weight="bold" />
                </span>
                <span>
                  <strong>{c.label}</strong>
                  {meta ? <small>{meta.hint}</small> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const hideBubble = Boolean(msg.card?.title && msg.text.trim() === msg.card.title.trim());
  const choicesOnCard = Boolean(msg.card && msg.choices?.length);

  return (
    <div className={`sb-chat__turn${msg.role === "user" ? " sb-chat__turn--user" : ""}`}>
      {!hideBubble && msg.text ? <div className={`sb-chat__bubble sb-chat__bubble--${msg.role}`}>{msg.text}</div> : null}
      {msg.card ? <MessageCard msg={msg} onAction={onAction} locked={!isLatest} /> : null}
      {!choicesOnCard && msg.choices?.length ? <ChoiceRow choices={msg.choices} onAction={onAction} locked={!isLatest} /> : null}
    </div>
  );
}

function MessageCard({ msg, onAction, locked }: { msg: ChatMessage; onAction: (a: string) => void; locked: boolean }) {
  const card = msg.card;
  if (!card) return null;
  const fields = (card.fields ?? []).filter((f) => f.value && !SKIP_FIELDS.has(f.label));
  const showBody = Boolean(card.body && card.kind !== "handoff" && card.kind !== "risk");
  const sampleChoices = (msg.choices ?? []).filter((c) => SAMPLE_ACTIONS[c.action]);
  const otherChoices = (msg.choices ?? []).filter((c) => !SAMPLE_ACTIONS[c.action]);
  const preview = card.image || (card.kind === "transaction" ? demoImage("transaction") : null);

  return (
    <div className="sb-chat__card">
      {card.title && card.kind !== "upload" ? (
        <div className="sb-chat__card-head">
          <h3>{card.title}</h3>
        </div>
      ) : null}
      {card.risk ? (
        <div className="sb-chat__risk">
          <Warning size={16} weight="fill" />
          Risk: {card.risk}
        </div>
      ) : null}
      {card.kind === "upload" ? (
        <div className="sb-chat__drop">
          <ImageSquare size={28} weight="regular" />
          <p>{card.title === "Upload statement" ? "Add a statement screenshot" : "Add the message screenshot"}</p>
        </div>
      ) : null}
      {card.kind === "upload" && sampleChoices.length ? (
        <div className="sb-chat__samples">
          {sampleChoices.map((c) => {
            const sample = SAMPLE_ACTIONS[c.action];
            return (
              <button
                key={c.id}
                type="button"
                className="sb-chat__sample"
                disabled={locked}
                onClick={() => onAction(c.action)}
              >
                <img src={sample.src} alt="" />
                <span>{sample.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {preview && card.kind !== "upload" ? <img className="sb-chat__card-img" src={preview} alt="" /> : null}
      {showBody ? <p className="sb-chat__card-body">{card.body}</p> : null}
      {fields.map((f) => (
        <div key={f.label} className="sb-chat__row">
          <span>{FIELD_LABELS[f.label] ?? f.label.replace(/_/g, " ")}</span>
          <strong>{f.value}</strong>
        </div>
      ))}
      {card.flags?.length ? (
        <div className="sb-chat__flags">
          {card.flags.map((f) => (
            <div key={f} className="sb-chat__flag">
              <CheckCircle size={16} weight="fill" />
              {f}
            </div>
          ))}
        </div>
      ) : null}
      {otherChoices.length ? <ChoiceRow choices={otherChoices} onAction={onAction} locked={locked} /> : null}
    </div>
  );
}

function ChoiceRow({ choices, onAction, locked }: { choices: Choice[]; onAction: (a: string) => void; locked: boolean }) {
  const hasPrimary = choices.some((c) => c.mock || c.action.startsWith("app:"));
  return (
    <div className="sb-chat__actions" data-locked={locked ? "true" : "false"}>
      {choices.map((c, i) => {
        const primary = c.mock || c.action.startsWith("app:") || (!hasPrimary && i === 0);
        const tel = Boolean(c.href?.startsWith("tel:"));
        const className = `sb-chat__choice${primary ? " sb-chat__choice--primary" : ""}${tel ? " sb-chat__choice--tel" : ""}`;
        if (c.href) {
          return (
            <a
              key={c.id}
              className={className}
              href={locked ? undefined : c.href}
              target={tel ? undefined : "_blank"}
              rel="noreferrer"
              aria-disabled={locked}
              onClick={(e) => {
                if (locked) e.preventDefault();
              }}
            >
              {tel ? <Phone size={14} weight="bold" /> : null}
              {c.label}
            </a>
          );
        }
        return (
          <button key={c.id} type="button" className={className} onClick={() => onAction(c.action)} disabled={locked}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
