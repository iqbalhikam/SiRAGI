"use client";

import React from "react";
import { BahanInput, MenuInput } from "@/types/rab";
import { BahanRow } from "./bahan-row";
import { Plus, Trash2, Utensils, Calendar } from "lucide-react";

interface MenuItemCardProps {
  menu: MenuInput;
  menuIndex: number;
  canDeleteMenu: boolean;
  onUpdateMenuName: (name: string) => void;
  onUpdateTanggal: (tanggal: string) => void;
  onDeleteMenu: () => void;
  onAddBahan: () => void;
  onUpdateBahan: (bahanIndex: number, updated: BahanInput) => void;
  onDeleteBahan: (bahanIndex: number) => void;
}

export function MenuItemCard({
  menu,
  menuIndex,
  canDeleteMenu,
  onUpdateMenuName,
  onUpdateTanggal,
  onDeleteMenu,
  onAddBahan,
  onUpdateBahan,
  onDeleteBahan,
}: MenuItemCardProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header Menu with Tanggal Pelaksanaan Menu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        {/* Menu Icon & Nama Menu */}
        <div className="flex items-center gap-2.5 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <Utensils className="h-4 w-4" />
          </div>
          <div className="flex-1 max-w-sm">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Menu #{menuIndex + 1}
            </label>
            <input
              type="text"
              value={menu.namaMenu}
              onChange={(e) => onUpdateMenuName(e.target.value)}
              placeholder="Contoh: Sayur Sop Daging, Nasi Kuning..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Tanggal Pelaksanaan Menu & Hapus Menu */}
        <div className="flex items-end gap-3">
          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tanggal Pelaksanaan</span>
            </label>
            <input
              type="date"
              value={menu.tanggal || todayStr}
              onChange={(e) => onUpdateTanggal(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="button"
            disabled={!canDeleteMenu}
            onClick={onDeleteMenu}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 h-[34px] ${
              !canDeleteMenu ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Hapus Menu</span>
          </button>
        </div>
      </div>

      {/* Bahan Table Header (Desktop only) */}
      <div className="hidden md:flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span className="w-8">No</span>
        <span className="flex-1">Uraian Bahan</span>
        <span className="w-32">Kuantitas</span>
        <span className="w-32">Satuan</span>
        <span className="flex-1">Keterangan</span>
        <span className="w-8 text-center">Aksi</span>
      </div>

      {/* List of Bahan Rows */}
      <div className="space-y-2.5">
        {menu.bahanList.map((bahan, bIdx) => (
          <BahanRow
            key={bahan.id}
            bahan={bahan}
            index={bIdx}
            canDelete={menu.bahanList.length > 1}
            onChange={(updated) => onUpdateBahan(bIdx, updated)}
            onDelete={() => onDeleteBahan(bIdx)}
          />
        ))}
      </div>

      {/* Add Bahan Button */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Total bahan di menu ini: <span className="font-semibold text-slate-700">{menu.bahanList.length}</span>
        </p>
        <button
          type="button"
          onClick={onAddBahan}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Bahan
        </button>
      </div>
    </div>
  );
}
