"use client";

import React from "react";
import { ResepSummary } from "@/types/recipe";
import { Flame, Beef, Coins, Scale, Sparkles, ChefHat } from "lucide-react";

interface RecipeSummaryProps {
  summary: ResepSummary;
  porsi: number;
}

export function RecipeSummary({ summary, porsi }: RecipeSummaryProps) {
  const porsiCount = Math.max(1, porsi || 1);
  const yieldRendemen =
    summary.totalBeratKotor > 0
      ? Math.round((summary.totalBeratBersih / summary.totalBeratKotor) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 p-5 shadow-sm transition-colors">
      {/* Header Ringkasan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-100/80 dark:border-emerald-900/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <ChefHat className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Ringkasan Nilai Gizi & HPP Resep
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dihitung otomatis per batch ({porsiCount} porsi) & nilai per porsi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Real-Time Reactive
          </span>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Utama */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* HPP Per Porsi (Kartu Sorotan Utama) */}
        <div className="rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/40 bg-white dark:bg-slate-900 p-4 shadow-xs relative overflow-hidden transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Coins className="h-24 w-24 text-emerald-800" />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              HPP Per Porsi
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              /porsi
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-400">
            Rp {summary.hppPerPorsi.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Batch:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Rp {summary.totalHpp.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Total Kalori */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-800 dark:text-orange-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              Total Energi / Kalori
            </span>
            <span className="text-[10px] bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded font-mono">
              kkal
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-orange-950 dark:text-orange-400">
            {summary.kaloriPerPorsi.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-orange-700 dark:text-orange-300">kkal/porsi</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Resep ({porsiCount} porsi):</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {summary.totalKalori.toLocaleString("id-ID")} kkal
            </span>
          </div>
        </div>

        {/* Total Protein */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Beef className="h-4 w-4 text-blue-500" />
              Total Protein
            </span>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">
              gram
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-blue-950 dark:text-blue-400">
            {summary.proteinPerPorsi.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-blue-700 dark:text-blue-300">g/porsi</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Resep ({porsiCount} porsi):</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {summary.totalProtein.toLocaleString("id-ID")} g
            </span>
          </div>
        </div>

        {/* Berat & Rendemen Bahan */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Berat & BDD
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
              Rendemen {yieldRendemen}%
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {summary.totalBeratBersih.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">g bersih</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Berat Kotor Belian:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {summary.totalBeratKotor.toLocaleString("id-ID")} g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
