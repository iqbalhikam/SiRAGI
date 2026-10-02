"use client";

import React, { useState, useEffect } from "react";
import { ResepKomposisiItem, calculateItemValues } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Scale, Flame, Beef, Coins, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { SATUAN_LIST, getGramPerUnit } from "@/lib/satuan-converter";

interface IngredientRowProps {
  item: ResepKomposisiItem;
  index: number;
  canDelete: boolean;
  /** Jumlah porsi dari header resep — digunakan untuk menghitung gramasi per porsi */
  porsi: number;
  onChange: (updatedItem: ResepKomposisiItem) => void;
  onDelete: () => void;
}

export function IngredientRow({
  item,
  index,
  canDelete,
  porsi,
  onChange,
  onDelete,
}: IngredientRowProps) {
  // Cerdas tentukan satuan default berdasarkan nama bahan
  const getInitialSatuan = () => {
    const n = (item.nama_bahan || "").toLowerCase();
    if (n.includes("tahu")) return "kotak";
    if (n.includes("garam")) return "pcs";
    if (n.includes("telur")) return "butir";
    return "kg";
  };

  const [jumlahBahan, setJumlahBahan] = useState<string>("");
  const [satuan, setSatuan] = useState<string>(getInitialSatuan());
  const [customGram, setCustomGram] = useState<number>(() =>
    getGramPerUnit(getInitialSatuan(), item.nama_bahan)
  );
  const [potongPerUnit, setPotongPerUnit] = useState<number>(() =>
    getInitialSatuan() === "kotak" ? 6 : 1
  );
  const [showCustomGramInput, setShowCustomGramInput] = useState<boolean>(false);

  // Perbarui bobot konversi jika satuan atau nama bahan berganti
  const currentUnitConfig = SATUAN_LIST.find((s) => s.value === satuan);
  const isDiscreteUnit = Boolean(currentUnitConfig?.isDiscrete);

  const calculateAndUpdate = (
    valStr: string,
    currentSatuan: string,
    customGramVal: number,
    customPotongVal?: number
  ) => {
    const num = parseFloat(valStr);
    const isGrosir = SATUAN_LIST.find((s) => s.value === currentSatuan)?.isDiscrete;

    if (isGrosir) {
      // Nilai Gramasi Kotor (Gram/Porsi) HARUS selalu menunjukkan berat PER 1 PORSI (default 50g)
      const gramasiPerPorsi = customGramVal;
      const calculated = calculateItemValues(
        gramasiPerPorsi,
        item.bdd_persen,
        item.kalori_100g,
        item.protein_100g,
        item.harga_per_kg
      );

      onChange({
        ...item,
        gramasi_kotor: gramasiPerPorsi,
        berat_bersih: calculated.berat_bersih,
        kalori: calculated.kalori,
        protein: calculated.protein,
        harga: calculated.harga,
      });
    } else {
      if (!valStr || isNaN(num) || num <= 0) return;

      const gramPerUnit = getGramPerUnit(currentSatuan, item.nama_bahan, customGramVal);
      const totalGram = num * gramPerUnit;
      const safePorsi = Math.max(1, porsi || 1);
      const gramasiPerPorsi = totalGram / safePorsi;

      const calculated = calculateItemValues(
        gramasiPerPorsi,
        item.bdd_persen,
        item.kalori_100g,
        item.protein_100g,
        item.harga_per_kg
      );

      onChange({
        ...item,
        gramasi_kotor: Math.round(gramasiPerPorsi * 100) / 100,
        berat_bersih: calculated.berat_bersih,
        kalori: calculated.kalori,
        protein: calculated.protein,
        harga: calculated.harga,
      });
    }
  };

  const handleGramasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const gramasi_kotor = rawVal === "" ? "" : parseFloat(rawVal);

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

  /** Hitung gramasi otomatis dari jumlah bahan yang dibeli */
  const handleJumlahBahanChange = (val: string) => {
    setJumlahBahan(val);
    calculateAndUpdate(val, satuan, customGram, potongPerUnit);
  };

  const handleSatuanChange = (newSatuan: string) => {
    setSatuan(newSatuan);
    const defaultGram = getGramPerUnit(newSatuan, item.nama_bahan);
    const defaultPotong = newSatuan === "kotak" ? 6 : 1;
    setCustomGram(defaultGram);
    setPotongPerUnit(defaultPotong);
    calculateAndUpdate(jumlahBahan, newSatuan, defaultGram, defaultPotong);
  };

  const handleCustomGramChange = (newGram: number) => {
    setCustomGram(newGram);
    calculateAndUpdate(jumlahBahan, satuan, newGram, potongPerUnit);
  };

  const handlePotongPerUnitChange = (newPotong: number) => {
    setPotongPerUnit(newPotong);
    calculateAndUpdate(jumlahBahan, satuan, customGram, newPotong);
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

      {/* Baris Bawah: Input Gramasi + Input Jumlah Bahan + Kalkulasi Real-Time */}
      <div className="mt-3 space-y-2.5">
        {/* Row 1: Gramasi Kotor & Jumlah Bahan Dibeli */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Input Gramasi Kotor (manual) */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Gram Kotor / Porsi
            </label>
            <div className="relative">
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
          </div>

          {/* Input Jumlah Bahan Dibeli → auto-hitung gramasi/porsi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShoppingCart className="h-3 w-3 text-violet-500" />
                Jumlah Bahan Dibeli
              </label>
              {isDiscreteUnit && (
                <button
                  type="button"
                  onClick={() => setShowCustomGramInput(!showCustomGramInput)}
                  className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5"
                  title="Sesuaikan potong dan gram per porsi"
                >
                  <SlidersHorizontal className="h-2.5 w-2.5" />
                  <span>{potongPerUnit} ptg/{satuan} • {customGram}g/ptg</span>
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={jumlahBahan}
                  placeholder={`Contoh: ${satuan === "kotak" ? "323" : satuan === "pcs" ? "5" : "10"}`}
                  onChange={(e) => handleJumlahBahanChange(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>
              <select
                value={satuan}
                onChange={(e) => handleSatuanChange(e.target.value)}
                className="h-9 w-24 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                {SATUAN_LIST.map((opt) => (
                  <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Setting Grosir: Potong per Unit & Gram per Potong */}
            {isDiscreteUnit && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5 rounded-lg bg-violet-50/70 p-2 text-xs border border-violet-200 dark:border-violet-800 dark:bg-violet-950/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                    Potong per {satuan}:
                  </span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={potongPerUnit}
                    onChange={(e) => handlePotongPerUnitChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-6.5 w-14 text-xs px-1 text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500">ptg</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                    Berat 1 ptg:
                  </span>
                  <Input
                    type="number"
                    min="0.1"
                    step="any"
                    value={customGram}
                    onChange={(e) => handleCustomGramChange(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="h-6.5 w-14 text-xs px-1 text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500">gram</span>
                </div>
              </div>
            )}

            {/* Helper Preview Teks */}
            {jumlahBahan && parseFloat(jumlahBahan) > 0 && (
              isDiscreteUnit ? (
                (() => {
                  const jumlah = parseFloat(jumlahBahan);
                  const totalPorsi = jumlah * potongPerUnit;
                  const totalKg = (totalPorsi * customGram) / 1000;

                  return (
                    <div className="mt-2 rounded-lg bg-emerald-50/90 p-2 text-xs text-emerald-900 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800">
                      <p className="font-semibold text-[11px] leading-relaxed">
                        💡 1 Porsi = {customGram}g (1 potong). Untuk {jumlah} {satuan} ({jumlah} × {potongPerUnit} = {totalPorsi.toLocaleString("id-ID")} porsi), total belanja = {totalKg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg {item.nama_bahan}.
                      </p>
                    </div>
                  );
                })()
              ) : (
                <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1 pl-0.5">
                  {jumlahBahan} {satuan} ({(parseFloat(jumlahBahan) * customGram).toLocaleString("id-ID")}g) ÷ {Math.max(1, porsi)} porsi →{" "}
                  <strong>
                    {((parseFloat(jumlahBahan) * customGram) / Math.max(1, porsi)).toFixed(1)} g/porsi
                  </strong>
                </p>
              )
            )}
          </div>
        </div>

        {/* Row 2: Kalkulasi Otomatis */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Berat Bersih */}
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

          {/* Kalori */}
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

          {/* Protein */}
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

          {/* HPP */}
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
    </div>
  );
}
