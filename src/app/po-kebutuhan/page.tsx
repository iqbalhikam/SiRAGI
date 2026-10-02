"use client";

import React from "react";
import { POKebutuhanView } from "@/components/po/po-kebutuhan-view";
import { ShoppingCart, Calculator, Truck } from "lucide-react";

export default function POKebutuhanPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <main className="mx-auto w-full max-w-[1680px] px-3 py-6 sm:px-6 lg:px-8 flex-1">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShoppingCart className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Pengadaan Bahan Pangan MBG
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Truck className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  Bill of Materials (BOM) & PO Generator
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Generate PO / Kebutuhan Belanja
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Otomasi perhitungan tonase belanja bahan pangan mentah dari kumpulan resep terjadwal.
                Mengonversi gramasi resep dan target porsi siswa dengan faktor BDD (Bagian Dapat Dimakan)
                serta toleransi susut 5% sebelum diterbitkan menjadi Purchase Order (PO) siap ekspor ke Excel.
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="hidden lg:flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs text-xs transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 font-bold">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Kalkulasi Otomatis BOM</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">BDD Conversion • +5% Toleransi Susut</div>
              </div>
            </div>
          </div>
        </div>

        {/* PO View Component */}
        <POKebutuhanView />
      </main>
    </div>
  );
}
