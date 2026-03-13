export type AgentPayload = Record<string, any>;

export type AgentCardProps = {
  data: AgentPayload;
  agentKey?: string;
};

export function pct(value: number | undefined, digits = 2) {
  if (typeof value !== "number") return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

export function asText(value: unknown) {
  if (value === null || value === undefined) return "-";
  return String(value);
}
