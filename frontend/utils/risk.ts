export function getRiskTone(risk?: string) {
  switch ((risk || "").toUpperCase()) {
    case "LOW":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-900",
        border: "border-emerald-200",
      };
    case "MEDIUM":
      return {
        bg: "bg-amber-100",
        text: "text-amber-900",
        border: "border-amber-200",
      };
    case "HIGH":
      return {
        bg: "bg-rose-100",
        text: "text-rose-900",
        border: "border-rose-200",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
      };
  }
}
