"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  BatchInputState,
  BatchSatuan,
  BatchConversionResult,
  calculateGramasiKotorFromBatch,
} from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Calculator, CheckCircle2, ChevronDown } from "lucide-react";

const SATUAN_OPTIONS: { value: BatchSatuan; label: string; desc: string }[] = [
  { value: "kg", label: "kg", desc: "Kilogram → ×1000 gram" },
  { value: "liter", label: "liter", desc: "Liter → ×1000 ml (1ml≈1g)" },
  { value: "gram", label: "gram", desc: "Gram langsung" },
  { value: "ml", label: "ml", desc: "Mililiter langsung" },
  { value: "pcs", label: "pcs", desc: "Satuan per porsi (pecahan)" },
  { value: "kotak", label: "kotak", desc: "Kotak per porsi (pecahan)" },
];

interface BatchCalculatorPopoverProps {
  /** nama bahan untuk ditampilkan di header popover */
  namaBahan: string;
  /** callback saat pengguna menekan "Terapkan" — mengirim BatchConversionResult lengkap */
  onApply: (result: BatchConversionResult) => void;
}

export function BatchCalculatorPopover({
  namaBahan,
  onApply,
}: BatchCalculatorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [batch, setBatch] = useState<BatchInputState>({
    total_porsi: "",
    jumlah_bahan: "",
    satuan: "kg",
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup popover saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Hitung real-time setiap kali batch berubah
  const hasInput =
    batch.jumlah_bahan !== "" &&
    batch.total_porsi !== "" &&
    Number(batch.jumlah_bahan) > 0 &&
    Number(batch.total_porsi) > 0;

  const conversionResult = hasInput
    ? calculateGramasiKotorFromBatch(batch.jumlah_bahan, batch.total_porsi, batch.satuan)
    : null;

  const handleApply = useCallback(() => {
    if (!conversionResult) return;
    onApply(conversionResult);
    setOpen(false);
    // Reset setelah diterapkan
    setBatch({ total_porsi: "", jumlah_bahan: "", satuan: "kg" });
  }, [conversionResult, onApply]);

  const isPcs = conversionResult?.isPcs ?? false;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Hitung gramasi dari belanja massal / batch"
        aria-label="Buka kalkulator belanja massal"
        aria-expanded={open}
        className={`
          flex items-center gap-1 h-8 px-2 rounded-md border text-[11px] font-semibold
          transition-all duration-150 cursor-pointer select-none
          ${
            open
              ? "bg-violet-600 border-violet-600 text-white shadow-sm"
              : "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:border-violet-400"
          }
        `}
      >
        <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Dari Belanja</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating Popover Panel */}
      {open && (
        <div
          className="
            absolute z-50 right-0 top-full mt-2 w-80 sm:w-96
            rounded-2xl border border-violet-200 dark:border-violet-800
            bg-white dark:bg-slate-900
            shadow-2xl shadow-violet-900/10 dark:shadow-violet-900/40
            overflow-hidden
          "
          style={{ minWidth: "320px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-500">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Kalkulator Belanja Massal</p>
                <p className="text-[10px] text-violet-200 leading-tight truncate max-w-[200px]">{namaBahan}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5">
            {/* Mode Info Badge */}
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 px-3 py-2">
              <ShoppingCart className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <p className="text-[11px] text-violet-700 dark:text-violet-300">
                Masukkan total pembelian lalu sistem menghitung otomatis <strong>gram per porsi</strong>
              </p>
            </div>

            {/* Input: Jumlah Bahan */}
            <div className="space-y-1.5">
              <label htmlFor="batch-jumlah-bahan" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                📦 Jumlah Bahan Dibeli
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="batch-jumlah-bahan"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Contoh: 120"
                    value={batch.jumlah_bahan === "" ? "" : batch.jumlah_bahan}
                    onChange={(e) =>
                      setBatch((prev) => ({
                        ...prev,
                        jumlah_bahan: e.target.value === "" ? "" : parseFloat(e.target.value),
                      }))
                    }
                    className="pr-2 text-sm font-semibold"
                  />
                </div>

                {/* Satuan Dropdown */}
                <div className="relative w-28">
                  <select
                    id="batch-satuan"
                    value={batch.satuan}
                    onChange={(e) =>
                      setBatch((prev) => ({
                        ...prev,
                        satuan: e.target.value as BatchSatuan,
                      }))
                    }
                    className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 cursor-pointer"
                  >
                    {SATUAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Deskripsi satuan aktif */}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5">
                {SATUAN_OPTIONS.find((o) => o.value === batch.satuan)?.desc}
              </p>
            </div>

            {/* Divider with label */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">dibagi</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Input: Total Porsi */}
            <div className="space-y-1.5">
              <label htmlFor="batch-total-porsi" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                🍽️ Total Porsi yang Dimasak
              </label>
              <div className="relative">
                <Input
                  id="batch-total-porsi"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 1938"
                  value={batch.total_porsi === "" ? "" : batch.total_porsi}
                  onChange={(e) =>
                    setBatch((prev) => ({
                      ...prev,
                      total_porsi: e.target.value === "" ? "" : parseFloat(e.target.value),
                    }))
                  }
                  className="pr-16 text-sm font-semibold"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  porsi
                </span>
              </div>
            </div>

            {/* ===== Real-Time Conversion Result ===== */}
            {conversionResult ? (
              <div
                className={`
                  rounded-xl border p-3 space-y-1 transition-all
                  ${
                    isPcs
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                  }
                `}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{isPcs ? "📦" : "⚖️"}</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isPcs
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    💡 Konversi Otomatis:
                  </span>
                </div>
                <p
                  className={`text-xs font-bold tracking-tight ${
                    isPcs
                      ? "text-amber-900 dark:text-amber-200"
                      : "text-emerald-900 dark:text-emerald-200"
                  }`}
                >
                  {conversionResult.label}
                </p>
                {isPcs && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    ⚠️ Satuan pcs/kotak: nilai gramasi akan disimpan sebagai pecahan per porsi.
                  </p>
                )}
                {!isPcs && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Nilai ini akan digunakan sebagai gramasi kotor (gram) per 1 porsi.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-3 text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Isi jumlah bahan &amp; total porsi untuk melihat konversi otomatis ↑
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatch({ total_porsi: "", jumlah_bahan: "", satuan: "kg" });
                }}
                className="flex-1 text-xs h-8 gap-1"
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
              <button
                type="button"
                disabled={!conversionResult}
                onClick={handleApply}
                className={`
                  flex flex-[2] items-center justify-center gap-1.5 text-xs h-8 px-3 rounded-md font-semibold transition-all
                  ${
                    conversionResult
                      ? "bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }
                `}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Terapkan ke Resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
