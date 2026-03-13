import { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
};

export default function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        {
          "border-slate-200 bg-slate-100 text-slate-700": tone === "neutral",
          "border-emerald-200 bg-emerald-100 text-emerald-900": tone === "success",
          "border-amber-200 bg-amber-100 text-amber-900": tone === "warning",
          "border-rose-200 bg-rose-100 text-rose-900": tone === "danger",
        },
        className
      )}
      {...props}
    />
  );
}
