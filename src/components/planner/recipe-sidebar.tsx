"use client";

import React, { useState, useMemo } from "react";
import { StandardRecipe, DayOfWeek } from "@/types/menu-planner";
import { DraggableRecipeItem } from "./draggable-recipe-item";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Utensils, Sparkles } from "lucide-react";

interface RecipeSidebarProps {
  recipes: StandardRecipe[];
  onQuickAdd: (recipe: StandardRecipe, day: DayOfWeek) => void;
  isLoading?: boolean;
}

export function RecipeSidebar({
  recipes,
  onQuickAdd,
  isLoading,
}: RecipeSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(recipes.map((r) => r.kategori)));
    return ["Semua", ...unique];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat =
        selectedCategory === "Semua" || r.kategori === selectedCategory;
      const matchSearch =
        !search ||
        r.nama_resep.toLowerCase().includes(search.toLowerCase()) ||
        r.kategori.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [recipes, selectedCategory, search]);


  return (
    <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col h-[740px] transition-colors">
      {/* Sidebar Header */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Resep Standar MBG</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tarik ke kalender hari</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {filteredRecipes.length} Resep
          </Badge>
        </div>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder="Cari menu, lauk, sayur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50/70 dark:bg-slate-800/60"
          />
        </div>

        {/* Category Pills — dibuat dinamis dari data resep yang tersedia */}
        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-2.5 py-0.5 whitespace-nowrap font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white dark:bg-emerald-600 shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Draggable Recipe List */}
      <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-2" />
            Memuat resep standar...
          </div>
        ) : filteredRecipes.length === 0 && recipes.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1.5 px-3">
            <Utensils className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">Belum ada resep tersimpan</p>
            <p className="text-[10px] leading-relaxed">
              Buat resep terlebih dahulu di <span className="font-semibold text-emerald-600 dark:text-emerald-400">Recipe Builder</span>, lalu simpan ke Supabase agar muncul di sini.
            </p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            Tidak ada resep yang sesuai kata kunci.
          </div>

        ) : (
          filteredRecipes.map((recipe) => (
            <DraggableRecipeItem
              key={recipe.id}
              recipe={recipe}
              onQuickAdd={onQuickAdd}
            />
          ))
        )}
      </div>

      {/* Sidebar Quick Tip */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Tips: Drag kartu ke kolom Senin-Jumat atau klik (+) untuk menu instan.</span>
      </div>
    </div>
  );
}
