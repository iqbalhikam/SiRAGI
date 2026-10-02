"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  BookOpen,
  ChefHat,
  Trash2,
  Calendar,
  Flame,
  Activity,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: any) => void;
  currentRecipeId?: string | null;
}

export function SavedRecipesModal({
  isOpen,
  onClose,
  onSelectRecipe,
  currentRecipeId,
}: SavedRecipesModalProps) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resep?limit=100&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecipes(data.data);
      }
    } catch (err) {
      console.error("Gagal memuat resep:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
    }
  }, [isOpen, search]);

  const handleDelete = async (e: React.MouseEvent, id: string, nama: string) => {
    e.stopPropagation();
    if (!confirm(`Hapus resep "${nama}" secara permanen?`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/resep/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(result.error || "Gagal menghapus resep.");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus resep.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Buka & Update Resep Tersimpan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih resep yang telah dibuat untuk diedit di Recipe Builder.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama resep..."
              className="h-9 pl-9 text-xs"
            />
          </div>
        </div>

        {/* Recipes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">Memuat daftar resep...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
              <ChefHat className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Belum Ada Resep Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {search
                  ? `Tidak ada resep dengan kata kunci "${search}".`
                  : "Buat resep baru di Recipe Builder dan simpan ke Supabase."}
              </p>
            </div>
          ) : (
            recipes.map((recipe) => {
              const isCurrent = currentRecipeId === recipe.id;
              const dateStr = new Date(recipe.updated_at || recipe.created_at).toLocaleDateString(
                "id-ID",
                { day: "numeric", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    onSelectRecipe(recipe);
                    onClose();
                  }}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 cursor-pointer transition hover:border-emerald-500 hover:shadow-xs ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-600 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {recipe.nama_resep}
                      </span>
                      {recipe.kategori && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-2 text-slate-600 dark:text-slate-400"
                        >
                          {recipe.kategori}
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0">
                          Sedang Dibuka
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-slate-400" />
                        {recipe.komposisi?.length || 0} bahan
                      </span>
                      <span>•</span>
                      <span>{recipe.porsi} porsi</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Rp {Number(recipe.hpp_per_porsi || 0).toLocaleString("id-ID")} / porsi
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {dateStr}
                      </span>
                    </div>

                    {/* Quick Nutrisi Badges */}
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        <Flame className="h-2.5 w-2.5" />
                        {recipe.porsi > 0
                          ? (recipe.total_kalori / recipe.porsi).toFixed(0)
                          : recipe.total_kalori}{" "}
                        kkal
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <Activity className="h-2.5 w-2.5" />
                        {recipe.porsi > 0
                          ? (recipe.total_protein / recipe.porsi).toFixed(1)
                          : recipe.total_protein}
                        g protein
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      <span>Pilih & Edit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, recipe.id, recipe.nama_resep)}
                      disabled={deletingId === recipe.id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                      title="Hapus resep ini"
                    >
                      {deletingId === recipe.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
