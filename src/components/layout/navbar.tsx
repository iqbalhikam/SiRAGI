"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  FileSpreadsheet,
  LogIn,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  spreadsheetUrl?: string | null;
  isDbReady?: boolean;
}

export function Navbar({ spreadsheetUrl, isDbReady }: NavbarProps) {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                SiRAGI
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                SaaS Gizi
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Sistem RAB Gizi • Database-per-User di Google Sheets
            </p>
          </div>
        </div>

        {/* Action & Status */}
        <div className="flex items-center gap-3">
          {status === "authenticated" && (
            <>
              {/* Database Status indicator */}
              <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700">
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
                  {isDbReady ? "Master_DB_RAB_Gizi Terhubung" : "Memeriksa DB Drive..."}
                </span>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 ml-1 hover:underline"
                    title="Buka file Master DB di Google Sheets"
                  >
                    Buka Sheet
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* User profile */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-8 w-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none">
                    {session.user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {session.user?.email}
                  </p>
                </div>

                <button
                  onClick={() => signOut()}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition"
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
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
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
