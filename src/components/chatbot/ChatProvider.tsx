"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { AppHandoff, ChatMessage, Session, WorkflowState } from "@/lib/chat/types";
import {
  emptySession,
  handleAction,
  handleText,
  handleUpload,
  isStructuredTurn,
  welcomeMessages,
  type EngineOut,
} from "@/lib/journey/engine";
import { classifyIntent, journeyFor } from "@/lib/journey/intents";
import { emptyWorkflow, markWorkflow, withInput } from "@/lib/journey/workflow";
import { ALL_ORDER, DEMO_SCRIPTS } from "@/lib/journey/scripts";

type Api = {
  open: boolean;
  busy: boolean;
  playing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  messages: ChatMessage[];
  awaiting: Session["awaiting"];
  workflow: WorkflowState;
  handoff: AppHandoff;
  setHandoff: (v: AppHandoff) => void;
  openChat: () => void;
  closeChat: () => void;
  resetChat: () => void;
  sendText: (text: string, opts?: { voice?: boolean }) => Promise<void>;
  runAction: (action: string) => Promise<void>;
  playScenario: (id: string) => Promise<void>;
  stopDemo: () => void;
};

const Ctx = createContext<Api | null>(null);
export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo needs ChatProvider");
  return v;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(welcomeMessages);
  const [session, setSession] = useState<Session>(emptySession);
  const [workflow, setWorkflow] = useState<WorkflowState>(() => emptyWorkflow("idle"));
  const [handoff, setHandoff] = useState<AppHandoff>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const stopRef = useRef(false);
  const playLock = useRef(false);
  const runId = useRef(0);

  const resetChat = useCallback(() => {
    runId.current += 1;
    sessionRef.current = emptySession();
    setSession(emptySession());
    setMessages(welcomeMessages());
    setWorkflow(emptyWorkflow("idle"));
    setHandoff(null);
    setDraft("");
  }, []);

  const apply = useCallback(async (out: EngineOut) => {
    const token = (runId.current += 1);
    sessionRef.current = out.session;
    setSession(out.session);
    if (out.handoff) setHandoff(out.handoff);
    if (!out.stages?.length) {
      setWorkflow(out.workflow);
      if (out.messages.length) setMessages((m) => [...m, ...out.messages]);
      return;
    }
    const base = emptyWorkflow(out.session.journey ?? "idle");
    for (const stage of out.stages) {
      if (runId.current !== token) return;
      setWorkflow(markWorkflow(base, stage.done, stage.active, out.workflow.extract));
      const extra = stage.messages ?? [];
      if (extra.length) setMessages((m) => [...m, ...extra]);
      if (stage.delay) await new Promise((r) => setTimeout(r, stage.delay));
    }
    if (runId.current !== token) return;
    setWorkflow(out.workflow);
    if (out.messages.length) setMessages((m) => [...m, ...out.messages]);
  }, []);

  const sendText = useCallback(
    async (text: string, opts?: { voice?: boolean }) => {
      const t = text.trim();
      if (!t) return;
      setDraft("");
      setMessages((m) => [...m, { id: `u_${Date.now()}`, role: "user", text: t }]);
      setBusy(true);
      const current = { ...sessionRef.current, inputMode: opts?.voice ? "voice" : "text" } as Session;
      try {
        if (isStructuredTurn(t, current)) {
          await apply(handleText(t, current));
          return;
        }
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t }),
        });
        const data = (await res.json()) as {
          reply?: string;
          intent?: string;
          fallback?: boolean;
        };
        if (!res.ok || data.fallback || !data.reply) {
          await apply(handleText(t, current));
          return;
        }
        if (data.intent && isStructuredTurn(t, { ...current, awaiting: null })) {
          await apply(handleText(t, current));
          return;
        }
        const journey = journeyFor(classifyIntent(t));
        const wf0 = withInput(emptyWorkflow(journey), current.inputMode === "voice");
        setWorkflow(
          markWorkflow(wf0, ["INTENT", "KNOWLEDGE_RETRIEVAL", "REASONING", "EXPLAIN", "RECOMMENDATION"]),
        );
        setMessages((m) => [...m, { id: `b_${Date.now()}`, role: "bot", text: data.reply! }]);
      } finally {
        setBusy(false);
      }
    },
    [apply],
  );

  const runAction = useCallback(
    async (action: string) => {
      if (action.startsWith("upload:")) return;
      const echoes: Record<string, string> = {
        "cap:scam": "I received this SMS from Standard Bank. Is it real?",
        "cap:lost": "I lost my card",
        "cap:charge": "What's this charge?",
        "cap:card": "Help with my card",
        "cap:ask": "Ask Standard Bank",
        "lost:lost": "Lost",
        "lost:stolen": "Stolen",
        "lost:unsure": "I'm not sure",
        "stolen:yes": "Yes",
        "stolen:no": "No",
        "demo-upload:scam-sms": "Use sample SMS",
        "demo-upload:scam-email": "Use sample email",
        "demo-upload:scam-whatsapp": "Use sample WhatsApp",
        "demo-upload:transaction": "Use sample statement",
        "scam:clicked": "I already clicked",
      };
      if (echoes[action]) {
        setMessages((m) => [...m, { id: `u_${Date.now()}`, role: "user", text: echoes[action] }]);
      }
      setBusy(true);
      try {
        if (action.startsWith("demo-upload:")) {
          await apply(handleUpload(action.slice(12), sessionRef.current));
          return;
        }
        await apply(handleAction(action, sessionRef.current));
      } finally {
        setBusy(false);
      }
    },
    [apply],
  );

  const stopDemo = useCallback(() => {
    stopRef.current = true;
    runId.current += 1;
    setPlaying(false);
    playLock.current = false;
  }, []);

  const playScenario = useCallback(
    async (id: string) => {
      if (playLock.current) return;
      playLock.current = true;
      stopRef.current = false;
      setPlaying(true);
      setOpen(true);
      const ids = id === "all" ? ALL_ORDER : [id];
      try {
        for (const sid of ids) {
          if (stopRef.current) break;
          resetChat();
          await new Promise((r) => setTimeout(r, 80));
          const steps = DEMO_SCRIPTS[sid] ?? [];
          for (const step of steps) {
            if (stopRef.current) break;
            if (step.user) await sendText(step.user);
            if (step.action) await runAction(step.action);
            await new Promise((r) => setTimeout(r, step.delay ?? 400));
          }
          if (id === "all" && sid !== ids[ids.length - 1]) {
            await new Promise((r) => setTimeout(r, 900));
          }
        }
      } finally {
        setPlaying(false);
        playLock.current = false;
      }
    },
    [resetChat, runAction, sendText],
  );

  const value = useMemo<Api>(
    () => ({
      open,
      busy,
      playing,
      draft,
      setDraft,
      messages,
      awaiting: session.awaiting,
      workflow,
      handoff,
      setHandoff,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
      resetChat,
      sendText,
      runAction,
      playScenario,
      stopDemo,
    }),
    [open, busy, playing, draft, messages, session.awaiting, workflow, handoff, resetChat, sendText, runAction, playScenario, stopDemo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
