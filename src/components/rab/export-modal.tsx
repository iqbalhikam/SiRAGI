"use client";

import React, { useState } from "react";
import {
  FileDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Sheet,
} from "lucide-react";

interface ExportModalProps {
  currentDate: string;
  spreadsheetId?: string | null;
}

export function ExportSection({ currentDate, spreadsheetId }: ExportModalProps) {
  const [mode, setMode] = useState<"single" | "all" | "range">("single");
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [startDate, setStartDate] = useState<string>(currentDate);
  const [endDate, setEndDate] = useState<string>(currentDate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    spreadsheetUrl: string;
    title: string;
    rowCount: number;
    datesCount?: number;
  } | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/rab/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          tanggal: mode === "single" ? selectedDate : undefined,
          startDate: mode === "range" ? startDate : undefined,
          endDate: mode === "range" ? endDate : undefined,
          spreadsheetId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan export laporan.");
      }

      setResult({
        spreadsheetUrl: data.spreadsheetUrl,
        title: data.title || "Laporan Food Cost RAB",
        rowCount: data.rowCount || 0,
        datesCount: data.datesCount || 1,
      });
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              <FileDown className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Export Laporan Food Cost (Kebutuhan Bahan Baku) Harian
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Format resmi sesuai standar cetak SPPG: Banner Biru Atas, Header Biru, Rincian Menu Harian, dan Border Tabel Solid.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
              mode === "single"
                ? "bg-white text-blue-700 shadow-xs font-bold dark:bg-slate-900 dark:text-blue-400"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            1 Tanggal
          </button>
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
              mode === "all"
                ? "bg-white text-blue-700 shadow-xs font-bold dark:bg-slate-900 dark:text-blue-400"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Semua Tanggal
          </button>
          <button
            type="button"
            onClick={() => setMode("range")}
            className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
              mode === "range"
                ? "bg-white text-blue-700 shadow-xs font-bold dark:bg-slate-900 dark:text-blue-400"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Rentang Tanggal
          </button>
        </div>
      </div>

      {/* Export Form */}
      <form onSubmit={handleExport} className="mt-5 flex flex-wrap items-center gap-4">
        {mode === "single" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Tanggal:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>
        )}

        {mode === "range" && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dari:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sampai:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>
        )}

        {mode === "all" && (
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2 rounded-xl">
            Semua data tanggal di Tab_Input_Harian akan digabungkan menjadi laporan harian bertingkat.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Membuat Spreadsheet Format Food Cost...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Laporan Food Cost (Format Cetak)</span>
            </>
          )}
        </button>
      </form>

      {/* Error Feedback */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Export Belum Berhasil</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Feedback Card */}
      {result && (
        <div className="mt-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-sky-50/50 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-slate-800/80 p-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-600 p-2.5 text-white shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1">
                  File Berhasil Dibuat di Google Drive Anda
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {result.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Berisi <strong>{result.rowCount} item bahan</strong> dari{" "}
                  <strong>{result.datesCount} hari</strong> dengan format Banner Biru, Header Biru, dan Border Tabel Solid.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={result.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Sheet className="h-4 w-4" />
                <span>Buka di Google Sheets</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-blue-200/60 dark:border-slate-700/60">
            💡 File ini tersimpan mandiri di akun Google Drive Anda dengan susunan No, Menu, Uraian Bahan, Banyaknya, dan Keterangan persis seperti format cetak manual SPPG.
          </p>
        </div>
      )}
    </div>
  );
}
