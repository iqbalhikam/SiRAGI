"use client";

import React, { useState } from "react";
import { ResepKomposisiItem, BatchConversionResult, calculateItemValues } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BatchCalculatorPopover } from "./batch-calculator-popover";
import { Trash2, Scale, Flame, Beef, Coins, Zap } from "lucide-react";

interface IngredientRowProps {
  item: ResepKomposisiItem;
  index: number;
  canDelete: boolean;
  onChange: (updatedItem: ResepKomposisiItem) => void;
  onDelete: () => void;
}

export function IngredientRow({
  item,
  index,
  canDelete,
  onChange,
  onDelete,
}: IngredientRowProps) {
  // Teks helper konversi batch (ditampilkan sementara setelah user menekan "Terapkan")
  const [batchHelperText, setBatchHelperText] = useState<string | null>(null);

  const handleGramasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const gramasi_kotor = rawVal === "" ? "" : parseFloat(rawVal);

    // Jika user mengubah manual, hapus helper text batch
    setBatchHelperText(null);

    const calculated = calculateItemValues(
      gramasi_kotor,
      item.bdd_persen,
      item.kalori_100g,
      item.protein_100g,
      item.harga_per_kg
    );

    onChange({
      ...item,
      gramasi_kotor,
      berat_bersih: calculated.berat_bersih,
      kalori: calculated.kalori,
      protein: calculated.protein,
      harga: calculated.harga,
    });
  };

  /**
   * Dipanggil oleh BatchCalculatorPopover saat pengguna menekan "Terapkan ke Resep".
   * Menerima BatchConversionResult dengan gramasi_kotor (gram per porsi) dan label konversi.
   */
  const handleBatchApply = (result: BatchConversionResult) => {
    const calculated = calculateItemValues(
      result.gramasi_kotor,
      item.bdd_persen,
      item.kalori_100g,
      item.protein_100g,
      item.harga_per_kg
    );

    onChange({
      ...item,
      gramasi_kotor: result.gramasi_kotor,
      berat_bersih: calculated.berat_bersih,
      kalori: calculated.kalori,
      protein: calculated.protein,
      harga: calculated.harga,
    });

    // Tampilkan label konversi di bawah input
    setBatchHelperText(`💡 Konversi Otomatis: ${result.label}`);
  };

  return (
    <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs">
      {/* Baris Atas: Info Bahan & Tombol Hapus */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {index + 1}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {item.nama_bahan}
          </span>
          {item.kategori && (
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal text-slate-600 dark:text-slate-400">
              {item.kategori}
            </Badge>
          )}
          <Badge
            variant={item.bdd_persen === 100 ? "emerald" : "amber"}
            className="text-[10px] py-0 px-2"
          >
            BDD: {item.bdd_persen}%
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[11px] text-slate-600 dark:text-slate-400">
            Rp {item.harga_per_kg.toLocaleString("id-ID")}/kg
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={!canDelete}
            title={canDelete ? "Hapus bahan ini" : "Minimal 1 bahan"}
            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-500 dark:hover:text-red-400 disabled:opacity-30 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Baris Bawah: Input Gramasi & Kalkulasi Real-Time */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-start">
        {/* Input Gramasi Kotor + Batch Popover */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Gram Kotor (Beli)
          </label>
          <div className="flex gap-1.5 items-center">
            <div className="relative flex-1">
              <Input
                type="number"
                min="0"
                step="any"
                value={item.gramasi_kotor === "" ? "" : item.gramasi_kotor}
                placeholder="0"
                onChange={handleGramasiChange}
                className="pr-7 text-sm font-semibold text-slate-900 dark:text-white"
                required
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
                g
              </span>
            </div>

            {/* Batch Calculator Popover Trigger */}
            <BatchCalculatorPopover
              namaBahan={item.nama_bahan}
              onApply={handleBatchApply}
            />
          </div>

          {/* Text Helper Konversi Batch */}
          {batchHelperText && (
            <div className="mt-1.5 flex items-start gap-1 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 px-2 py-1.5">
              <Zap className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-violet-700 dark:text-violet-300 font-medium leading-snug">
                {batchHelperText}
              </p>
            </div>
          )}
        </div>

        {/* Berat Bersih (Otomatis) */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">
            <Scale className="h-3 w-3 text-teal-600 dark:text-teal-400" />
            <span>Berat Bersih</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {item.berat_bersih.toLocaleString("id-ID")} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">g</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {item.bdd_persen}% dari kotor
          </div>
        </div>

        {/* Kalori Bahan (Otomatis) */}
        <div className="rounded-lg bg-orange-50/60 dark:bg-orange-950/30 p-2 border border-orange-100 dark:border-orange-900/40">
          <div className="flex items-center gap-1 text-[11px] text-orange-700 dark:text-orange-400 font-medium mb-0.5">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>Kalori</span>
          </div>
          <div className="text-sm font-bold text-orange-950 dark:text-orange-300">
            {item.kalori.toLocaleString("id-ID")} <span className="text-xs font-normal text-orange-700 dark:text-orange-400">kkal</span>
          </div>
          <div className="text-[10px] text-orange-600/80 dark:text-orange-400/80 truncate">
            {item.kalori_100g} kkal/100g
          </div>
        </div>

        {/* Protein Bahan (Otomatis) */}
        <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 p-2 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 font-medium mb-0.5">
            <Beef className="h-3 w-3 text-blue-500" />
            <span>Protein</span>
          </div>
          <div className="text-sm font-bold text-blue-950 dark:text-blue-300">
            {item.protein.toLocaleString("id-ID")} <span className="text-xs font-normal text-blue-700 dark:text-blue-400">g</span>
          </div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 truncate">
            {item.protein_100g} g/100g
          </div>
        </div>

        {/* Subtotal Biaya HPP (Otomatis) */}
        <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 p-2 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-400 font-medium mb-0.5">
            <Coins className="h-3 w-3 text-emerald-600" />
            <span>HPP Bahan</span>
          </div>
          <div className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
            Rp {item.harga.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
            Berdasarkan gram kotor
          </div>
        </div>
      </div>
    </div>
  );
}
