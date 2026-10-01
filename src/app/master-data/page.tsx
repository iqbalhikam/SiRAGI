"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";
import {
  Database,
  Upload,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MasterBahanTKPI } from "@/types/tkpi";

export default function MasterDataPage() {
  const [items, setItems] = useState<MasterBahanTKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("all");
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isTableCreated, setIsTableCreated] = useState<boolean | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Import Modal & Parser State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<MasterBahanTKPI[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data from Supabase via API route
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/import-tkpi?limit=1000");
      const result = await res.json();

      setIsTableCreated(result.isTableCreated ?? true);

      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
        setIsDbConnected(true);
      } else {
        setIsDbConnected(result.isConfigured ?? false);
        setItems([]);
      }
    } catch (err) {
      console.error("Gagal memuat data TKPI:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Kategori List
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.kategori) set.add(item.kategori);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered & Paginated items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.nama_bahan.toLowerCase().includes(search.toLowerCase()) ||
        item.kode_tkpi.toLowerCase().includes(search.toLowerCase());
      const matchKategori =
        selectedKategori === "all" || item.kategori === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [items, search, selectedKategori]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handler: Handle File Selection and Client-side Parsing via papaparse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setImportStatus({ type: null, message: "" });

    // Client-side CSV Parsing with PapaParse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        setIsParsing(false);
        const rows = results.data as Record<string, any>[];

        if (!rows || rows.length === 0) {
          setImportStatus({
            type: "error",
            message: "File CSV kosong atau tidak memiliki data yang valid.",
          });
          setParsedPreview([]);
          return;
        }

        // Helper to get case-insensitive field (exact or prefix match)
        const getField = (row: Record<string, any>, ...keys: string[]) => {
          for (const key of keys) {
            const foundKey = Object.keys(row).find(
              (k) =>
                k.trim().toLowerCase() === key.toLowerCase() ||
                k.trim().toLowerCase().startsWith(key.toLowerCase())
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== "") {
              return row[foundKey];
            }
          }
          return undefined;
        };

        const parseNum = (val: any, fallback = 0): number => {
          if (val === undefined || val === null || val === "") return fallback;
          const cleanStr = String(val).replace(/,/g, ".").trim();
          const num = parseFloat(cleanStr);
          return isNaN(num) ? fallback : num;
        };

        // Map parsed rows to MasterBahanTKPI format
        const cleanList: MasterBahanTKPI[] = [];
        rows.forEach((row, idx) => {
          // Cocokkan kolom id / kode_tkpi
          const kode = String(
            getField(row, "id", "kode_tkpi", "kode", "code", "id_bahan") || `TKPI${idx + 1}`
          ).trim();
          
          // Cocokkan kolom name / nama_bahan
          const nama = String(
            getField(row, "name", "nama_bahan", "nama", "bahan", "makanan") || ""
          ).trim();

          if (!nama) return; // Lewati baris tanpa nama bahan

          const imageUrl = getField(row, "image", "image_url", "img", "photo", "picture");

          cleanList.push({
            kode_tkpi: kode,
            nama_bahan: nama,
            kategori: (getField(row, "kategori", "category", "kelompok") || "Umum").trim(),
            bdd_persen: parseNum(getField(row, "bdd_persen", "bdd_percent", "bdd", "bdd (%)"), 100),
            harga_estimasi_per_kg: parseNum(
              getField(row, "harga_estimasi_per_kg", "harga_per_kg", "price_per_kg", "harga", "price"),
              0
            ),
            energi_kcal: parseNum(
              getField(row, "calories", "calorie", "energi_kcal", "energi", "kalori", "energy"),
              0
            ),
            protein_g: parseNum(
              getField(row, "proteins", "protein", "protein_g"),
              0
            ),
            lemak_g: parseNum(
              getField(row, "fat", "fats", "lemak_g", "lemak"),
              0
            ),
            karbo_g: parseNum(
              getField(row, "carbohydr", "carbohydrates", "carbohydrate", "karbo_g", "karbo", "karbohidrat", "carbs"),
              0
            ),
            serat_g: parseNum(getField(row, "serat_g", "serat", "fiber", "fibers"), 0),
            besi_fe_mg: parseNum(getField(row, "besi_fe_mg", "besi", "fe", "iron"), 0),
            kalsium_ca_mg: parseNum(getField(row, "kalsium_ca_mg", "kalsium", "ca", "calcium"), 0),
            zink_zn_mg: parseNum(getField(row, "zink_zn_mg", "zink", "zn", "zinc"), 0),
            vit_a_mcg: parseNum(getField(row, "vit_a_mcg", "vit_a", "vitamin_a"), 0),
            vit_c_mg: parseNum(getField(row, "vit_c_mg", "vit_c", "vitamin_c"), 0),
            image_url: imageUrl ? String(imageUrl).trim() : null,
          });
        });

        if (cleanList.length === 0) {
          setImportStatus({
            type: "error",
            message:
              "Format kolom CSV tidak dikenali. Pastikan memiliki kolom 'id' atau 'kode_tkpi' serta 'name' atau 'nama_bahan'.",
          });
        } else {
          setParsedPreview(cleanList);
          setImportStatus({
            type: "success",
            message: `Berhasil membaca file! Ditemukan ${cleanList.length} bahan makanan siap diimpor.`,
          });
        }
      },
      error: (error) => {
        setIsParsing(false);
        setImportStatus({
          type: "error",
          message: `Gagal membaca file CSV: ${error.message}`,
        });
      },
    });
  };

  // Handler: Kirim parsed JSON ke Backend API Route via POST
  const handleUploadToBackend = async () => {
    if (parsedPreview.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress("Mengirim data ke Supabase...");

      const response = await fetch("/api/import-tkpi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: parsedPreview }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengimpor data ke Supabase.");
      }

      setImportStatus({
        type: "success",
        message: result.message || `Sukses mengimpor ${parsedPreview.length} data TKPI!`,
      });

      // Refresh data dari database
      await fetchData();

      // Tutup modal setelah delay singkat
      setTimeout(() => {
        setIsImportModalOpen(false);
        setSelectedFile(null);
        setParsedPreview([]);
        setImportStatus({ type: null, message: "" });
      }, 1800);
    } catch (err: any) {
      console.error("Error import:", err);
      setImportStatus({
        type: "error",
        message: err.message || "Terjadi kesalahan saat memproses data.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Handler: Unduh Template CSV TKPI (Mendukung format id, calories, proteins, fat, carbohydrates, name, image)
  const handleDownloadTemplate = () => {
    const headers = [
      "id",
      "calories",
      "proteins",
      "fat",
      "carbohydrates",
      "name",
      "image",
      "category",
      "bdd_percent",
      "price_per_kg",
    ];

    const rows = [
      headers.join(","),
      'SR001,357,8.4,1.7,77.1,"Beras Giling Putih Mentah","https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100",Serealia,100,14500',
      'DG001,298,18.2,25.0,0,"Daging Ayam Ras Segar","https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100","Daging & Unggas",58,38000',
      'TL001,154,12.4,10.8,0.7,"Telur Ayam Ras Segar","https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=100",Telur,89,28000',
      'NB001,80,10.9,4.7,0.8,"Tahu Putih Segar","https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100",Kacang-kacangan,100,10000',
      'SY001,16,0.9,0.4,2.9,"Bayam Segar","https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100",Sayuran,71,12000',
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_master_bahan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 transition-colors">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Master Data TKPI
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                >
                  Tabel Komposisi Pangan Indonesia
                </Badge>
                {isDbConnected ? (
                  <Badge
                    variant="outline"
                    className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800"
                  >
                    Supabase Terhubung ({items.length} Bahan)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  >
                    Supabase Belum Terhubung
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Katalog bahan pangan standar Kemenkes RI dengan informasi nilai gizi (per 100g) dan estimasi harga per kg untuk perhitungan RAB & Menu MBG.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Unduh contoh file CSV dengan format kolom yang sesuai"
              >
                <Download className="h-4 w-4" />
                <span>Template CSV</span>
              </Button>

              <Button
                onClick={() => {
                  setImportStatus({ type: null, message: "" });
                  setSelectedFile(null);
                  setParsedPreview([]);
                  setIsImportModalOpen(true);
                }}
                size="sm"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
              >
                <Upload className="h-4 w-4" />
                <span>Import Data TKPI (CSV)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200 p-2"
                title="Segarkan Data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Search, Filter & Quick Stats Row */}
          <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama bahan atau kode TKPI..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9"
                />
              </div>

              {/* Filter Kategori */}
              <select
                value={selectedKategori}
                onChange={(e) => {
                  setSelectedKategori(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-2xs transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="all">Semua Kategori ({items.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Menampilkan <strong>{filteredItems.length}</strong> bahan
              </span>
            </div>
          </div>
        </div>

        {/* Info Banner if Supabase table is not yet created */}
        {isTableCreated === false && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Tabel Database Supabase Belum Dibuat
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                Tabel <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">master_bahan_tkpi</code> belum dibuat di Supabase Anda. File migrasi SQL telah tersedia di <code className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">supabase/migrations/20261001_create_master_bahan_tkpi.sql</code>.
              </p>
              <p className="text-amber-700/90 dark:text-amber-400/90">
                Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, tempelkan isi file migrasi tersebut, dan klik <strong>Run</strong>. Setelah itu, klik tombol <strong>Segarkan Data</strong> atau langsung gunakan tombol <strong>Import Data TKPI (CSV)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Master Table using Shadcn UI Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableRow>
                  <TableHead className="w-[110px]">Kode TKPI</TableHead>
                  <TableHead className="min-w-[200px]">Nama Bahan Makanan</TableHead>
                  <TableHead className="min-w-[120px]">Kategori</TableHead>
                  <TableHead className="text-right w-[90px]">BDD (%)</TableHead>
                  <TableHead className="text-right min-w-[130px]">Harga Est. / kg</TableHead>
                  <TableHead className="text-right w-[100px]">Energi (kkal)</TableHead>
                  <TableHead className="text-right w-[90px]">Protein (g)</TableHead>
                  <TableHead className="text-right w-[90px]">Lemak (g)</TableHead>
                  <TableHead className="text-right w-[90px]">Karbo (g)</TableHead>
                  <TableHead className="text-right w-[90px]">Serat (g)</TableHead>
                  <TableHead className="text-right w-[90px]">Besi Fe (mg)</TableHead>
                  <TableHead className="text-right w-[90px]">Kalsium Ca (mg)</TableHead>
                  <TableHead className="text-right w-[90px]">Zink Zn (mg)</TableHead>
                  <TableHead className="text-right w-[100px]">Vit A (mcg)</TableHead>
                  <TableHead className="text-right w-[90px]">Vit C (mg)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={15} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                        <span>Memuat data master TKPI...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="h-44 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2.5 py-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-base">
                          {search || selectedKategori !== "all"
                            ? "Tidak ada bahan makanan yang cocok dengan filter"
                            : "Belum ada data Master Bahan TKPI"}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          {search || selectedKategori !== "all"
                            ? "Coba gunakan kata kunci pencarian lain atau pilih kategori Semua."
                            : "Tabel masih kosong. Silakan gunakan tombol \"Import Data TKPI (CSV)\" di atas untuk menambahkan data bahan ke Supabase."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.kode_tkpi} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
                      <TableCell className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 border border-emerald-200/60 dark:bg-emerald-950/60 dark:border-emerald-800">
                          {item.kode_tkpi}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.nama_bahan}
                              className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : null}
                          <span className="truncate max-w-[220px]" title={item.nama_bahan}>
                            {item.nama_bahan}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.kategori || "Lainnya"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {item.bdd_persen}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                        Rp {Number(item.harga_estimasi_per_kg || 0).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {item.energi_kcal}
                      </TableCell>
                      <TableCell className="text-right text-slate-700 dark:text-slate-300">
                        {item.protein_g}
                      </TableCell>
                      <TableCell className="text-right text-slate-700 dark:text-slate-300">
                        {item.lemak_g}
                      </TableCell>
                      <TableCell className="text-right text-slate-700 dark:text-slate-300">
                        {item.karbo_g}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.serat_g}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.besi_fe_mg}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.kalsium_ca_mg}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.zink_zn_mg}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.vit_a_mcg}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 dark:text-slate-400">
                        {item.vit_c_mg}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Halaman <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span> dari{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Import CSV */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
              {/* Close Button */}
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Import Data TKPI (CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload file CSV untuk memperbarui atau menambahkan daftar bahan ke database Supabase.
                  </p>
                </div>
              </div>

              {/* Dropzone Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/20 cursor-pointer transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileSpreadsheet className="h-10 w-10 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : "Klik atau seret file CSV ke sini"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Format didukung: File CSV dengan header kolom (kode_tkpi, nama_bahan, dll.)
                </p>
              </div>

              {/* Status Message */}
              {importStatus.message && (
                <div
                  className={`mt-4 flex items-start gap-2.5 rounded-lg p-3 text-xs ${
                    importStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                  }`}
                >
                  {importStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <p className="font-medium">{importStatus.message}</p>
                </div>
              )}

              {/* Preview 3 sample rows */}
              {parsedPreview.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Preview Data ({parsedPreview.length} total baris):
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      *Duplikasi kode_tkpi otomatis diperbarui (Upsert)
                    </span>
                  </div>
                  <div className="max-h-36 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2">Kode</th>
                          <th className="p-2">Nama Bahan</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2 text-right">Energi</th>
                          <th className="p-2 text-right">Protein</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedPreview.slice(0, 3).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-mono text-emerald-600 dark:text-emerald-400">
                              {row.kode_tkpi}
                            </td>
                            <td className="p-2 font-medium">
                              <div className="flex items-center gap-2">
                                {row.image_url ? (
                                  <img
                                    src={row.image_url}
                                    alt=""
                                    className="h-6 w-6 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span>{row.nama_bahan}</span>
                              </div>
                            </td>
                            <td className="p-2 text-slate-500">{row.kategori}</td>
                            <td className="p-2 text-right">{row.energi_kcal} kkal</td>
                            <td className="p-2 text-right">{row.protein_g} g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isUploading}
                >
                  Batal
                </Button>

                <Button
                  onClick={handleUploadToBackend}
                  disabled={parsedPreview.length === 0 || isUploading || isParsing}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{uploadProgress || "Mengunggah..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Simpan ke Supabase ({parsedPreview.length} Bahan)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
