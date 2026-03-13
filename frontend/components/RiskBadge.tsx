import clsx from "clsx";
import { getRiskTone } from "@/utils/risk";

export default function RiskBadge({ risk }: { risk?: string }) {
  const tone = getRiskTone(risk);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        tone.bg,
        tone.text,
        tone.border
      )}
    >
      {risk || "Unknown"}
    </span>
  );
}
