import Button from "@/components/ui/Button";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-10 text-center">
      <h3 className="text-xl font-semibold text-(--ink-1)">{title}</h3>
      <p className="mt-3 text-sm text-(--muted)">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-6">
          <a href={actionHref}>
            <Button size="sm">{actionLabel}</Button>
          </a>
        </div>
      )}
    </div>
  );
}
