"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { DayColumnData, MasterAKG } from "@/types/menu-planner";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Beef,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  PlusCircle,
} from "lucide-react";

interface DayColumnProps {
  day: DayColumnData;
  akg: MasterAKG;
  onRemoveItem: (dayId: string, instanceId: string) => void;
  onClearDay: (dayId: string) => void;
}

export function DayColumn({
  day,
  akg,
  onRemoveItem,
  onClearDay,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    data: {
      type: "day-column",
      dayId: day.id,
    },
  });

  // Calculate totals
  const totalKalori = day.items.reduce((acc, item) => acc + item.recipe.kalori, 0);
  const totalProtein = day.items.reduce((acc, item) => acc + item.recipe.protein, 0);
  const totalHpp = day.items.reduce((acc, item) => acc + item.recipe.hpp, 0);

  // Validation Flags
  const isKaloriUnder = totalKalori < akg.targetKaloriMbg;
  const isHppOver = totalHpp > akg.batasHppMaksimal;
  const hasWarning = day.items.length > 0 && (isKaloriUnder || isHppOver);
  const isValid = day.items.length > 0 && !isKaloriUnder && !isHppOver;

  // Percentages for Progress Bars
  const kaloriPercent = Math.min(100, Math.round((totalKalori / akg.targetKaloriMbg) * 100));

  // Border & Glow styling
  let containerStyles = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700";
  if (isOver) {
    containerStyles = "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-4 ring-emerald-200 dark:ring-emerald-900 shadow-md";
  } else if (hasWarning) {
    containerStyles = "border-2 border-red-500 bg-white dark:bg-slate-900 ring-2 ring-red-400/40 shadow-sm";
  } else if (isValid) {
    containerStyles = "border-2 border-emerald-500 bg-white dark:bg-slate-900 ring-1 ring-emerald-300 dark:ring-emerald-900/50 shadow-xs";
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-all duration-200 ${containerStyles} w-[260px] md:w-[275px] xl:w-auto xl:flex-1 xl:min-w-[245px] shrink-0 overflow-hidden shadow-xs`}
    >
      {/* Header Hari */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight capitalize">
              {day.namaHari}
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{day.subTitle}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isValid && (
              <Badge variant="emerald" className="text-[10px] py-0 px-1.5 font-bold gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Lolos MBG
              </Badge>
            )}
            {hasWarning && (
              <div className="group/warn relative">
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Perlu Koreksi
                </Badge>
              </div>
            )}
            {day.items.length > 0 && (
              <button
                type="button"
                onClick={() => onClearDay(day.id)}
                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition p-1 rounded cursor-pointer"
                title="Kosongkan hari ini"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Progress Bar 1: Kalori */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Flame className="h-3 w-3 text-orange-500" />
              Kalori: <strong className={isKaloriUnder && day.items.length > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}>{totalKalori}</strong>
              <span className="text-slate-400 dark:text-slate-500 font-normal">/{akg.targetKaloriMbg} kkal</span>
            </span>
            <span className={`font-mono text-[10px] font-bold ${isKaloriUnder && day.items.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              {kaloriPercent}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                day.items.length === 0
                  ? "bg-slate-300 dark:bg-slate-700"
                  : isKaloriUnder
                  ? "bg-gradient-to-r from-amber-400 to-red-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (totalKalori / akg.targetKaloriMbg) * 100)}%` }}
            />
          </div>
        </div>

        {/* Real-Time Progress Bar 2: HPP Anggaran */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Coins className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              HPP: <strong className={isHppOver ? "text-red-600 dark:text-red-400 font-bold" : "text-slate-900 dark:text-white"}>Rp {totalHpp.toLocaleString("id-ID")}</strong>
            </span>
            <span className={`font-mono text-[10px] font-bold ${isHppOver ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
              Maks Rp {(akg.batasHppMaksimal / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                day.items.length === 0
                  ? "bg-slate-300 dark:bg-slate-700"
                  : isHppOver
                  ? "bg-red-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (totalHpp / akg.batasHppMaksimal) * 100)}%` }}
            />
          </div>
        </div>

        {/* Tooltip Alert Banner saat terjadi ketidaksesuaian standar MBG */}
        {hasWarning && (
          <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2 text-[11px] text-red-900 dark:text-red-300 space-y-1 animate-in fade-in">
            <div className="font-bold flex items-center gap-1 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Peringatan Standar MBG:
            </div>
            {isKaloriUnder && (
              <p className="leading-tight">
                • Kalori belum mencapai 30% AKG ({totalKalori} kkal &lt; {akg.targetKaloriMbg} kkal). Tambahkan makanan pokok / lauk.
              </p>
            )}
            {isHppOver && (
              <p className="leading-tight">
                • Biaya melebihi batas anggaran Rp {akg.batasHppMaksimal.toLocaleString("id-ID")} (Lebih Rp {(totalHpp - akg.batasHppMaksimal).toLocaleString("id-ID")}).
              </p>
            )}
          </div>
        )}
      </div>

      {/* Daftar Resep pada Hari Tersebut */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[220px]">
        {day.items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center text-slate-400 dark:text-slate-500">
            <PlusCircle className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tarik Resep ke Sini</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Drag dari sidebar kiri atau klik tombol (+)
            </p>
          </div>
        ) : (
          day.items.map((item, idx) => (
            <div
              key={item.instanceId}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2.5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs line-clamp-1">
                      {item.recipe.nama_resep}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="text-orange-700 dark:text-orange-400 font-medium">{item.recipe.kalori} kkal</span>
                    <span>•</span>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">{item.recipe.protein}g P</span>
                    <span>•</span>
                    <span className="text-emerald-800 dark:text-emerald-400 font-semibold">
                      Rp {item.recipe.hpp.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(day.id, item.instanceId)}
                  className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-1 transition cursor-pointer"
                  title="Hapus menu dari hari ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info Kolom */}
      <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Beef className="h-3 w-3 text-blue-500" />
          Prot: <strong>{Math.round(totalProtein * 10) / 10}g</strong>
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {day.items.length} Menu
        </span>
      </div>
    </div>
  );
}
