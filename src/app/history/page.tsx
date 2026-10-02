"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { RabDetailSheet } from "@/components/history/rab-detail-sheet";
import { RabHistoryDocument } from "@/types/rab";
import {
  FileText,
  Calendar,
  Building2,
  Utensils,
  ExternalLink,
  Eye,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Database,
  Layers,
  Sparkles,
  Sheet,
  AlertCircle,
} from "lucide-react";

export default function HistoryPage() {
  const { data: session, status } = useSession();

  const [history, setHistory] = useState<RabHistoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");

  // Metadata
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  // Selected document for detail sheet
  const [selectedDoc, setSelectedDoc] = useState<RabHistoryDocument | null>(null);

  const fetchHistory = async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (keyword.trim()) params.set("keyword", keyword.trim());

      const res = await fetch(`/api/rab/history?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat riwayat RAB.");
      }

      setHistory(data.history || []);
      setSpreadsheetId(data.spreadsheetId || null);
      setSpreadsheetUrl(data.spreadsheetUrl || null);
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setError(err?.message || "Koneksi ke Google Sheets gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchHistory();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setKeyword("");
    // Re-fetch without params
    setTimeout(() => {
      fetchHistory();
    }, 50);
  };

  // Stats calculation
  const totalHari = history.length;
  const totalMenuAll = history.reduce((sum, doc) => sum + doc.totalMenu, 0);
  const totalBahanAll = history.reduce((sum, doc) => sum + doc.totalBahan, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb & Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-200">Riwayat RAB</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Riwayat Input RAB Gizi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data terstruktur historis yang terbaca langsung dari sheet internal{" "}
                <code className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-800 font-semibold font-mono text-[11px] dark:bg-emerald-950/60 dark:text-emerald-300">
                  Tab_Input_Harian
                </code>{" "}
                di Google Drive Anda.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition"
              >
                <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Input Entri Baru</span>
              </Link>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition"
                >
                  <Sheet className="h-4 w-4" />
                  <span>Buka Master Sheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Unauthenticated State */}
          {status === "unauthenticated" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto space-y-4 dark:border-slate-800 dark:bg-slate-900 transition-colors">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Login Diperlukan
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Untuk melihat riwayat data RAB, silakan masuk dengan akun Google
                Drive tempat database spreadsheet Anda tersimpan.
              </p>
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition cursor-pointer"
              >
                Login dengan Google
              </button>
            </div>
          )}

          {status === "authenticated" && (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Total Hari RAB
                    </span>
                    <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {totalHari} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Hari</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Total Menu Tercatat
                    </span>
                    <span className="rounded-lg bg-blue-50 dark:bg-blue-950/60 p-2 text-blue-600 dark:text-blue-400">
                      <Utensils className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {totalMenuAll} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Menu</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Total Rincian Bahan
                    </span>
                    <span className="rounded-lg bg-purple-50 dark:bg-purple-950/60 p-2 text-purple-600 dark:text-purple-400">
                      <Layers className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {totalBahanAll} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Bahan</span>
                  </p>
                </div>
              </div>

              {/* Filter Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <form
                  onSubmit={handleApplyFilter}
                  className="flex flex-col md:flex-row items-stretch md:items-end gap-3"
                >
                  {/* Search keyword */}
                  <div className="flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Pencarian (Menu / Bahan / Lokasi)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Ketik nama menu, bahan masakan, atau unit SPPG..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800 dark:placeholder-slate-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Date Range Start */}
                  <div className="w-full md:w-44">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800 transition-colors"
                    />
                  </div>

                  {/* Date Range End */}
                  <div className="w-full md:w-44">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800 transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </button>

                    {(startDate || endDate || keyword) && (
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={fetchHistory}
                      disabled={loading}
                      title="Segarkan data dari Google Sheets"
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                </form>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">Gagal Membaca Data Google Sheet</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Data Table Card */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4 w-48">Tanggal</th>
                        <th className="py-3.5 px-4 w-52">Lokasi SPPG</th>
                        <th className="py-3.5 px-4">Menu Makanan</th>
                        <th className="py-3.5 px-4 w-36 text-center">Total Item</th>
                        <th className="py-3.5 px-4 w-44 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {loading && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                              <span className="font-medium">
                                Membaca data dari Tab_Input_Harian Google Sheet...
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!loading && history.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                              <div className="rounded-2xl bg-slate-100 p-4 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <FileText className="h-8 w-8" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                Belum Ada Riwayat RAB
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Belum ditemukan data input pada tanggal yang dipilih.
                                Buat entri RAB baru untuk melihat data di sini.
                              </p>
                              <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                              >
                                <PlusCircle className="h-4 w-4" />
                                <span>Buat Entri RAB Sekarang</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        history.map((doc, idx) => (
                          <tr
                            key={doc.id || idx}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                          >
                            {/* No */}
                            <td className="py-4 px-4 text-center font-semibold text-slate-400 dark:text-slate-500">
                              {idx + 1}
                            </td>

                            {/* Tanggal */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {doc.tanggalFormatted}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  {doc.tanggal}
                                </span>
                              </div>
                            </td>

                            {/* Lokasi */}
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="line-clamp-1">{doc.lokasiSppg}</span>
                              </div>
                            </td>

                            {/* Menu Summary */}
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {doc.menus.slice(0, 3).map((m, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60"
                                  >
                                    {m.namaMenu}
                                  </span>
                                ))}
                                {doc.menus.length > 3 && (
                                  <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    +{doc.menus.length - 3} lainnya
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Total Items */}
                            <td className="py-4 px-4 text-center">
                              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100/70 px-2.5 py-1 text-[11px] dark:bg-slate-800/60">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {doc.totalMenu}
                                </span>{" "}
                                <span className="text-slate-400 dark:text-slate-500">menu</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {doc.totalBahan}
                                </span>{" "}
                                <span className="text-slate-400 dark:text-slate-500">bahan</span>
                              </div>
                            </td>

                            {/* Aksi */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDoc(doc)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-800 dark:hover:text-emerald-300 transition cursor-pointer"
                                  title="Lihat rincian menu dan bahan"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Lihat Detail</span>
                                </button>

                                {spreadsheetUrl && (
                                  <a
                                    href={spreadsheetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
                                    title="Buka baris di Google Sheet"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Slide-over Detail Sheet */}
      <RabDetailSheet
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        spreadsheetUrl={spreadsheetUrl}
        spreadsheetId={spreadsheetId}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}
