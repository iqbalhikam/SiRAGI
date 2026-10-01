"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Check, Utensils, X } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { MasterBahanTKPI } from "@/types/tkpi";

interface TKPIComboboxProps {
  onSelect: (item: MasterBahanTKPI) => void;
  selectedItem?: MasterBahanTKPI | null;
  placeholder?: string;
  disabled?: boolean;
}

export function TKPICombobox({
  onSelect,
  selectedItem,
  placeholder = "Ketik untuk mencari bahan makanan TKPI...",
  disabled = false,
}: TKPIComboboxProps) {
  const [query, setQuery] = useState(selectedItem?.nama_bahan || "");
  const [results, setResults] = useState<MasterBahanTKPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi saat selectedItem berubah dari luar
  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem.nama_bahan);
    }
  }, [selectedItem]);

  // Debounced search query ke tabel public.master_bahan_tkpi
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let queryBuilder = supabase
          .from("master_bahan_tkpi")
          .select("*")
          .order("nama_bahan", { ascending: true })
          .limit(15);

        if (query.trim()) {
          queryBuilder = queryBuilder.ilike("nama_bahan", `%${query.trim()}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) {
          console.error("Error querying master_bahan_tkpi:", error);
          setResults([]);
        } else {
          setResults((data as MasterBahanTKPI[]) || []);
        }
      } catch (err) {
        console.error("Exception in TKPICombobox:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle Klik di Luar untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // Jika belum ada yang terpilih, reset text ke yang terpilih sebelumnya
        if (selectedItem) {
          setQuery(selectedItem.nama_bahan);
        } else if (!query.trim()) {
          setQuery("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedItem, query]);

  const handleSelect = (item: MasterBahanTKPI) => {
    setQuery(item.nama_bahan);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
    setIsOpen(true);
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 transition-colors"
        />

        {loading ? (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Hasil Pencarian Autocomplete */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-100">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Mencari bahan di tabel master_bahan_tkpi...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Tidak ada bahan yang cocok.
              </p>
              <p className="mt-0.5 text-[11px]">
                Coba gunakan kata kunci lain (misal: Ayam, Beras, Telur, dll).
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {results.map((item, index) => {
                const isSelected = selectedItem?.kode_tkpi === item.kode_tkpi;
                const isHighlighted = selectedIndex === index;

                return (
                  <li
                    key={item.id || item.kode_tkpi}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs cursor-pointer transition ${
                      isHighlighted || isSelected
                        ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.nama_bahan}
                          className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shrink-0">
                          <Utensils className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.nama_bahan}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/60 px-1 rounded">
                            {item.kode_tkpi}
                          </span>
                        </div>

                        {/* Nilai Gizi Ringkas */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{item.energi_kcal} kkal</span>
                          <span>•</span>
                          <span>Prot: {item.protein_g}g</span>
                          {item.lemak_g ? (
                            <>
                              <span>•</span>
                              <span>Lem: {item.lemak_g}g</span>
                            </>
                          ) : null}
                          {item.karbo_g ? (
                            <>
                              <span>•</span>
                              <span>Kar: {item.karbo_g}g</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Kanan: BDD & Estimasi Harga */}
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Rp {Number(item.harga_estimasi_per_kg || 0).toLocaleString("id-ID")}
                        <span className="text-[10px] font-normal text-slate-400">/kg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        BDD: <strong className="text-emerald-600 dark:text-emerald-400">{item.bdd_persen}%</strong>
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 ml-1" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
