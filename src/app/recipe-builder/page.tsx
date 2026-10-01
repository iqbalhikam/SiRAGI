"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { RecipeBuilderForm } from "@/components/recipe/recipe-builder-form";
import { ChefHat, Database, Calculator } from "lucide-react";

export default function RecipeBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ChefHat className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Recipe Nutrition & Cost Engine
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/60 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Database className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  Supabase PostgreSQL
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Recipe Builder
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Rancang standar resep hidangan secara presisi. Masukkan gramasi kotor bahan,
                sistem otomatis menghitung nilai Berat Bersih (BDD), Kalori, Protein, dan HPP (Harga Pokok Produksi)
                secara reaktif seketika sebelum disimpan ke Supabase.
              </p>
            </div>

            {/* Quick Specs Card */}
            <div className="hidden lg:flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">Formula Standar TKPI</div>
                <div className="text-slate-500 dark:text-slate-400">BDD (%) • Kalori & Protein / 100g</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Builder Form */}
        <RecipeBuilderForm />
      </main>
    </div>
  );
}
