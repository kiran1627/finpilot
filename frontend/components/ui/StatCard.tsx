import { ReactNode } from "react";
import Card from "./Card";

export default function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-(--muted)">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
        {value}
      </div>
      {helper && <p className="text-sm text-(--muted)">{helper}</p>}
    </Card>
  );
}
