"use client";

import { DEMO_SCENARIOS } from "@/lib/journey/scripts";
import { useDemo } from "@/components/chatbot/ChatProvider";

export function DemoBar() {
  const { playScenario, playing, resetChat, stopDemo } = useDemo();
  return (
    <div className="sb-demobar">
      {DEMO_SCENARIOS.map((s) => (
        <button key={s.id} type="button" disabled={playing} onClick={() => void playScenario(s.id)}>
          {s.title}
        </button>
      ))}
      <button
        type="button"
        className="sb-demobar__reset"
        onClick={() => {
          stopDemo();
          resetChat();
        }}
      >
        Reset
      </button>
    </div>
  );
}
