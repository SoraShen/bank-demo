import type { WorkflowNodeId, WorkflowState, NodeStatus } from "@/lib/chat/types";
import { orchFor } from "./orchestration";

export function emptyWorkflow(journey = "idle"): WorkflowState {
  const spec = orchFor(journey);
  return {
    journey,
    title: spec.title,
    pipeline: spec.pipeline,
    blurb: spec.blurb,
    capabilities: spec.capabilities,
    nodes: spec.steps.map((s) => ({
      id: s.id,
      title: s.title,
      detail: s.detail,
      icon: s.icon,
      status: "waiting" as NodeStatus,
    })),
  };
}

export function markWorkflow(
  state: WorkflowState,
  done: WorkflowNodeId[],
  active?: WorkflowNodeId,
  extract?: Record<string, string>,
): WorkflowState {
  return {
    ...state,
    extract: extract ?? state.extract,
    active,
    nodes: state.nodes.map((n) => ({
      ...n,
      status: done.includes(n.id) ? "done" : n.id === active ? "processing" : n.status === "done" ? "done" : "waiting",
    })),
  };
}

export function withInput(state: WorkflowState, voice: boolean): WorkflowState {
  if (!voice) return state;
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === "INTENT" ? { ...n, detail: "Speech to text, then intent" } : n,
    ),
  };
}
