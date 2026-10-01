"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  FileSpreadsheet,
  LogIn,
  LogOut,
  ExternalLink,
  History,
  PenSquare,
  ChefHat,
  CalendarDays,
  ShoppingCart,
  Database,
} from "lucide-react";

interface NavbarProps {
  spreadsheetUrl?: string | null;
  isDbReady?: boolean;
}

export function Navbar({ spreadsheetUrl, isDbReady }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  SiRAGI
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30">
                  SaaS Gizi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Sistem RAB Gizi • Database-per-User di Google Sheets
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs (Authenticated) */}
        {status === "authenticated" && (
          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 p-1 text-xs font-semibold">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>Input Form</span>
            </Link>
            <Link
              href="/resep/builder"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/resep/builder" || pathname === "/recipe-builder"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>Recipe Builder</span>
            </Link>
            <Link
              href="/menu-planner"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/menu-planner"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Menu Planner MBG</span>
            </Link>
            <Link
              href="/po-kebutuhan"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/po-kebutuhan"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Generate PO</span>
            </Link>
            <Link
              href="/history"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/history"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Riwayat RAB</span>
            </Link>
            <Link
              href="/master-data"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/master-data"
                  ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Master TKPI</span>
            </Link>
          </nav>
        )}

        {/* Action & Status */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {status === "authenticated" && (
            <>
              {/* Database Status indicator */}
              <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isDbReady ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isDbReady ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  ></span>
                </span>
                <span className="font-medium">
                  {isDbReady ? "Master_DB Terhubung" : "Memeriksa DB..."}
                </span>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ml-1 hover:underline"
                    title="Buka file Master DB di Google Sheets"
                  >
                    Buka
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* User profile */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {session.user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {session.user?.email}
                  </p>
                </div>

                <button
                  onClick={() => signOut()}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400 transition cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Login dengan Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
