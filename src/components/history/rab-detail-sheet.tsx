"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Building2,
  Utensils,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sheet,
  Sparkles,
} from "lucide-react";
import { RabHistoryDocument } from "@/types/rab";

interface RabDetailSheetProps {
  document: RabHistoryDocument | null;
  isOpen: boolean;
  spreadsheetUrl?: string | null;
  spreadsheetId?: string | null;
  onClose: () => void;
}

export function RabDetailSheet({
  document,
  isOpen,
  spreadsheetUrl,
  spreadsheetId,
  onClose,
}: RabDetailSheetProps) {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    url: string;
    title: string;
  } | null>(null);

  if (!isOpen || !document) return null;

  const handleExportThisDay = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      const res = await fetch("/api/rab/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: document.tanggal,
          mode: "single",
          spreadsheetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal export");

      setExportResult({
        url: data.spreadsheetUrl,
        title: data.title || `Laporan RAB ${document.tanggal}`,
      });
    } catch (err: any) {
      alert(err?.message || "Gagal melakukan export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-300 transition-colors">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5 bg-slate-50/70 dark:bg-slate-900/90">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <Utensils className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Rincian Dokumen RAB
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {document.tanggalFormatted}
                </span>
                <span className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {document.lokasiSppg}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
              title="Tutup Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                Total Menu
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {document.totalMenu}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                Total Bahan
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {document.totalBahan}
              </p>
            </div>
          </div>

          {/* Content: List of Menus */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {document.menus.map((menu, mIdx) => (
              <div
                key={mIdx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
              >
                {/* Menu Header */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {mIdx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {menu.namaMenu}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {menu.bahanList.length} Bahan
                  </span>
                </div>

                {/* Bahan Table */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="grid grid-cols-12 bg-slate-100/60 dark:bg-slate-800/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="col-span-6">Uraian Bahan</span>
                    <span className="col-span-3 text-center">Banyaknya</span>
                    <span className="col-span-3">Keterangan</span>
                  </div>

                  {menu.bahanList.map((b, bIdx) => (
                    <div
                      key={b.id || bIdx}
                      className="grid grid-cols-12 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <span className="col-span-6 font-medium text-slate-900 dark:text-slate-200">
                        {b.uraianBahan}
                      </span>
                      <span className="col-span-3 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                        {b.kuantitasAngka} {b.satuan}
                      </span>
                      <span className="col-span-3 text-slate-500 dark:text-slate-400 italic text-[11px]">
                        {b.keterangan || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Export Result Notice */}
          {exportResult && (
            <div className="mx-6 mb-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Format cetak berhasil digenerate!</span>
              </div>
              <a
                href={exportResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Buka File
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                <Sheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Buka di Google Sheets Master</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <button
              type="button"
              onClick={handleExportThisDay}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer ml-auto"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Membuat Format Cetak...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Export Format Cetak Tanggal Ini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
