"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { MenuPlanner } from "@/components/planner/menu-planner";
import { CalendarDays, UtensilsCrossed } from "lucide-react";

export default function MenuPlannerPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />

      <main className="mx-auto w-full max-w-[1680px] px-3 py-6 sm:px-6 lg:px-8 flex-1">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Makan Bergizi Gratis (MBG) Nasional
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <CalendarDays className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  Siklus Mingguan (Senin - Jumat)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Menu Planner MBG
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Rancang menu makan siang sekolah dengan fitur drag-and-drop.
                Validasi real-time otomatis memeriksa kecukupan gizi (minimal 30% AKG / 700 kkal)
                dan batas anggaran bahan baku (maksimal Rp 15.000 / porsi).
              </p>
            </div>

            {/* Quick Validation Legend */}
            <div className="flex items-center gap-3 self-start md:self-center text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">Lolos Standar</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-900" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">Perlu Koreksi (&lt;30% AKG / HPP Lebih)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Planner Component */}
        <MenuPlanner />
      </main>
    </div>
  );
}
