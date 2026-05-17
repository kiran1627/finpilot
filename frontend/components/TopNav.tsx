"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useTheme();
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
      <header className="top-nav sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="nav-logo">FP</div>
            <div>
              <p className="nav-brand-kicker">FinPilot</p>
              <p className="nav-brand-sub">Autonomy Control</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 lg:flex">
            {user && (
              <div className="hidden text-right text-xs text-(--muted) sm:block">
                <div className="font-semibold text-(--ink-2) text-[13px]">{user.email}</div>
                <div className="text-[11px] uppercase tracking-wider">{user.user_type}</div>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              className="theme-toggle-btn"
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              <span className="theme-icon-wrap">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </span>
            </button>

            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Theme Toggle Mobile */}
            <button
              id="theme-toggle-btn-mobile"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              className="theme-toggle-btn"
            >
              <span className="theme-icon-wrap">
                {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open navigation menu"
              id="mobile-menu-btn"
              className="mobile-menu-btn"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="nav-drawer absolute right-0 top-0 h-dvh w-[84vw] max-w-sm p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="nav-logo h-8 w-8 rounded-xl text-sm">FP</div>
                <span className="text-sm font-semibold text-(--ink-1)">FinPilot</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close drawer"
                className="drawer-close-btn"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-(--muted) px-1">
              Operations
            </p>
            <nav className="space-y-1 mb-4">
              {operationItems.map((item) => {
                const isActive = item.href === selectedNavItem;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`drawer-nav-link ${isActive ? "drawer-nav-link-active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-(--muted) px-1">
              System
            </p>
            <nav className="space-y-1">
              {systemItems.map((item) => {
                const isActive = item.href === selectedNavItem;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`drawer-nav-link ${isActive ? "drawer-nav-link-active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-(--surface-3) pt-4 space-y-2">
              {user && (
                <div className="px-1 text-xs text-(--muted)">
                  <div className="font-semibold text-(--ink-2)">{user.email}</div>
                  <div className="uppercase tracking-wider text-[10px]">{user.user_type}</div>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="drawer-nav-link w-full"
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
