import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)",
        {
          "bg-(--brand-1) text-white hover:opacity-90":
            variant === "primary",
          "bg-(--surface-2) text-(--ink-1) hover:bg-(--surface-3)":
            variant === "secondary",
          "bg-transparent text-(--ink-1) hover:bg-black/5":
            variant === "ghost",
          "bg-rose-600 text-white hover:bg-rose-700": variant === "danger",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-5 py-3 text-sm": size === "md",
          "px-7 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
