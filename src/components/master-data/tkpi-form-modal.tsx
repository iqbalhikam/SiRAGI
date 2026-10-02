"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Edit3,
  PlusCircle,
  Database,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MasterBahanTKPI } from "@/types/tkpi";

interface TkpiFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: MasterBahanTKPI | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CATEGORIES = [
  "Serealia",
  "Daging & Unggas",
  "Ikan & Hasil Laut",
  "Telur",
  "Sayuran",
  "Buah-buahan",
  "Kacang-kacangan",
  "Susu & Olahan",
  "Minyak & Lemak",
  "Bumbu & Rempah",
  "Lainnya",
];

export function TkpiFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSuccess,
}: TkpiFormModalProps) {
  const [formData, setFormData] = useState({
    kode_tkpi: "",
    nama_bahan: "",
    kategori: "Sayuran",
    bdd_persen: 100,
    harga_estimasi_per_kg: 0,
    image_url: "",
    energi_kcal: 0,
    protein_g: 0,
    lemak_g: 0,
    karbo_g: 0,
    serat_g: 0,
    besi_fe_mg: 0,
    kalsium_ca_mg: 0,
    zink_zn_mg: 0,
    vit_a_mcg: 0,
    vit_c_mg: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          kode_tkpi: initialData.kode_tkpi || "",
          nama_bahan: initialData.nama_bahan || "",
          kategori: initialData.kategori || "Lainnya",
          bdd_persen: initialData.bdd_persen ?? 100,
          harga_estimasi_per_kg: initialData.harga_estimasi_per_kg ?? 0,
          image_url: initialData.image_url || initialData.image || "",
          energi_kcal: initialData.energi_kcal ?? 0,
          protein_g: initialData.protein_g ?? 0,
          lemak_g: initialData.lemak_g ?? 0,
          karbo_g: initialData.karbo_g ?? 0,
          serat_g: initialData.serat_g ?? 0,
          besi_fe_mg: initialData.besi_fe_mg ?? 0,
          kalsium_ca_mg: initialData.kalsium_ca_mg ?? 0,
          zink_zn_mg: initialData.zink_zn_mg ?? 0,
          vit_a_mcg: initialData.vit_a_mcg ?? 0,
          vit_c_mg: initialData.vit_c_mg ?? 0,
        });
      } else {
        // Auto-generate suggested code
        const randomCode = `TKPI-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({
          kode_tkpi: randomCode,
          nama_bahan: "",
          kategori: "Sayuran",
          bdd_persen: 100,
          harga_estimasi_per_kg: 0,
          image_url: "",
          energi_kcal: 0,
          protein_g: 0,
          lemak_g: 0,
          karbo_g: 0,
          serat_g: 0,
          besi_fe_mg: 0,
          kalsium_ca_mg: 0,
          zink_zn_mg: 0,
          vit_a_mcg: 0,
          vit_c_mg: 0,
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    setFormData((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.kode_tkpi.trim()) {
      setErrorMsg("Kode TKPI wajib diisi.");
      return;
    }
    if (!formData.nama_bahan.trim()) {
      setErrorMsg("Nama Bahan wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const res = await fetch("/api/import-tkpi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                ...formData,
                kode_tkpi: formData.kode_tkpi.trim(),
                nama_bahan: formData.nama_bahan.trim(),
              },
            ],
          }),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Gagal menambahkan bahan TKPI.");
        }
      } else {
        // Edit mode
        if (!initialData?.id) {
          throw new Error("ID bahan tidak valid untuk diupdate.");
        }
        const res = await fetch(`/api/import-tkpi/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            kode_tkpi: formData.kode_tkpi.trim(),
            nama_bahan: formData.nama_bahan.trim(),
          }),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Gagal memperbarui data bahan.");
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Form submit error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                mode === "create"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300"
              }`}
            >
              {mode === "create" ? (
                <PlusCircle className="h-5 w-5" />
              ) : (
                <Edit3 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === "create"
                  ? "Tambah Bahan TKPI Manual"
                  : "Edit Bahan Master TKPI"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === "create"
                  ? "Input data bahan makanan baru beserta kandungan gizi dan estimasi harga."
                  : `Memperbarui data bahan: ${initialData?.nama_bahan || ""}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            {/* SECTION 1: Informasi Dasar */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  1
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Informasi Dasar & Spesifikasi
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Kode TKPI */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kode TKPI <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.kode_tkpi}
                    onChange={(e) => handleInputChange("kode_tkpi", e.target.value)}
                    placeholder="Contoh: BD001"
                    className="h-9 font-mono text-xs uppercase"
                    required
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Kode unik bahan pangan dalam database.
                  </p>
                </div>

                {/* Nama Bahan */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Bahan Makanan <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.nama_bahan}
                    onChange={(e) => handleInputChange("nama_bahan", e.target.value)}
                    placeholder="Contoh: Beras Giling, Daging Ayam Segar, Bayam Segar"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Bahan
                  </label>
                  <div className="relative">
                    <input
                      list="categories-list"
                      value={formData.kategori}
                      onChange={(e) => handleInputChange("kategori", e.target.value)}
                      placeholder="Pilih atau ketik kategori..."
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-2xs transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <datalist id="categories-list">
                      {COMMON_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* BDD (%) */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    BDD (%) - Berat Dapat Dimakan
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={0.1}
                      value={formData.bdd_persen}
                      onChange={(e) => handleNumberChange("bdd_persen", e.target.value)}
                      className="h-9 pr-8 text-xs font-medium"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Harga Estimasi / kg */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Harga Estimasi / kg (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      value={formData.harga_estimasi_per_kg}
                      onChange={(e) =>
                        handleNumberChange("harga_estimasi_per_kg", e.target.value)
                      }
                      className="h-9 pl-9 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    URL Foto Bahan (Opsional)
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={formData.image_url}
                        onChange={(e) => handleInputChange("image_url", e.target.value)}
                        placeholder="https://images.unsplash.com/... atau URL gambar web"
                        className="h-9 pl-9 text-xs"
                      />
                    </div>
                    {formData.image_url ? (
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                        <img
                          src={formData.image_url}
                          alt="preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Kandungan Gizi */}
            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    2
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Kandungan Gizi (per 100g Bagian Dapat Dimakan)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Standar TKPI Kemenkes RI</span>
              </div>

              {/* Makronutrien Card */}
              <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="mb-3 block text-[11px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  Makronutrien Utama
                </span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Energi (kkal)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.energi_kcal}
                      onChange={(e) => handleNumberChange("energi_kcal", e.target.value)}
                      className="h-8.5 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Protein (g)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.protein_g}
                      onChange={(e) => handleNumberChange("protein_g", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Lemak (g)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.lemak_g}
                      onChange={(e) => handleNumberChange("lemak_g", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Karbohidrat (g)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.karbo_g}
                      onChange={(e) => handleNumberChange("karbo_g", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Serat (g)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.serat_g}
                      onChange={(e) => handleNumberChange("serat_g", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Mikronutrien Card */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="mb-3 block text-[11px] font-semibold tracking-wider uppercase text-blue-700 dark:text-blue-400">
                  Mineral & Vitamin
                </span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Besi Fe (mg)
                    </label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      value={formData.besi_fe_mg}
                      onChange={(e) => handleNumberChange("besi_fe_mg", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Kalsium Ca (mg)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.kalsium_ca_mg}
                      onChange={(e) => handleNumberChange("kalsium_ca_mg", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Zink Zn (mg)
                    </label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      value={formData.zink_zn_mg}
                      onChange={(e) => handleNumberChange("zink_zn_mg", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Vit A (mcg)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.vit_a_mcg}
                      onChange={(e) => handleNumberChange("vit_a_mcg", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Vit C (mg)
                    </label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={formData.vit_c_mg}
                      onChange={(e) => handleNumberChange("vit_c_mg", e.target.value)}
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-[11px] text-slate-400">
              * Pastikan data sesuai dengan standar komposisi pangan.
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : mode === "create" ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Simpan Bahan Baru</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Perbarui Data</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
