"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowLeft,
  Utensils,
  DollarSign,
  Scale,
  Activity,
  Flame,
  PieChart,
  RefreshCw,
  ShoppingCart,
  FolderOpen,
  Copy,
  SlidersHorizontal,
} from "lucide-react";
import { TKPICombobox } from "@/components/recipe/tkpi-combobox";
import { MasterBahanTKPI } from "@/types/tkpi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { SATUAN_LIST, getGramPerUnit } from "@/lib/satuan-converter";
import { SavedRecipesModal } from "@/components/recipe/saved-recipes-modal";

// Interface untuk baris komposisi dinamis
export interface ResepRowItem {
  rowId: string;
  bahan: MasterBahanTKPI | null;
  gramasi_kotor: number | "";
  // Nilai terhitung otomatis
  berat_bersih: number;
  kalori: number;
  protein: number;
  lemak: number;
  karbo: number;
  biaya: number;
}

const KATEGORI_OPTIONS = [
  "Makanan Pokok",
  "Lauk Hewani",
  "Lauk Nabati",
  "Sayuran",
  "Buah",
  "Snack / Camilan",
  "Menu Utama (Komplit)",
  "Lainnya",
];

export default function RecipeBuilderPage() {
  // 1. State Header Resep
  const [namaResep, setNamaResep] = useState("");
  const [kategori, setKategori] = useState("Lauk Hewani");
  const [porsi, setPorsi] = useState<number>(1);
  const [deskripsi, setDeskripsi] = useState("");

  // 2. State Baris Dinamis Multi-Bahan
  const [rows, setRows] = useState<ResepRowItem[]>([
    {
      rowId: "row-" + Date.now() + "-1",
      bahan: null,
      gramasi_kotor: "",
      berat_bersih: 0,
      kalori: 0,
      protein: 0,
      lemak: 0,
      karbo: 0,
      biaya: 0,
    },
  ]);

  // 3. State Proses Simpan & Notifikasi
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 4. State input jumlah bahan dibeli, satuan, custom gram & potong per unit (keyed by rowId)
  const [jumlahBahanInputs, setJumlahBahanInputs] = useState<Record<string, string>>({});
  const [satuanInputs, setSatuanInputs] = useState<Record<string, string>>({});
  const [customGramInputs, setCustomGramInputs] = useState<Record<string, number>>({});
  const [potongPerUnitInputs, setPotongPerUnitInputs] = useState<Record<string, number>>({});
  const [showCustomGramInputs, setShowCustomGramInputs] = useState<Record<string, boolean>>({});

  // 5. State Edit Resep yang Sudah Dibuat
  const [editingResepId, setEditingResepId] = useState<string | null>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // Auto-load resep dari URL parameter (?id=...) jika ada
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get("id");
      if (idFromUrl) {
        fetch(`/api/resep/${idFromUrl}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.resep) {
              handleSelectRecipeFromModal(data.resep);
            }
          })
          .catch((err) => console.error("Error auto-loading recipe:", err));
      }
    }
  }, []);

  // Helper kalkulasi per baris:
  // Berat Bersih (g) = gramasi_kotor * (bdd_persen / 100)
  // Kalori (kcal) = (Berat Bersih / 100) * energi_kcal
  // Protein (g) = (Berat Bersih / 100) * protein_g
  // Estimasi Biaya (Rp) = (gramasi_kotor / 1000) * harga_estimasi_per_kg
  const calculateRowValues = (
    bahan: MasterBahanTKPI | null,
    gramasiKotorVal: number | ""
  ) => {
    const gramasi = typeof gramasiKotorVal === "number" ? gramasiKotorVal : 0;
    if (!bahan || gramasi <= 0) {
      return {
        berat_bersih: 0,
        kalori: 0,
        protein: 0,
        lemak: 0,
        karbo: 0,
        biaya: 0,
      };
    }

    const bdd = Number(bahan.bdd_persen) || 100;
    const beratBersih = gramasi * (bdd / 100);
    const kalori = (beratBersih / 100) * (Number(bahan.energi_kcal) || 0);
    const protein = (beratBersih / 100) * (Number(bahan.protein_g) || 0);
    const lemak = (beratBersih / 100) * (Number(bahan.lemak_g) || 0);
    const karbo = (beratBersih / 100) * (Number(bahan.karbo_g) || 0);
    const biaya = (gramasi / 1000) * (Number(bahan.harga_estimasi_per_kg) || 0);

    return {
      berat_bersih: beratBersih,
      kalori: kalori,
      protein: protein,
      lemak: lemak,
      karbo: karbo,
      biaya: biaya,
    };
  };

  // Handler: Update Bahan pada Baris Tertentu
  const handleSelectBahan = (index: number, bahan: MasterBahanTKPI) => {
    setRows((prev) => {
      const next = [...prev];
      const currentRow = next[index];

      // Cerdas tentukan satuan default berdasarkan nama bahan
      const n = (bahan.nama_bahan || "").toLowerCase();
      let suggestedSatuan = satuanInputs[currentRow.rowId] || "kg";
      let suggestedGram = 1000;
      let suggestedPotong = 1;

      if (n.includes("tahu")) {
        suggestedSatuan = "kotak";
        suggestedGram = 50; // default tahu ~50g per potong (1 porsi)
        suggestedPotong = 6; // default 6 potong per kotak
      } else if (n.includes("garam")) {
        suggestedSatuan = "pcs";
        suggestedGram = 2.5; // default garam ~2.5g per porsi
        suggestedPotong = 100; // 1 pcs (250g) = 100 porsi
      } else if (n.includes("telur")) {
        suggestedSatuan = "butir";
        suggestedGram = 60; // default telur ~60g/butir
        suggestedPotong = 1;
      }

      setSatuanInputs((s) => ({ ...s, [currentRow.rowId]: suggestedSatuan }));
      setCustomGramInputs((c) => ({ ...c, [currentRow.rowId]: suggestedGram }));
      setPotongPerUnitInputs((p) => ({ ...p, [currentRow.rowId]: suggestedPotong }));

      const isGrosir = SATUAN_LIST.find((s) => s.value === suggestedSatuan)?.isDiscrete;

      // Nilai Gramasi Kotor (Gram/Porsi) HARUS selalu menunjukkan berat PER 1 PORSI
      let targetGramasi: number | "" = currentRow.gramasi_kotor;
      if (isGrosir) {
        targetGramasi = suggestedGram;
      } else {
        const currentJumlah = jumlahBahanInputs[currentRow.rowId];
        if (currentJumlah && parseFloat(currentJumlah) > 0) {
          const totalGram = parseFloat(currentJumlah) * suggestedGram;
          const safePorsi = Math.max(1, porsi || 1);
          targetGramasi = Math.round((totalGram / safePorsi) * 100) / 100;
        }
      }

      const calcs = calculateRowValues(bahan, targetGramasi);
      next[index] = {
        ...currentRow,
        bahan,
        gramasi_kotor: targetGramasi,
        ...calcs,
      };

      return next;
    });
  };

  // Handler: Update Gramasi Kotor pada Baris Tertentu
  const handleGramasiChange = (index: number, rowId: string, val: string) => {
    const numericVal = val === "" ? "" : Math.max(0, parseFloat(val) || 0);
    setRows((prev) => {
      const next = [...prev];
      const currentRow = next[index];
      const calcs = calculateRowValues(currentRow.bahan, numericVal);
      next[index] = {
        ...currentRow,
        gramasi_kotor: numericVal,
        ...calcs,
      };
      return next;
    });
  };

  // Handler: Hitung gramasi dari jumlah bahan dibeli
  // Jika grosir (kotak, pcs, dll): Gramasi kotor tetap gram_per_pcs per porsi (misal 50g), BUKAN total belanja!
  const handleJumlahBahanChange = (
    rowId: string,
    rowIndex: number,
    val: string,
    satuan: string,
    customGramVal?: number,
    customPotongVal?: number
  ) => {
    setJumlahBahanInputs((prev) => ({ ...prev, [rowId]: val }));
    const num = parseFloat(val);
    const currentBahan = rows[rowIndex]?.bahan;
    const isGrosir = SATUAN_LIST.find((s) => s.value === satuan)?.isDiscrete;

    if (isGrosir) {
      // Nilai Gramasi Kotor (Gram/Porsi) HARUS selalu menunjukkan berat PER 1 PORSI (default 50g untuk tahu)
      const gramPerPcs =
        customGramVal ??
        customGramInputs[rowId] ??
        getGramPerUnit(satuan, currentBahan?.nama_bahan);

      setRows((prev) => {
        const next = [...prev];
        const currentRow = next[rowIndex];
        const calcs = calculateRowValues(currentRow.bahan, gramPerPcs);
        next[rowIndex] = {
          ...currentRow,
          gramasi_kotor: gramPerPcs,
          ...calcs,
        };
        return next;
      });
    } else {
      // Satuan massa standar (kg, gram, liter, ml)
      if (!val || isNaN(num) || num <= 0) return;
      const gramPerUnit = getGramPerUnit(satuan, currentBahan?.nama_bahan);
      const totalGram = num * gramPerUnit;
      const safePorsi = Math.max(1, porsi || 1);
      const gramasiPerPorsi = totalGram / safePorsi;

      setRows((prev) => {
        const next = [...prev];
        const currentRow = next[rowIndex];
        const calcs = calculateRowValues(currentRow.bahan, gramasiPerPorsi);
        next[rowIndex] = {
          ...currentRow,
          gramasi_kotor: Math.round(gramasiPerPorsi * 100) / 100,
          ...calcs,
        };
        return next;
      });
    }
  };

  const handleSatuanChange = (rowId: string, rowIndex: number, newSatuan: string) => {
    setSatuanInputs((prev) => ({ ...prev, [rowId]: newSatuan }));
    const currentBahan = rows[rowIndex]?.bahan;
    const isGrosir = SATUAN_LIST.find((s) => s.value === newSatuan)?.isDiscrete;

    let defaultGram = getGramPerUnit(newSatuan, currentBahan?.nama_bahan);
    let defaultPotong = newSatuan === "kotak" ? 6 : 1;

    setCustomGramInputs((prev) => ({ ...prev, [rowId]: defaultGram }));
    setPotongPerUnitInputs((prev) => ({ ...prev, [rowId]: defaultPotong }));

    const currentJumlah = jumlahBahanInputs[rowId];
    handleJumlahBahanChange(rowId, rowIndex, currentJumlah || "", newSatuan, defaultGram, defaultPotong);
  };

  const handleCustomGramChange = (rowId: string, rowIndex: number, newGram: number) => {
    setCustomGramInputs((prev) => ({ ...prev, [rowId]: newGram }));
    const currentJumlah = jumlahBahanInputs[rowId];
    const currentSatuan = satuanInputs[rowId] ?? "kg";
    handleJumlahBahanChange(rowId, rowIndex, currentJumlah || "", currentSatuan, newGram);
  };

  // Handler: Tambah Baris Baru
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: "row-" + Date.now() + "-" + (prev.length + 1),
        bahan: null,
        gramasi_kotor: "",
        berat_bersih: 0,
        kalori: 0,
        protein: 0,
        lemak: 0,
        karbo: 0,
        biaya: 0,
      },
    ]);
  };

  // Handler: Hapus Baris
  const handleRemoveRow = (index: number) => {
    setRows((prev) => {
      if (prev.length === 1) {
        // Jika tinggal 1 baris, reset saja
        return [
          {
            rowId: "row-" + Date.now() + "-1",
            bahan: null,
            gramasi_kotor: "",
            berat_bersih: 0,
            kalori: 0,
            protein: 0,
            lemak: 0,
            karbo: 0,
            biaya: 0,
          },
        ];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // 3. Kalkulasi Ringkasan Nutrisi & HPP (Reactive Summary)
  const summary = useMemo(() => {
    let totalGramasiKotor = 0;
    let totalBeratBersih = 0;
    let totalKalori = 0;
    let totalProtein = 0;
    let totalLemak = 0;
    let totalKarbo = 0;
    let totalHpp = 0;

    rows.forEach((r) => {
      totalGramasiKotor += typeof r.gramasi_kotor === "number" ? r.gramasi_kotor : 0;
      totalBeratBersih += r.berat_bersih;
      totalKalori += r.kalori;
      totalProtein += r.protein;
      totalLemak += r.lemak;
      totalKarbo += r.karbo;
      totalHpp += r.biaya;
    });

    const safePorsi = Math.max(1, porsi || 1);

    return {
      totalGramasiKotor,
      totalBeratBersih,
      totalKalori,
      totalProtein,
      totalLemak,
      totalKarbo,
      totalHpp,
      kaloriPerPorsi: totalKalori / safePorsi,
      proteinPerPorsi: totalProtein / safePorsi,
      lemakPerPorsi: totalLemak / safePorsi,
      karboPerPorsi: totalKarbo / safePorsi,
      hppPerPorsi: totalHpp / safePorsi,
    };
  }, [rows, porsi]);

  // Handler: Reset Form Resep
  const handleResetForm = () => {
    setEditingResepId(null);
    setNamaResep("");
    setKategori("Lauk Hewani");
    setPorsi(1);
    setDeskripsi("");
    setRows([
      {
        rowId: "row-" + Date.now() + "-1",
        bahan: null,
        gramasi_kotor: "",
        berat_bersih: 0,
        kalori: 0,
        protein: 0,
        lemak: 0,
        karbo: 0,
        biaya: 0,
      },
    ]);
    setJumlahBahanInputs({});
    setSatuanInputs({});
    setCustomGramInputs({});
    setPotongPerUnitInputs({});
    setShowCustomGramInputs({});
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Handler: Muat resep yang dipilih dari Modal
  const handleSelectRecipeFromModal = (recipe: any) => {
    setEditingResepId(recipe.id);
    setNamaResep(recipe.nama_resep || "");
    setKategori(recipe.kategori || "Lainnya");
    setPorsi(recipe.porsi || 1);
    setDeskripsi(recipe.deskripsi || "");

    if (Array.isArray(recipe.komposisi) && recipe.komposisi.length > 0) {
      const loadedRows: ResepRowItem[] = recipe.komposisi.map((k: any, idx: number) => {
        const bahan: MasterBahanTKPI = k.bahan_tkpi || {
          id: k.bahan_tkpi_id,
          kode_tkpi: k.bahan_tkpi_id || `TKPI-${idx + 1}`,
          nama_bahan: k.nama_bahan,
          bdd_persen: k.bdd_persen ?? 100,
          harga_estimasi_per_kg: k.gramasi_kotor > 0 ? (k.harga / k.gramasi_kotor) * 1000 : 0,
          energi_kcal: k.berat_bersih > 0 ? (k.kalori / k.berat_bersih) * 100 : 0,
          protein_g: k.berat_bersih > 0 ? (k.protein / k.berat_bersih) * 100 : 0,
          lemak_g: k.berat_bersih > 0 ? (k.lemak / k.berat_bersih) * 100 : 0,
          karbo_g: k.berat_bersih > 0 ? (k.karbo / k.berat_bersih) * 100 : 0,
        };

        return {
          rowId: "row-" + Date.now() + "-" + idx,
          bahan,
          gramasi_kotor: k.gramasi_kotor,
          berat_bersih: k.berat_bersih,
          kalori: k.kalori,
          protein: k.protein,
          lemak: k.lemak,
          karbo: k.karbo,
          biaya: k.harga,
        };
      });

      setRows(loadedRows);
    }

    setSaveSuccess(`Resep "${recipe.nama_resep}" berhasil dimuat ke editor.`);
    setSaveError(null);
  };

  const handleCreateNewRecipe = () => {
    handleResetForm();
  };

  // Handler: Simpan / Update Resep
  const handleSaveResep = async (mode: "save" | "duplicate" = "save") => {
    setSaveError(null);
    setSaveSuccess(null);

    // Validasi dasar
    if (!namaResep.trim()) {
      setSaveError("Nama resep wajib diisi sebelum menyimpan.");
      return;
    }

    const validRows = rows.filter(
      (r) => r.bahan && typeof r.gramasi_kotor === "number" && r.gramasi_kotor > 0
    );

    if (validRows.length === 0) {
      setSaveError("Pilih minimal 1 bahan makanan TKPI dan tentukan gramasi kotornya.");
      return;
    }

    try {
      setIsSaving(true);
      const safePorsi = Math.max(1, porsi || 1);

      const targetNama = mode === "duplicate" ? `${namaResep.trim()} (Salinan)` : namaResep.trim();

      const payload = {
        nama_resep: targetNama,
        kategori: kategori,
        deskripsi: deskripsi.trim() || null,
        porsi: safePorsi,
        total_kalori: Number(summary.totalKalori.toFixed(2)),
        total_protein: Number(summary.totalProtein.toFixed(2)),
        total_lemak: Number(summary.totalLemak.toFixed(2)),
        total_karbo: Number(summary.totalKarbo.toFixed(2)),
        total_hpp: Math.round(summary.totalHpp),
        hpp_per_porsi: Math.round(summary.hppPerPorsi),
        komposisi: validRows.map((r) => ({
          bahan_tkpi_id: r.bahan?.id || null,
          bahan_id: r.bahan?.kode_tkpi || r.bahan?.id || null,
          nama_bahan: r.bahan?.nama_bahan || "Bahan Makanan",
          gramasi_kotor: Number(r.gramasi_kotor),
          bdd_persen: Number(r.bahan?.bdd_persen || 100),
          berat_bersih: Number(r.berat_bersih.toFixed(2)),
          kalori: Number(r.kalori.toFixed(2)),
          protein: Number(r.protein.toFixed(2)),
          lemak: Number(r.lemak.toFixed(2)),
          karbo: Number(r.karbo.toFixed(2)),
          harga: Math.round(r.biaya),
        })),
      };

      const isUpdating = editingResepId && mode === "save";
      const endpoint = isUpdating ? `/api/resep/${editingResepId}` : "/api/resep";
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Gagal menyimpan resep ke Supabase.");
      }

      if (isUpdating) {
        setSaveSuccess(`Resep "${payload.nama_resep}" berhasil diperbarui!`);
      } else {
        if (mode === "duplicate") {
          setNamaResep(payload.nama_resep);
          setEditingResepId(result.resep?.id || null);
          setSaveSuccess(
            `Resep "${payload.nama_resep}" berhasil diduplikasi dan disimpan sebagai resep baru!`
          );
        } else {
          setEditingResepId(result.resep?.id || null);
          setSaveSuccess(
            `Resep "${namaResep}" beserta ${validRows.length} komposisi bahan berhasil disimpan ke tabel Supabase!`
          );
        }
      }
    } catch (err: any) {
      console.error("Gagal menyimpan resep:", err);
      setSaveError(err.message || "Terjadi kesalahan saat menyimpan resep.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Top Header Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 transition-colors">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                  <ChefHat className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Recipe Builder
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                >
                  Terhubung ke public.master_bahan_tkpi
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800"
                >
                  Auto BDD & Gizi Engine
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pilih bahan pangan dari master TKPI menggunakan autocomplete, tentukan gramasi kotor, dan sistem otomatis menghitung BDD, kalori, protein, lemak, karbohidrat, dan estimasi biaya resep secara real-time.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => setIsLoadModalOpen(true)}
                size="sm"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Buka Resep Tersimpan</span>
              </Button>

              <Link href="/master-data">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Database className="h-4 w-4" />
                  <span>Master TKPI</span>
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                className="gap-1.5 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Form</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mode Update Resep Banner */}
        {editingResepId && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs text-indigo-900 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm">
                <ChefHat className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Mode Edit: {namaResep}
                  </span>
                  <Badge className="bg-indigo-600 text-white text-[10px] py-0">
                    Resep Sudah Dibuat
                  </Badge>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Klik <strong>Perbarui Resep</strong> untuk memperbarui data ini di database, atau simpan sebagai salinan baru.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNewRecipe}
              className="gap-1.5 shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Resep Baru</span>
            </Button>
          </div>
        )}

        {/* Notifikasi Alert */}
        {saveSuccess && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-900 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in duration-150">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Resep Berhasil Disimpan!</p>
              <p className="text-emerald-800 dark:text-emerald-300">{saveSuccess}</p>
            </div>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 animate-in fade-in duration-150">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Gagal Menyimpan Resep</p>
              <p className="text-red-800 dark:text-red-300">{saveError}</p>
            </div>
          </div>
        )}

        {/* Grid 2 Kolom: Kiri (Form Header + Multi-Bahan), Kanan (Ringkasan Reaktif) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Kolom Kiri: Form Input Resep & Multi-Bahan (8 Kolom) */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Card Informasi Resep */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 transition-colors">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Informasi Resep</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Nama Resep */}
                <div className="sm:col-span-6 space-y-1.5">
                  <Label htmlFor="nama_resep">Nama Resep / Menu *</Label>
                  <Input
                    id="nama_resep"
                    placeholder="Contoh: Ayam Goreng Lengkuas, Sop Sayur..."
                    value={namaResep}
                    onChange={(e) => setNamaResep(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Kategori */}
                <div className="sm:col-span-4 space-y-1.5">
                  <Label htmlFor="kategori">Kategori</Label>
                  <select
                    id="kategori"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {KATEGORI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Porsi */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="porsi">Porsi</Label>
                  <Input
                    id="porsi"
                    type="number"
                    min={1}
                    value={porsi}
                    onChange={(e) => setPorsi(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10 text-sm text-center"
                  />
                </div>

                {/* Deskripsi */}
                <div className="sm:col-span-12 space-y-1.5">
                  <Label htmlFor="deskripsi">Petunjuk Masak / Catatan (Opsional)</Label>
                  <textarea
                    id="deskripsi"
                    rows={2}
                    placeholder="Tuliskan catatan proses pengolahan, suhu, atau cara penyajian..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* 2. Card Form Dinamis Multi-Bahan */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Komposisi Bahan Resep</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ketik nama bahan untuk mencari di Master TKPI, tentukan berat kotor (gram).
                  </p>
                </div>

                <Button
                  onClick={handleAddRow}
                  size="sm"
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Baris</span>
                </Button>
              </div>

              {/* Daftar Baris Bahan */}
              <div className="space-y-4">
                {rows.map((row, index) => (
                  <div
                    key={row.rowId}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-emerald-200 dark:hover:border-emerald-900/60"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {row.bahan ? row.bahan.nama_bahan : "Pilih Bahan Pangan"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                        title="Hapus Baris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Baris 1: Autocomplete TKPI */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                          Pencarian Bahan (Autocomplete TKPI)
                        </Label>
                        <TKPICombobox
                          selectedItem={row.bahan}
                          onSelect={(selectedBahan) => handleSelectBahan(index, selectedBahan)}
                          placeholder="Ketik nama bahan (contoh: Ayam, Beras, Bayam)..."
                        />
                      </div>

                      {/* Baris 2: Gramasi Kotor + Jumlah Bahan Dibeli */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        {/* Gramasi Kotor */}
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>Gramasi Kotor</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">(Gram/Porsi)</span>
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              placeholder="0"
                              value={row.gramasi_kotor}
                              onChange={(e) => handleGramasiChange(index, row.rowId, e.target.value)}
                              className="h-10 pr-8 font-semibold text-right"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                              g
                            </span>
                          </div>
                        </div>

                        {/* Jumlah Bahan Dibeli */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3 text-violet-500" />
                              Jumlah Bahan Dibeli
                            </Label>

                            {/* Tombol setting bobot jika satuan kemasan / grosir */}
                            {SATUAN_LIST.find((s) => s.value === (satuanInputs[row.rowId] ?? "kg"))?.isDiscrete && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCustomGramInputs((prev) => ({
                                    ...prev,
                                    [row.rowId]: !prev[row.rowId],
                                  }))
                                }
                                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5"
                                title="Sesuaikan potong dan gram per porsi"
                              >
                                <SlidersHorizontal className="h-2.5 w-2.5" />
                                <span>
                                  {potongPerUnitInputs[row.rowId] ?? (satuanInputs[row.rowId] === "kotak" ? 6 : 1)} ptg/{(satuanInputs[row.rowId] ?? "kotak")} • {customGramInputs[row.rowId] ?? getGramPerUnit(satuanInputs[row.rowId] ?? "kotak", row.bahan?.nama_bahan)}g/ptg
                                </span>
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              placeholder={`Contoh: ${(satuanInputs[row.rowId] ?? "kg") === "kotak" ? "323" : (satuanInputs[row.rowId] ?? "kg") === "pcs" ? "5" : "10"}`}
                              value={jumlahBahanInputs[row.rowId] ?? ""}
                              onChange={(e) =>
                                handleJumlahBahanChange(
                                  row.rowId,
                                  index,
                                  e.target.value,
                                  satuanInputs[row.rowId] ?? "kg"
                                )
                              }
                              className="h-10 font-semibold flex-1 min-w-0"
                            />
                            <select
                              value={satuanInputs[row.rowId] ?? "kg"}
                              onChange={(e) => handleSatuanChange(row.rowId, index, e.target.value)}
                              className="h-10 w-28 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                            >
                              {SATUAN_LIST.map((opt) => (
                                <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Input Setting Grosir: Potong per Unit & Gram per Potong */}
                          {SATUAN_LIST.find((s) => s.value === (satuanInputs[row.rowId] ?? "kg"))?.isDiscrete && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg bg-violet-50/70 p-2 text-xs border border-violet-200 dark:border-violet-800 dark:bg-violet-950/40">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                                  Potong per {satuanInputs[row.rowId] ?? "kotak"}:
                                </span>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={potongPerUnitInputs[row.rowId] ?? (satuanInputs[row.rowId] === "kotak" ? 6 : 1)}
                                  onChange={(e) => {
                                    const pVal = Math.max(1, parseInt(e.target.value) || 1);
                                    setPotongPerUnitInputs((prev) => ({ ...prev, [row.rowId]: pVal }));
                                    handleJumlahBahanChange(
                                      row.rowId,
                                      index,
                                      jumlahBahanInputs[row.rowId] ?? "",
                                      satuanInputs[row.rowId] ?? "kotak",
                                      customGramInputs[row.rowId],
                                      pVal
                                    );
                                  }}
                                  className="h-6.5 w-16 text-xs px-1 text-center font-bold"
                                />
                                <span className="text-[10px] text-slate-500">potong</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                                  Berat 1 potong:
                                </span>
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={
                                    customGramInputs[row.rowId] ??
                                    getGramPerUnit(
                                      satuanInputs[row.rowId] ?? "kotak",
                                      row.bahan?.nama_bahan
                                    )
                                  }
                                  onChange={(e) => {
                                    const gVal = Math.max(0.1, parseFloat(e.target.value) || 1);
                                    setCustomGramInputs((prev) => ({ ...prev, [row.rowId]: gVal }));
                                    handleJumlahBahanChange(
                                      row.rowId,
                                      index,
                                      jumlahBahanInputs[row.rowId] ?? "",
                                      satuanInputs[row.rowId] ?? "kotak",
                                      gVal,
                                      potongPerUnitInputs[row.rowId]
                                    );
                                  }}
                                  className="h-6.5 w-16 text-xs px-1 text-center font-bold"
                                />
                                <span className="text-[10px] text-slate-500">gram</span>
                              </div>
                            </div>
                          )}

                          {/* Info Helper Preview sesuai rumus user */}
                          {jumlahBahanInputs[row.rowId] && parseFloat(jumlahBahanInputs[row.rowId]) > 0 && (
                            SATUAN_LIST.find((s) => s.value === (satuanInputs[row.rowId] ?? "kg"))?.isDiscrete ? (
                              (() => {
                                const jumlah = parseFloat(jumlahBahanInputs[row.rowId]);
                                const potongPerUnit =
                                  potongPerUnitInputs[row.rowId] ??
                                  (satuanInputs[row.rowId] === "kotak" ? 6 : 1);
                                const gramPerPcs =
                                  customGramInputs[row.rowId] ??
                                  getGramPerUnit(satuanInputs[row.rowId] ?? "kotak", row.bahan?.nama_bahan);
                                const totalPorsi = jumlah * potongPerUnit;
                                const totalKg = (totalPorsi * gramPerPcs) / 1000;
                                const namaBahan = row.bahan?.nama_bahan || "Bahan";

                                return (
                                  <div className="mt-2 rounded-lg bg-emerald-50/90 p-2 text-xs text-emerald-900 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800">
                                    <p className="font-semibold text-[11px] leading-relaxed">
                                      💡 1 Porsi = {gramPerPcs}g (1 potong). Untuk {jumlah} {satuanInputs[row.rowId] ?? "kotak"} ({jumlah} × {potongPerUnit} = {totalPorsi.toLocaleString("id-ID")} porsi), total belanja = {totalKg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg {namaBahan}.
                                    </p>
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1">
                                {jumlahBahanInputs[row.rowId]} {satuanInputs[row.rowId] ?? "kg"} (
                                {(
                                  parseFloat(jumlahBahanInputs[row.rowId]) *
                                  getGramPerUnit(
                                    satuanInputs[row.rowId] ?? "kg",
                                    row.bahan?.nama_bahan
                                  )
                                ).toLocaleString("id-ID")}
                                g) ÷ {Math.max(1, porsi)} porsi →{" "}
                                <strong>
                                  {(
                                    (parseFloat(jumlahBahanInputs[row.rowId]) *
                                      getGramPerUnit(
                                        satuanInputs[row.rowId] ?? "kg",
                                        row.bahan?.nama_bahan
                                      )) /
                                    Math.max(1, porsi)
                                  ).toFixed(1)}{" "}
                                  g/porsi
                                </strong>
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rincian Realtime Kalkulasi Baris */}
                    {row.bahan && (
                      <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">BDD (%)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {row.bahan.bdd_persen}%
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Berat Bersih</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {row.berat_bersih.toFixed(1)} g
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Kalori</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {row.kalori.toFixed(1)} kkal
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Protein</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            {row.protein.toFixed(1)} g
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Harga/kg</span>
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            Rp {Number(row.bahan.harga_estimasi_per_kg || 0).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Est. Biaya</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            Rp {Math.round(row.biaya).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tombol Tambah Baris di Bawah */}
              <div className="mt-4 flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="gap-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Baris Bahan Lainnya</span>
                </Button>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total Bahan: <strong>{rows.filter((r) => r.bahan).length}</strong> / {rows.length}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Panel Ringkasan Reaktif & Simpan Resep (4 Kolom Sticky) */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Ringkasan Nutrisi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Standar porsi: <strong>{porsi} porsi</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Kartu Metrik Nutrisi Utama */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Energi / Kalori */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" /> Energi
                    </span>
                    <span className="text-[10px]">kkal</span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200">
                    {summary.totalKalori.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    {summary.kaloriPerPorsi.toFixed(1)} kkal / porsi
                  </div>
                </div>

                {/* Protein */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" /> Protein
                    </span>
                    <span className="text-[10px]">gram</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">
                    {summary.totalProtein.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                    {summary.proteinPerPorsi.toFixed(1)} g / porsi
                  </div>
                </div>

                {/* Lemak */}
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 mb-1">
                    <span className="font-semibold">Lemak</span>
                    <span className="text-[10px]">gram</span>
                  </div>
                  <div className="text-xl font-extrabold text-rose-900 dark:text-rose-200">
                    {summary.totalLemak.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                    {summary.lemakPerPorsi.toFixed(1)} g / porsi
                  </div>
                </div>

                {/* Karbohidrat */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-3 dark:border-sky-900/60 dark:bg-sky-950/30">
                  <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-400 mb-1">
                    <span className="font-semibold">Karbohidrat</span>
                    <span className="text-[10px]">gram</span>
                  </div>
                  <div className="text-xl font-extrabold text-sky-900 dark:text-sky-200">
                    {summary.totalKarbo.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-sky-700/80 dark:text-sky-400/80 mt-0.5">
                    {summary.karboPerPorsi.toFixed(1)} g / porsi
                  </div>
                </div>
              </div>

              {/* Rincian Berat & Biaya HPP */}
              <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Berat Kotor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {summary.totalGramasiKotor.toFixed(1)} g
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Berat Bersih (BDD):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {summary.totalBeratBersih.toFixed(1)} g
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Total HPP Resep:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Rp {Math.round(summary.totalHpp).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>HPP per Porsi ({porsi} Porsi):</span>
                  <span className="text-base">
                    Rp {Math.round(summary.hppPerPorsi).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Tombol Simpan / Update Resep */}
              <div className="mt-6 space-y-2.5">
                {editingResepId ? (
                  <>
                    <Button
                      onClick={() => handleSaveResep("save")}
                      disabled={isSaving}
                      className="w-full h-11 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-600/20 text-sm font-bold"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Memperbarui ke Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Perbarui Resep Ini (Update)</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveResep("duplicate")}
                      disabled={isSaving}
                      className="w-full h-10 gap-2 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Simpan Sebagai Resep Baru (Duplikat)</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleSaveResep("save")}
                    disabled={isSaving}
                    className="w-full h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm font-bold"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Menyimpan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Simpan Resep ke Supabase</span>
                      </>
                    )}
                  </Button>
                )}

                <p className="text-center text-[11px] text-slate-400">
                  Data otomatis tersimpan ke tabel <code>resep</code> dan <code>resep_komposisi</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Modal Buka & Pilih Resep Tersimpan */}
      <SavedRecipesModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onSelectRecipe={handleSelectRecipeFromModal}
        currentRecipeId={editingResepId}
      />
    </div>
  );
}
