"use client";

import React, { useState } from "react";
import {
  FileDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Sheet,
} from "lucide-react";

interface ExportModalProps {
  currentDate: string;
  spreadsheetId?: string | null;
}

export function ExportSection({ currentDate, spreadsheetId }: ExportModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    spreadsheetUrl: string;
    title: string;
    rowCount: number;
  } | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError("Silakan pilih tanggal laporan yang ingin diexport.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/rab/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: selectedDate,
          spreadsheetId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan export laporan.");
      }

      setResult({
        spreadsheetUrl: data.spreadsheetUrl,
        title: data.title || `Laporan RAB ${selectedDate}`,
        rowCount: data.rowCount || 0,
      });
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FileDown className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Export Laporan Cetak RAB
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Menghasilkan file Google Sheet baru di Drive Anda dengan cell merging,
            header warna biru, dan border tabel standar cetak.
          </p>
        </div>

        {/* Export Form */}
        <form onSubmit={handleExport} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memformat & Menyusun Sheet...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Laporan RAB</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Export Belum Berhasil</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Feedback Card */}
      {result && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-600 p-2 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 mb-1">
                  File Berhasil Dibuat di Google Drive Anda
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {result.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Berisi {result.rowCount} item bahan dengan format siap cetak (merge cell & border).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={result.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Sheet className="h-4 w-4" />
                <span>Buka di Google Sheets</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-blue-200/60">
            💡 File ini tersimpan mandiri di akun Google Drive Anda. Anda dapat mengatur akses berbagi (share link), mendownload sebagai PDF/Excel, atau mencetaknya langsung.
          </p>
        </div>
      )}
    </div>
  );
}
