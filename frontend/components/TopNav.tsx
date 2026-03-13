"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlayCircle,
  TrendingUp,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "operations" },
  { label: "Runs", href: "/runs", icon: PlayCircle, group: "operations" },
  { label: "Investments", href: "/investments", icon: TrendingUp, group: "operations" },
  { label: "Ledger", href: "/logs", icon: FileText, group: "system" },
  { label: "Settings", href: "/settings", icon: Settings, group: "system" },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
  };

  const selectedNavItem =
    navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ?? "";

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const operationItems = navItems.filter((item) => item.group === "operations");
  const systemItems = navItems.filter((item) => item.group === "system");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[color-mix(in_srgb,var(--background)_90%,transparent)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-(--brand-1) text-white grid place-items-center font-semibold">
              FP
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-(--muted) sm:text-sm sm:tracking-[0.35em]">
                FinPilot
              </p>
              <p className="text-xs text-(--muted)">Autonomy Control</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-(--ink-2) lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "text-black"
                    : "hover:text-black"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            {user && (
              <div className="hidden text-right text-xs text-(--muted) sm:block">
                <div className="font-semibold text-(--ink-2)">{user.email}</div>
                <div>{user.user_type}</div>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-(--surface-2) text-(--ink-2) lg:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="absolute right-0 top-0 h-dvh w-[84vw] max-w-sm border-l border-black/10 bg-(--surface-1) p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-(--ink-2)">Navigation</div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close drawer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-(--surface-2) text-(--ink-2)"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="space-y-2">
              {operationItems.map((item) => {
                const isActive = item.href === selectedNavItem;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      isActive
                        ? "bg-(--brand-1) text-white"
                        : "bg-(--surface-2) text-(--ink-2) hover:bg-(--surface-3)"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="my-3 border-t border-black/10" />

            <nav className="space-y-2">
              {systemItems.map((item) => {
                const isActive = item.href === selectedNavItem;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      isActive
                        ? "bg-(--brand-1) text-white"
                        : "bg-(--surface-2) text-(--ink-2) hover:bg-(--surface-3)"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-lg bg-(--surface-2) px-3 py-2 text-left text-sm font-medium text-(--ink-2)"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
