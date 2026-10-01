"use client";

import React, { useState, useEffect, useMemo } from "react";
import { POSummary, POItemBOM } from "@/types/po-kebutuhan";
import { exportPOToExcel } from "@/utils/export-po-excel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Percent,
  Search,
  Scale,
  DollarSign,
  TrendingDown,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";

export function POKebutuhanView() {
  // Input parameters
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4); // 5 hari ke depan
    return d.toISOString().split("T")[0];
  });
  const [targetPorsi, setTargetPorsi] = useState<number>(5000);
  const [toleransiSusut, setToleransiSusut] = useState<number>(5);

  // Data & loading state
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<POSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("Semua");

  // Fetch / Generate PO Function
  const generatePO = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/po-kebutuhan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          targetPorsi,
          toleransiSusut,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal melakukan kalkulasi BOM PO.");
      }

      setSummary(json.data);
    } catch (err: any) {
      console.error("PO generation error:", err);
      setError(err?.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    generatePO();
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!summary?.items) return [];
    return summary.items.filter((item) => {
      const matchCat =
        selectedKategori === "Semua" || item.kategori === selectedKategori;
      const matchSearch =
        !searchQuery ||
        item.namaBahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [summary, selectedKategori, searchQuery]);

  // Categories list
  const kategoriList = useMemo(() => {
    if (!summary?.items) return ["Semua"];
    const cats = new Set<string>(summary.items.map((i) => i.kategori));
    return ["Semua", ...Array.from(cats)];
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Parameter Control Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Parameter Pengadaan & Target Siswa
              </CardTitle>
              <CardDescription>
                Tentukan rentang tanggal siklus menu dan target porsi siswa untuk kalkulasi otomatis Kebutuhan Belanja (BOM).
              </CardDescription>
            </div>

            {/* Action Export Button */}
            {summary && (
              <Button
                type="button"
                variant="emerald"
                size="default"
                onClick={() => exportPOToExcel(summary)}
                className="gap-2 font-bold shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export to Excel (.xlsx)
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Tanggal Mulai */}
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Tanggal Mulai
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs font-semibold"
              />
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Tanggal Selesai
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs font-semibold"
              />
            </div>

            {/* Target Porsi Siswa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="target-porsi" className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  Target Porsi / Hari
                </Label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTargetPorsi(3000)}
                    className="text-emerald-700 hover:underline"
                  >
                    3k
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTargetPorsi(5000)}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    5k
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTargetPorsi(10000)}
                    className="text-emerald-700 hover:underline"
                  >
                    10k
                  </button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="target-porsi"
                  type="number"
                  min="1"
                  step="100"
                  value={targetPorsi}
                  onChange={(e) => setTargetPorsi(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 pr-12 font-bold text-slate-900 dark:text-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  porsi
                </span>
              </div>
            </div>

            {/* Toleransi Susut (%) */}
            <div className="space-y-1.5">
              <Label htmlFor="toleransi-susut" className="flex items-center gap-1.5 text-xs">
                <Percent className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Toleransi Susut (Waste)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="toleransi-susut"
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={toleransiSusut}
                    onChange={(e) => setToleransiSusut(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="h-10 pr-7 font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    %
                  </span>
                </div>

                <Button
                  type="button"
                  variant="default"
                  onClick={generatePO}
                  disabled={loading}
                  className="h-10 px-4 font-bold text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Hitung PO
                </Button>
              </div>
            </div>
          </div>

          {/* Formula reminder card */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Rumus BOM:</strong> Total Beli (kg) = (Gramasi Resep × Target Porsi) ÷ (BDD% ÷ 100) ÷ 1000 + Toleransi Susut ({toleransiSusut}%).
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tonase */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Total Tonase Beli
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {(summary.totalTonaseKg / 1000).toFixed(2)} Ton
              </Badge>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {summary.totalTonaseKg.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg mentah</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Termasuk toleransi susut {summary.toleransiSusutPersen}%
            </div>
          </div>

          {/* Total Anggaran PO */}
          <div className="rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/40 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Total Anggaran PO Belanja
              </span>
              <Badge variant="emerald" className="text-[10px]">
                {summary.totalHariEfektif} Hari Siklus
              </Badge>
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-400">
              Rp {summary.totalAnggaranPO.toLocaleString("id-ID")}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Kumulatif {summary.totalPorsiKumulatif.toLocaleString("id-ID")} porsi makanan
            </div>
          </div>

          {/* Biaya per Porsi Siswa */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Biaya Bahan / Porsi
              </span>
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-mono">
                Maks Rp 15.000
              </span>
            </div>
            <div className="text-2xl font-black tracking-tight text-blue-950 dark:text-blue-300">
              Rp {summary.biayaPerPorsiSiswa.toLocaleString("id-ID")}
            </div>
            <div className="mt-1 text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Sesuai pagu anggaran MBG
            </div>
          </div>

          {/* Jumlah Bahan Pangan */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Komoditas Bahan
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                TKPI Master
              </span>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {summary.totalJenisBahan}{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">komoditas</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Terkelompok dari berbagai resep
            </div>
          </div>
        </div>
      )}

      {/* Data Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Rincian Purchase Order (PO) Bahan Mentah</span>
                <Badge variant="secondary" className="font-semibold text-xs">
                  {filteredItems.length} Komoditas
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Perhitungan agregat kebutuhan belanja mentah siap kirim ke supplier / pasar induk
              </CardDescription>
            </div>

            {/* Filter & Search inside Table Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Dropdown */}
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-700 dark:text-slate-300 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              >
                {kategoriList.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                  type="text"
                  placeholder="Cari bahan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs w-48"
                />
              </div>

              {summary && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => exportPOToExcel(summary)}
                  className="text-xs gap-1.5 h-9"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Excel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Bahan Pangan</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-center">BDD (%)</th>
                <th className="py-3 px-3 text-right">Porsi (g)</th>
                <th className="py-3 px-3 text-right">Kebutuhan Dasar (kg)</th>
                <th className="py-3 px-3 text-right">Susut (+5%) (kg)</th>
                <th className="py-3 px-4 text-right bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 font-extrabold">
                  Total Beli (kg)
                </th>
                <th className="py-3 px-3 text-right">Harga / kg</th>
                <th className="py-3 px-4 text-right bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 font-extrabold">
                  Estimasi Biaya
                </th>
                <th className="py-3 px-4">Menu Terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-2" />
                    Menghitung kebutuhan belanja dari resep...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada bahan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-500 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.namaBahan}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                        {item.kategori}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.bddPersen}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {item.gramasiResepPerPorsi} g
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {item.totalKebutuhanKotorKg.toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      +{item.toleransiSusutKg.toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300">
                      {item.totalBeliFinalKg.toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      Rp {item.hargaPerKg.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300">
                      Rp {item.subtotalBiaya.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {item.dipakaiPadaResep.map((r, i) => (
                          <span
                            key={i}
                            className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                            title={r}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && (
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={7} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    TOTAL KESELURUHAN PENGADAAN:
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-base bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300">
                    {summary.totalTonaseKg.toLocaleString("id-ID")} kg
                  </td>
                  <td></td>
                  <td className="py-3.5 px-4 text-right font-black text-base bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300">
                    Rp {summary.totalAnggaranPO.toLocaleString("id-ID")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
