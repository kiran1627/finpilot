import { HTMLAttributes } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass";
};

export default function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        variant === "glass" ? "glass-panel" : "surface-card",
        "rounded-2xl p-4 sm:p-6",
        className
      )}
      {...props}
    />
  );
}
