"use client";

import React from "react";
import { BahanInput, SATUAN_OPTIONS, SatuanBahan } from "@/types/rab";
import { Trash2 } from "lucide-react";

interface BahanRowProps {
  bahan: BahanInput;
  index: number;
  canDelete: boolean;
  onChange: (updated: BahanInput) => void;
  onDelete: () => void;
}

export function BahanRow({
  bahan,
  index,
  canDelete,
  onChange,
  onDelete,
}: BahanRowProps) {
  return (
    <div className="group relative flex flex-col md:flex-row items-stretch md:items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition-all hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-center gap-2 md:w-8 text-xs font-semibold text-slate-400">
        <span className="hidden md:inline">#{index + 1}</span>
      </div>

      {/* Uraian Bahan */}
      <div className="flex-1">
        <label className="text-[11px] font-medium text-slate-500 md:hidden mb-1 block">
          Uraian Bahan
        </label>
        <input
          type="text"
          value={bahan.uraianBahan}
          onChange={(e) => onChange({ ...bahan, uraianBahan: e.target.value })}
          placeholder="Misal: Beras Premium, Daging Sapi, Wortel..."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          required
        />
      </div>

      {/* Kuantitas (Angka) */}
      <div className="w-full md:w-32">
        <label className="text-[11px] font-medium text-slate-500 md:hidden mb-1 block">
          Kuantitas (Angka)
        </label>
        <input
          type="number"
          step="any"
          min="0"
          value={bahan.kuantitas === "" ? "" : bahan.kuantitas}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...bahan,
              kuantitas: val === "" ? "" : parseFloat(val),
            });
          }}
          placeholder="0.00"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right md:text-left"
          required
        />
      </div>

      {/* Satuan (Dropdown: kg, liter, pcs, pouch, kotak, ball) */}
      <div className="w-full md:w-32">
        <label className="text-[11px] font-medium text-slate-500 md:hidden mb-1 block">
          Satuan
        </label>
        <select
          value={bahan.satuan}
          onChange={(e) =>
            onChange({ ...bahan, satuan: e.target.value as SatuanBahan })
          }
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {SATUAN_OPTIONS.map((sat) => (
            <option key={sat} value={sat}>
              {sat}
            </option>
          ))}
        </select>
      </div>

      {/* Keterangan */}
      <div className="flex-1">
        <label className="text-[11px] font-medium text-slate-500 md:hidden mb-1 block">
          Keterangan (Opsional)
        </label>
        <input
          type="text"
          value={bahan.keterangan}
          onChange={(e) => onChange({ ...bahan, keterangan: e.target.value })}
          placeholder="Misal: Kemasan vacuum, segar, dll."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Delete Bahan Button */}
      <div className="flex items-center justify-end md:justify-center">
        <button
          type="button"
          disabled={!canDelete}
          onClick={onDelete}
          title="Hapus Bahan"
          className={`rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 ${
            !canDelete ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
