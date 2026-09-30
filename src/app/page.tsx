"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { RabForm } from "@/components/rab/rab-form";
import { ExportSection } from "@/components/rab/export-modal";
import {
  FileSpreadsheet,
  HardDrive,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  FileCheck2,
  Lock,
} from "lucide-react";

export default function Home() {
  const { data: session, status, update } = useSession();
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState<boolean>(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [lastSubmittedDate, setLastSubmittedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Auto-provision or verify Master_DB_RAB_Gizi on login
  const checkOrProvisionDb = async () => {
    if (status !== "authenticated") return;
    setProvisioning(true);
    setProvisionError(null);

    try {
      const res = await fetch("/api/db/provision");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menginisialisasi spreadsheet di Drive.");
      }

      setSpreadsheetId(data.spreadsheetId);
      setSpreadsheetUrl(data.spreadsheetUrl);

      // Update NextAuth session with the discovered spreadsheetId
      await update({ spreadsheetId: data.spreadsheetId });
    } catch (err: any) {
      console.error("Provisioning error:", err);
      setProvisionError(err?.message || "Koneksi Google API gagal.");
    } finally {
      setProvisioning(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      checkOrProvisionDb();
    }
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        spreadsheetUrl={spreadsheetUrl}
        isDbReady={Boolean(spreadsheetId && !provisioning)}
      />

      <main className="flex-1 pb-16">
        {status === "loading" && (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">
                Memeriksa sesi pengguna...
              </p>
            </div>
          </div>
        )}

        {/* Unauthenticated Landing View */}
        {status === "unauthenticated" && (
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Hero */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Konsep Baru: Database-per-User di Google Drive Anda</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Sistem Pendataan <span className="text-emerald-600">RAB Gizi</span> Tanpa Server Database Terpusat
              </h1>
              <p className="text-base text-slate-600">
                Data Anda sepenuhnya milik Anda. Saat login, sistem otomatis membuat dan
                menghubungkan file internal spreadsheet{" "}
                <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800 font-mono text-sm">
                  Master_DB_RAB_Gizi
                </code>{" "}
                di Google Drive pribadi Anda.
              </p>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => signIn("google")}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition transform hover:-translate-y-0.5"
                >
                  <HardDrive className="h-5 w-5" />
                  <span>Mulai Sekarang — Login dengan Google</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  100% Privacy & Milik Anda
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tidak ada data yang disimpan di database eksternal pengembang.
                  Semua transaksi langsung tercatat ke Google Drive akun Google Anda sendiri.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Repeater Dinamis
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Entri RAB fleksibel dengan sub-menu dan sub-bahan. Mendukung berbagai
                  satuan (kg, liter, pcs, pouch, kotak, ball) dengan validasi otomatis.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-4">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Export Siap Cetak (Formatted)
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Sekali klik untuk membuat spreadsheet laporan baru berformat formal:
                  header biru korporat, cell merging rapi, dan border tabel cetak.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Authenticated Dashboard View */}
        {status === "authenticated" && (
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            {/* Database Auto-Provisioning Status Banner */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      spreadsheetId
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        {provisioning
                          ? "Memeriksa Database di Google Drive..."
                          : spreadsheetId
                          ? "Master_DB_RAB_Gizi Terkoneksi"
                          : "Belum Terhubung"}
                      </h2>
                      {spreadsheetId && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Drive Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tab internal:{" "}
                      <span className="font-semibold text-slate-700">
                        Tab_Input_Harian
                      </span>{" "}
                      (ID, Tanggal, Lokasi SPPG, Nama Menu, Uraian Bahan, Kuantitas_Angka, Satuan, Keterangan)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={checkOrProvisionDb}
                    disabled={provisioning}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                    title="Periksa ulang keberadaan file di Google Drive"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${provisioning ? "animate-spin" : ""}`}
                    />
                    <span>Sinkronkan DB</span>
                  </button>

                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      <span>Buka Master Sheet</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {provisionError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p className="font-semibold">Peringatan Koneksi Database:</p>
                  <p className="mt-0.5">{provisionError}</p>
                  <p className="mt-1 text-[11px] text-red-600">
                    Pastikan konfigurasi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sudah diisi serta scope Google Drive diizinkan saat login.
                  </p>
                </div>
              )}
            </div>

            {/* SPA Form for Daily RAB */}
            <RabForm
              spreadsheetId={spreadsheetId}
              onSuccessSubmit={(tgl) => setLastSubmittedDate(tgl)}
            />

            {/* Export Section */}
            <ExportSection
              currentDate={lastSubmittedDate}
              spreadsheetId={spreadsheetId}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            SiRAGI • Sistem Rencana Anggaran Biaya Gizi • Arsitektur Database-per-User berbasis Google Sheets & Google Drive API.
          </p>
        </div>
      </footer>
    </div>
  );
}
