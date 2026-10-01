"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { StandardRecipe, DayOfWeek } from "@/types/menu-planner";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Flame, Beef, Coins, Plus } from "lucide-react";

interface DraggableRecipeItemProps {
  recipe: StandardRecipe;
  onQuickAdd?: (recipe: StandardRecipe, day: DayOfWeek) => void;
}

export function DraggableRecipeItem({ recipe, onQuickAdd }: DraggableRecipeItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${recipe.id}`,
    data: {
      type: "sidebar-recipe",
      recipe,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const [showQuickDays, setShowQuickDays] = React.useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs select-none ${
        isDragging ? "opacity-40 ring-2 ring-emerald-400 cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-2 flex-1" {...listeners} {...attributes}>
          <div className="mt-0.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-slate-900 dark:text-white text-xs leading-snug line-clamp-1">
              {recipe.nama_resep}
            </h5>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-slate-600 dark:text-slate-400 font-normal">
                {recipe.kategori}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Add Button (Direct Click Option) */}
        {onQuickAdd && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickDays(!showQuickDays)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors cursor-pointer"
              title="Tambah cepat ke hari..."
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            {showQuickDays && (
              <div className="absolute right-0 top-7 z-30 w-32 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Pilih Hari:
                </div>
                {(["senin", "selasa", "rabu", "kamis", "jumat"] as DayOfWeek[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      onQuickAdd(recipe, day);
                      setShowQuickDays(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 capitalize font-medium text-[11px] cursor-pointer"
                  >
                    + {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div
        className="mt-2.5 grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]"
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-1 text-orange-700 dark:text-orange-400">
          <Flame className="h-3 w-3 text-orange-500 shrink-0" />
          <span className="font-bold text-xs">{recipe.kalori}</span>
          <span className="text-[9px] text-orange-600/80 dark:text-orange-400/80">kkal</span>
        </div>
        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
          <Beef className="h-3 w-3 text-blue-500 shrink-0" />
          <span className="font-bold text-xs">{recipe.protein}</span>
          <span className="text-[9px] text-blue-600/80 dark:text-blue-400/80">g</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 justify-end">
          <Coins className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="font-bold text-xs">
            {(recipe.hpp / 1000).toFixed(1)}k
          </span>
        </div>
      </div>
    </div>
  );
}
