"use client";

import {
  ArrowRight,
  Brain,
  ChatCircle,
  CheckCircle,
  DeviceMobile,
  GearSix,
  ImageSquare,
  Question,
  Receipt,
  Stack,
  TreeStructure,
} from "@phosphor-icons/react";
import type { NodeStatus } from "@/lib/chat/types";
import type { OrchIcon } from "@/lib/journey/orchestration";
import { useDemo } from "@/components/chatbot/ChatProvider";
import "./workflow.css";

const ICONS: Record<OrchIcon, typeof Brain> = {
  understand: Brain,
  evidence: ImageSquare,
  signals: TreeStructure,
  knowledge: Stack,
  assess: GearSix,
  explain: ChatCircle,
  recommend: ArrowRight,
  clarify: Question,
  match: Receipt,
  connect: DeviceMobile,
};

function StatusMark({ status }: { status: NodeStatus }) {
  if (status === "done") {
    return (
      <span className="sb-flow__state sb-flow__state--done">
        Completed
        <CheckCircle size={16} weight="fill" />
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="sb-flow__state sb-flow__state--busy">
        Processing...
        <i className="sb-flow__spin" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="sb-flow__state sb-flow__state--wait">
      Waiting
      <span className="sb-flow__wait-dot" aria-hidden="true" />
    </span>
  );
}

export function WorkflowPanel() {
  const { workflow } = useDemo();
  return (
    <aside className="sb-flow">
      <header className="sb-flow__head">
        <p className="sb-flow__kicker">AI ORCHESTRATION</p>
        <h2>{workflow.title}</h2>
        <p className="sb-flow__pipe">{workflow.pipeline}</p>
        <p className="sb-flow__note">{workflow.blurb}</p>
      </header>
      <ol className="sb-flow__list">
        {workflow.nodes.map((n, i) => {
          const Icon = ICONS[(n.icon as OrchIcon) || "understand"] ?? Brain;
          return (
            <li key={n.id} data-status={n.status} data-active={workflow.active === n.id}>
              <div className="sb-flow__icon" aria-hidden="true">
                <Icon size={18} weight="bold" />
              </div>
              <div className="sb-flow__body">
                <strong>
                  {i + 1}. {n.title}
                </strong>
                <span>{n.detail}</span>
              </div>
              <StatusMark status={n.status} />
            </li>
          );
        })}
      </ol>
      <footer className="sb-flow__caps">
        <p>AI Capabilities</p>
        <div>
          {workflow.capabilities.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </footer>
    </aside>
  );
}
