"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  MasterBahan,
  ResepKomposisiItem,
  ResepSummary,
  MOCK_MASTER_BAHAN,
  calculateItemValues,
} from "@/types/recipe";
import { supabase, isSupabaseConfigured } from "@/utils/supabase/client";
import { IngredientRow } from "./ingredient-row";
import { RecipeSummary } from "./recipe-summary";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Save,
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const KATEGORI_RESEP_OPTIONS = [
  "Menu Utama (Komplit)",
  "Lauk Hewani",
  "Lauk Nabati",
  "Sayuran & Sup",
  "Makanan Pokok",
  "Snack / PMT Balita",
  "Lainnya",
];

export function RecipeBuilderForm() {
  const [supabaseReady, setSupabaseReady] = useState<boolean>(false);
  const [masterBahanList, setMasterBahanList] = useState<MasterBahan[]>(MOCK_MASTER_BAHAN);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

  // Form State
  const [namaResep, setNamaResep] = useState<string>("");
  const [kategori, setKategori] = useState<string>("Menu Utama (Komplit)");
  const [porsi, setPorsi] = useState<number>(1);
  const [deskripsi, setDeskripsi] = useState<string>("");

  // Dynamic Composition State
  const [komposisi, setKomposisi] = useState<ResepKomposisiItem[]>([
    {
      tempId: "init-1",
      bahan_id: "mb-01",
      nama_bahan: "Beras Putih Giling",
      kategori: "Makanan Pokok",
      bdd_persen: 100,
      kalori_100g: 360,
      protein_100g: 6.8,
      harga_per_kg: 14500,
      gramasi_kotor: 100,
      berat_bersih: 100,
      kalori: 360,
      protein: 6.8,
      harga: 1450,
    },
    {
      tempId: "init-2",
      bahan_id: "mb-02",
      nama_bahan: "Daging Ayam Karkas (Utuh)",
      kategori: "Lauk Hewani",
      bdd_persen: 58,
      kalori_100g: 298,
      protein_100g: 18.2,
      harga_per_kg: 38000,
      gramasi_kotor: 150,
      berat_bersih: 87,
      kalori: 259.3,
      protein: 15.8,
      harga: 5700,
    },
    {
      tempId: "init-3",
      bahan_id: "mb-09",
      nama_bahan: "Wortel Segar",
      kategori: "Sayuran",
      bdd_persen: 88,
      kalori_100g: 36,
      protein_100g: 1.0,
      harga_per_kg: 15000,
      gramasi_kotor: 50,
      berat_bersih: 44,
      kalori: 15.8,
      protein: 0.4,
      harga: 750,
    },
  ]);

  // Master Bahan Selector Filter & State
  const [selectedBahanId, setSelectedBahanId] = useState<string>(MOCK_MASTER_BAHAN[0]?.id || "");
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessResult, setSaveSuccessResult] = useState<{
    resepId: string;
    mode: "supabase" | "simulated";
    namaResep: string;
    totalHpp: number;
    hppPerPorsi: number;
    count: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSqlDialog, setShowSqlDialog] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Check Supabase readiness & try fetching live master_bahan
  useEffect(() => {
    const isConfigured = isSupabaseConfigured();
    setSupabaseReady(isConfigured);

    if (isConfigured) {
      const fetchLiveMaster = async () => {
        try {
          setLoadingMaster(true);
          const { data, error } = await supabase
            .from("master_bahan")
            .select("*")
            .order("nama_bahan", { ascending: true });

          if (!error && data && data.length > 0) {
            setMasterBahanList(data as MasterBahan[]);
          }
        } catch (err) {
          console.warn("Using mock master data (master_bahan table not yet created):", err);
        } finally {
          setLoadingMaster(false);
        }
      };
      fetchLiveMaster();
    }
  }, []);

  // Filtered Master Bahan for Picker
  const filteredMasterBahan = useMemo(() => {
    return masterBahanList.filter((b) => {
      const matchKategori =
        filterKategori === "Semua" || b.kategori === filterKategori;
      const matchQuery =
        !searchQuery ||
        b.nama_bahan.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKategori && matchQuery;
    });
  }, [masterBahanList, filterKategori, searchQuery]);

  // Real-time Reactive Summary Calculation
  const summary: ResepSummary = useMemo(() => {
    let totalBeratKotor = 0;
    let totalBeratBersih = 0;
    let totalKalori = 0;
    let totalProtein = 0;
    let totalHpp = 0;

    komposisi.forEach((item) => {
      const kotor = typeof item.gramasi_kotor === "number" ? item.gramasi_kotor : 0;
      totalBeratKotor += kotor;
      totalBeratBersih += item.berat_bersih || 0;
      totalKalori += item.kalori || 0;
      totalProtein += item.protein || 0;
      totalHpp += item.harga || 0;
    });

    const porsiNum = Math.max(1, porsi || 1);

    return {
      totalBeratKotor: Math.round(totalBeratKotor * 10) / 10,
      totalBeratBersih: Math.round(totalBeratBersih * 10) / 10,
      totalKalori: Math.round(totalKalori * 10) / 10,
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalHpp: Math.round(totalHpp),
      kaloriPerPorsi: Math.round((totalKalori / porsiNum) * 10) / 10,
      proteinPerPorsi: Math.round((totalProtein / porsiNum) * 10) / 10,
      hppPerPorsi: Math.round(totalHpp / porsiNum),
    };
  }, [komposisi, porsi]);

  // Add Ingredient Handler
  const handleAddIngredient = () => {
    const master = masterBahanList.find((b) => b.id === selectedBahanId) || masterBahanList[0];
    if (!master) return;

    const defaultGramasi = 100;
    const calc = calculateItemValues(
      defaultGramasi,
      master.bdd_persen,
      master.kalori_100g,
      master.protein_100g,
      master.harga_per_kg
    );

    const newItem: ResepKomposisiItem = {
      tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      bahan_id: master.id,
      nama_bahan: master.nama_bahan,
      kategori: master.kategori,
      bdd_persen: master.bdd_persen,
      kalori_100g: master.kalori_100g,
      protein_100g: master.protein_100g,
      harga_per_kg: master.harga_per_kg,
      gramasi_kotor: defaultGramasi,
      berat_bersih: calc.berat_bersih,
      kalori: calc.kalori,
      protein: calc.protein,
      harga: calc.harga,
    };

    setKomposisi((prev) => [...prev, newItem]);
  };

  // Update Ingredient Row Handler
  const handleUpdateItem = (index: number, updatedItem: ResepKomposisiItem) => {
    setKomposisi((prev) => {
      const copy = [...prev];
      copy[index] = updatedItem;
      return copy;
    });
  };

  // Remove Ingredient Row Handler
  const handleDeleteItem = (index: number) => {
    if (komposisi.length <= 1) return;
    setKomposisi((prev) => prev.filter((_, i) => i !== index));
  };

  // Preset Handlers
  const loadPreset = (type: "ayam" | "telur" | "sehat") => {
    if (type === "ayam") {
      setNamaResep("Nasi Ayam Bakar & Sayur Wortel");
      setKategori("Menu Utama (Komplit)");
      setPorsi(1);
      const items: ResepKomposisiItem[] = [
        {
          tempId: `p-${Date.now()}-1`,
          bahan_id: "mb-01",
          nama_bahan: "Beras Putih Giling",
          bdd_persen: 100,
          kalori_100g: 360,
          protein_100g: 6.8,
          harga_per_kg: 14500,
          gramasi_kotor: 100,
          ...calculateItemValues(100, 100, 360, 6.8, 14500),
        },
        {
          tempId: `p-${Date.now()}-2`,
          bahan_id: "mb-02",
          nama_bahan: "Daging Ayam Karkas (Utuh)",
          bdd_persen: 58,
          kalori_100g: 298,
          protein_100g: 18.2,
          harga_per_kg: 38000,
          gramasi_kotor: 180,
          ...calculateItemValues(180, 58, 298, 18.2, 38000),
        },
        {
          tempId: `p-${Date.now()}-3`,
          bahan_id: "mb-09",
          nama_bahan: "Wortel Segar",
          bdd_persen: 88,
          kalori_100g: 36,
          protein_100g: 1.0,
          harga_per_kg: 15000,
          gramasi_kotor: 75,
          ...calculateItemValues(75, 88, 36, 1.0, 15000),
        },
        {
          tempId: `p-${Date.now()}-4`,
          bahan_id: "mb-14",
          nama_bahan: "Minyak Kelapa Sawit (Goreng)",
          bdd_persen: 100,
          kalori_100g: 884,
          protein_100g: 0,
          harga_per_kg: 18500,
          gramasi_kotor: 10,
          ...calculateItemValues(10, 100, 884, 0, 18500),
        },
      ];
      setKomposisi(items);
    } else if (type === "telur") {
      setNamaResep("Semur Telur Tahu Bumbu Manis");
      setKategori("Lauk Hewani");
      setPorsi(2);
      const items: ResepKomposisiItem[] = [
        {
          tempId: `p-${Date.now()}-1`,
          bahan_id: "mb-05",
          nama_bahan: "Telur Ayam Ras (dengan Cangkang)",
          bdd_persen: 89,
          kalori_100g: 154,
          protein_100g: 12.4,
          harga_per_kg: 28000,
          gramasi_kotor: 120,
          ...calculateItemValues(120, 89, 154, 12.4, 28000),
        },
        {
          tempId: `p-${Date.now()}-2`,
          bahan_id: "mb-08",
          nama_bahan: "Tahu Putih Segar",
          bdd_persen: 100,
          kalori_100g: 80,
          protein_100g: 10.9,
          harga_per_kg: 12000,
          gramasi_kotor: 150,
          ...calculateItemValues(150, 100, 80, 10.9, 12000),
        },
        {
          tempId: `p-${Date.now()}-3`,
          bahan_id: "mb-15",
          nama_bahan: "Bawang Merah Lokal",
          bdd_persen: 90,
          kalori_100g: 39,
          protein_100g: 1.5,
          harga_per_kg: 35000,
          gramasi_kotor: 20,
          ...calculateItemValues(20, 90, 39, 1.5, 35000),
        },
      ];
      setKomposisi(items);
    } else {
      setNamaResep("Sup Sayur Ikan Kembung Segar");
      setKategori("Sayuran & Sup");
      setPorsi(1);
      const items: ResepKomposisiItem[] = [
        {
          tempId: `p-${Date.now()}-1`,
          bahan_id: "mb-06",
          nama_bahan: "Ikan Kembung Segar",
          bdd_persen: 80,
          kalori_100g: 112,
          protein_100g: 21.4,
          harga_per_kg: 42000,
          gramasi_kotor: 120,
          ...calculateItemValues(120, 80, 112, 21.4, 42000),
        },
        {
          tempId: `p-${Date.now()}-2`,
          bahan_id: "mb-12",
          nama_bahan: "Brokoli Segar",
          bdd_persen: 63,
          kalori_100g: 34,
          protein_100g: 2.8,
          harga_per_kg: 28000,
          gramasi_kotor: 80,
          ...calculateItemValues(80, 63, 34, 2.8, 28000),
        },
        {
          tempId: `p-${Date.now()}-3`,
          bahan_id: "mb-09",
          nama_bahan: "Wortel Segar",
          bdd_persen: 88,
          kalori_100g: 36,
          protein_100g: 1.0,
          harga_per_kg: 15000,
          gramasi_kotor: 60,
          ...calculateItemValues(60, 88, 36, 1.0, 15000),
        },
      ];
      setKomposisi(items);
    }
  };

  // Reset Form
  const handleReset = () => {
    setNamaResep("");
    setPorsi(1);
    setDeskripsi("");
    setKomposisi([
      {
        tempId: `r-${Date.now()}`,
        bahan_id: "mb-01",
        nama_bahan: "Beras Putih Giling",
        bdd_persen: 100,
        kalori_100g: 360,
        protein_100g: 6.8,
        harga_per_kg: 14500,
        gramasi_kotor: 100,
        ...calculateItemValues(100, 100, 360, 6.8, 14500),
      },
    ]);
    setSaveSuccessResult(null);
    setErrorMessage(null);
  };

  // Submit Handler: POST to Supabase tables resep & resep_komposisi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccessResult(null);

    if (!namaResep.trim()) {
      setErrorMessage("Silakan masukkan Nama Resep terlebih dahulu.");
      return;
    }

    if (komposisi.length === 0) {
      setErrorMessage("Tambahkan minimal 1 bahan ke dalam resep.");
      return;
    }

    for (let i = 0; i < komposisi.length; i++) {
      const item = komposisi[i];
      if (item.gramasi_kotor === "" || item.gramasi_kotor <= 0) {
        setErrorMessage(
          `Bahan #${i + 1} (${item.nama_bahan}) memiliki gramasi kotor kosong atau 0.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Panggil endpoint POST /api/resep yang terhubung ke Supabase
      const payload = {
        nama_resep: namaResep.trim(),
        kategori,
        deskripsi,
        porsi,
        total_kalori: summary.totalKalori,
        total_protein: summary.totalProtein,
        total_hpp: summary.totalHpp,
        hpp_per_porsi: summary.hppPerPorsi,
        komposisi: komposisi.map((item) => ({
          bahan_id: item.bahan_id,
          nama_bahan: item.nama_bahan,
          gramasi_kotor: item.gramasi_kotor,
          bdd_persen: item.bdd_persen,
          berat_bersih: item.berat_bersih,
          kalori: item.kalori,
          protein: item.protein,
          harga: item.harga,
        })),
      };

      const res = await fetch("/api/resep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Gagal menyimpan resep ke Supabase.");
      }

      setSaveSuccessResult({
        resepId: resData.resep?.id || "N/A",
        mode: resData.mode === "supabase" ? "supabase" : "simulated",
        namaResep: namaResep.trim(),
        totalHpp: summary.totalHpp,
        hppPerPorsi: summary.hppPerPorsi,
        count: komposisi.length,
      });
    } catch (err: any) {
      console.error("Submit error:", err);
      setErrorMessage(
        err.message || "Terjadi kesalahan saat memproses penyimpanan resep."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sqlSchemaScript = `-- ==========================================
-- SKRIP SQL SKEMA SUPABASE POSTGRESQL SIRAGI
-- Jalankan di: Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Tabel Master Bahan (Database TKPI / DKBM Gizi)
CREATE TABLE IF NOT EXISTS master_bahan (
  id TEXT PRIMARY KEY,
  nama_bahan TEXT NOT NULL,
  kategori TEXT NOT NULL,
  bdd_persen NUMERIC(5,2) NOT NULL DEFAULT 100,
  kalori_100g NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein_100g NUMERIC(8,2) NOT NULL DEFAULT 0,
  harga_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  satuan TEXT DEFAULT 'kg',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Header Resep
CREATE TABLE IF NOT EXISTS resep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_resep TEXT NOT NULL,
  kategori TEXT DEFAULT 'Umum',
  deskripsi TEXT,
  porsi INTEGER NOT NULL DEFAULT 1,
  total_kalori NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_protein NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_hpp NUMERIC(12,2) NOT NULL DEFAULT 0,
  hpp_per_porsi NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Detail Komposisi Bahan Resep (Relasional)
CREATE TABLE IF NOT EXISTS resep_komposisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resep_id UUID NOT NULL REFERENCES resep(id) ON DELETE CASCADE,
  bahan_id TEXT,
  nama_bahan TEXT NOT NULL,
  gramasi_kotor NUMERIC(10,2) NOT NULL,
  bdd_persen NUMERIC(5,2) NOT NULL,
  berat_bersih NUMERIC(10,2) NOT NULL,
  kalori NUMERIC(10,2) NOT NULL,
  protein NUMERIC(10,2) NOT NULL,
  harga NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk performa query relasi
CREATE INDEX IF NOT EXISTS idx_resep_komposisi_resep_id ON resep_komposisi(resep_id);

-- 4. Kebijakan Row Level Security (RLS)
-- Mengizinkan pembacaan & penyimpanan data resep dan komposisi
ALTER TABLE resep ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on resep" ON resep;
CREATE POLICY "Allow public read on resep" ON resep FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on resep" ON resep;
CREATE POLICY "Allow public insert on resep" ON resep FOR INSERT WITH CHECK (true);

ALTER TABLE resep_komposisi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on resep_komposisi" ON resep_komposisi;
CREATE POLICY "Allow public read on resep_komposisi" ON resep_komposisi FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on resep_komposisi" ON resep_komposisi;
CREATE POLICY "Allow public insert on resep_komposisi" ON resep_komposisi FOR INSERT WITH CHECK (true);

ALTER TABLE master_bahan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on master_bahan" ON master_bahan;
CREATE POLICY "Allow public read on master_bahan" ON master_bahan FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on master_bahan" ON master_bahan;
CREATE POLICY "Allow public insert on master_bahan" ON master_bahan FOR INSERT WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner Status Supabase */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                supabaseReady
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
              }`}
            >
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Status Database Supabase PostgreSQL
                </span>
                <Badge
                  variant={supabaseReady ? "emerald" : "amber"}
                  className="text-[10px]"
                >
                  {supabaseReady ? "Terhubung" : "Mode Mock / Belum Diatur"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {supabaseReady
                  ? "Koneksi Supabase aktif. Resep akan langsung disimpan ke tabel PostgreSQL."
                  : "Kredensial .env.local belum diisi. Tetap dapat menghitung real-time dan menyimpan simulasi."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSqlDialog(!showSqlDialog)}
              className="text-xs gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              {showSqlDialog ? "Tutup Skrip SQL" : "Skrip SQL Tabel Supabase"}
            </Button>
          </div>
        </div>

        {/* Collapsible SQL Schema Viewer */}
        {showSqlDialog && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Skrip SQL DDL untuk Tabel `master_bahan`, `resep`, dan `resep_komposisi`
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-xs gap-1 text-emerald-700 hover:bg-emerald-50 h-7"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin Skrip SQL
                  </>
                )}
              </Button>
            </div>
            <pre className="rounded-lg bg-slate-900 p-3.5 text-xs text-emerald-300 font-mono overflow-x-auto max-h-56 leading-relaxed">
              {sqlSchemaScript}
            </pre>
            <p className="mt-2 text-[11px] text-slate-500">
              Petunjuk: Masuk ke Supabase Console &gt; Project Anda &gt; SQL Editor &gt; Paste skrip di atas &gt; Klik Run.
            </p>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informasi Header Resep */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Identitas Resep
                </CardTitle>
                <CardDescription>
                  Tentukan nama hidangan, kategori porsi, dan target porsi sajian
                </CardDescription>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-slate-400 mr-1">
                  Preset Cepat:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset("ayam")}
                  className="text-xs h-7 px-2.5"
                >
                  🍗 Ayam Bakar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset("telur")}
                  className="text-xs h-7 px-2.5"
                >
                  🥚 Semur Telur
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset("sehat")}
                  className="text-xs h-7 px-2.5"
                >
                  🐟 Sup Ikan Segar
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Nama Resep */}
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="nama-resep">
                  Nama Resep / Menu Hidangan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama-resep"
                  type="text"
                  placeholder="Contoh: Ayam Bakar Bumbu Rujak, Sayur Lodeh Tempe..."
                  value={namaResep}
                  onChange={(e) => setNamaResep(e.target.value)}
                  className="h-10 text-base font-semibold"
                  required
                />
              </div>

              {/* Kategori Resep */}
              <div className="md:col-span-4 space-y-1.5">
                <Label htmlFor="kategori-resep">Kategori Menu</Label>
                <select
                  id="kategori-resep"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {KATEGORI_RESEP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="dark:bg-slate-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah Porsi */}
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="porsi-resep">
                  Target Porsi <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="porsi-resep"
                    type="number"
                    min="1"
                    step="1"
                    value={porsi}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setPorsi(isNaN(v) || v < 1 ? 1 : v);
                    }}
                    className="h-10 pr-9 text-base font-semibold"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    porsi
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan / Deskripsi Tambahan */}
            <div className="space-y-1.5">
              <Label htmlFor="deskripsi-resep">Catatan Cara Pengolahan / Spesifikasi (Opsional)</Label>
              <Input
                id="deskripsi-resep"
                type="text"
                placeholder="Misal: Daging dipotong dadu 2x2 cm, gunakan minyak tiris, bumbu dihaluskan..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Blok Dinamis Komposisi Bahan */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Komposisi Bahan Makanan</span>
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {komposisi.length} Bahan Ditambahkan
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Masukkan gramasi kotor (berat beli). Nilai Berat Bersih, Kalori, Protein, dan HPP akan dihitung seketika berdasarkan standar BDD & TKPI.
                </CardDescription>
              </div>

              {/* Formula Reminder Pill */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-3 py-1.5">
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  Bersih = Kotor × (BDD ÷ 100)
                </span>
                <span>•</span>
                <span className="font-mono text-orange-700 dark:text-orange-400 font-semibold">
                  Kalori = (Bersih ÷ 100) × Kalori_100g
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Master Bahan Selector */}
            <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Pilih & Tambah Bahan dari Master Database (TKPI / DKBM)
                </span>
                {loadingMaster && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse">
                    Memuat data master...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Filter Kategori */}
                <div className="sm:col-span-3">
                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    <option value="Semua" className="dark:bg-slate-900">Semua Kategori</option>
                    <option value="Makanan Pokok" className="dark:bg-slate-900">Makanan Pokok</option>
                    <option value="Lauk Hewani" className="dark:bg-slate-900">Lauk Hewani</option>
                    <option value="Lauk Nabati" className="dark:bg-slate-900">Lauk Nabati</option>
                    <option value="Sayuran" className="dark:bg-slate-900">Sayuran</option>
                    <option value="Buah" className="dark:bg-slate-900">Buah</option>
                    <option value="Bumbu & Minyak" className="dark:bg-slate-900">Bumbu & Minyak</option>
                  </select>
                </div>

                {/* Pilih Bahan Dropdown */}
                <div className="sm:col-span-6">
                  <select
                    value={selectedBahanId}
                    onChange={(e) => setSelectedBahanId(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    {filteredMasterBahan.map((b) => (
                      <option key={b.id} value={b.id} className="dark:bg-slate-900">
                        {b.nama_bahan} (BDD: {b.bdd_persen}% • Rp {b.harga_per_kg.toLocaleString("id-ID")}/kg)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tombol Tambahkan */}
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="emerald"
                    size="sm"
                    onClick={handleAddIngredient}
                    className="w-full text-xs gap-1.5 h-9"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah ke Resep
                  </Button>
                </div>
              </div>
            </div>

            {/* List Baris Komposisi Dinamis */}
            <div className="space-y-3 pt-2">
              {komposisi.map((item, index) => (
                <IngredientRow
                  key={item.tempId}
                  index={index}
                  item={item}
                  canDelete={komposisi.length > 1}
                  onChange={(updated) => handleUpdateItem(index, updated)}
                  onDelete={() => handleDeleteItem(index)}
                />
              ))}
            </div>

            {/* Bottom Add button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Gunakan tombol di atas untuk menambah jenis bahan lainnya.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                Tambah Bahan Lain
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Ringkasan Nilai Gizi & HPP Reaktif */}
        <RecipeSummary summary={summary} porsi={porsi} />

        {/* Feedback Alerts: Success or Error */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-red-800">Peringatan Penyimpanan:</p>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {saveSuccessResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-bold text-emerald-900 text-base">
                  Resep Berhasil Disimpan!
                </p>
                <Badge
                  variant={saveSuccessResult.mode === "supabase" ? "emerald" : "amber"}
                  className="text-xs"
                >
                  {saveSuccessResult.mode === "supabase"
                    ? "Supabase PostgreSQL"
                    : "Simulasi Demo"}
                </Badge>
              </div>
              <p className="text-emerald-800 text-xs">
                Resep <strong>&ldquo;{saveSuccessResult.namaResep}&rdquo;</strong> dengan{" "}
                <strong>{saveSuccessResult.count} komponen bahan</strong> telah tersimpan relasional.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-emerald-900 pt-1">
                <span>
                  ID: <span className="font-semibold">{saveSuccessResult.resepId}</span>
                </span>
                <span>•</span>
                <span>
                  HPP/Porsi:{" "}
                  <strong>Rp {saveSuccessResult.hppPerPorsi.toLocaleString("id-ID")}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleReset}
              disabled={isSubmitting}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              Reset Form
            </Button>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
              Total {komposisi.length} bahan dimasukkan
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500 dark:text-slate-400">HPP / Porsi:</div>
              <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                Rp {summary.hppPerPorsi.toLocaleString("id-ID")}
              </div>
            </div>

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm font-bold gap-2 px-6 h-11 shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan ke Supabase...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Resep & Komposisi
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
