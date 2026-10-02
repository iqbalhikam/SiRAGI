"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  DayColumnData,
  DayOfWeek,
  MasterAKG,
  StandardRecipe,
  TARGET_AKG_PRESETS,
} from "@/types/menu-planner";
import { RecipeSidebar } from "./recipe-sidebar";
import { DayColumn } from "./day-column";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/utils/supabase/client";

const INITIAL_DAYS: DayColumnData[] = [
  {
    id: "senin",
    namaHari: "Senin",
    subTitle: "Hari ke-1",
    items: [],
  },
  {
    id: "selasa",
    namaHari: "Selasa",
    subTitle: "Hari ke-2",
    items: [],
  },
  {
    id: "rabu",
    namaHari: "Rabu",
    subTitle: "Hari ke-3",
    items: [],
  },
  {
    id: "kamis",
    namaHari: "Kamis",
    subTitle: "Hari ke-4",
    items: [],
  },
  {
    id: "jumat",
    namaHari: "Jumat",
    subTitle: "Hari ke-5",
    items: [],
  },
];

export function MenuPlanner() {
  const [days, setDays] = useState<DayColumnData[]>(INITIAL_DAYS);
  const [selectedAkgId, setSelectedAkgId] = useState<string>(TARGET_AKG_PRESETS[0].id);
  const [recipes, setRecipes] = useState<StandardRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState<boolean>(false);
  const [activeDragRecipe, setActiveDragRecipe] = useState<StandardRecipe | null>(null);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });
  const [planId, setPlanId] = useState<string | null>(null);

  // Selected Target AKG
  const activeAkg =
    TARGET_AKG_PRESETS.find((a) => a.id === selectedAkgId) || TARGET_AKG_PRESETS[0];

  // Configure pointer sensor with small activation distance to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Helper function to show save status
  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setSaveStatus({ type, message });
    setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
  };

  // Load plan terbaru via API route (Prisma)
  const loadPlanFromApi = async () => {
    try {
      showStatus('info', 'Memuat plan dari database...');

      const res = await fetch('/api/menu-planner');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Gagal memuat plan');

      if (json.data) {
        const plan = json.data;
        const schedule = plan.schedule_data as any;
        const newDays: DayColumnData[] = INITIAL_DAYS.map(day => ({
          ...day,
          items: (schedule[day.id] || []).map((item: any) => ({
            instanceId: item.instanceId,
            recipe: item.recipe as StandardRecipe,
          })),
        }));
        setDays(newDays);
        setSelectedAkgId(plan.target_akg_id);
        setPlanId(plan.id);
        showStatus('success', `Plan "${plan.plan_name}" berhasil dimuat`);
      } else {
        showStatus('info', 'Belum ada plan tersimpan di database');
      }
    } catch (err: any) {
      console.error('Error loading plan:', err);
      showStatus('error', 'Gagal memuat plan dari database');
    }
  };

  // Simpan plan via API route (Prisma)
  const savePlanToApi = async () => {
    try {
      setSavingPlan(true);
      showStatus('info', 'Menyimpan plan ke database...');

      const scheduleData: Record<string, any[]> = {};
      days.forEach(day => {
        scheduleData[day.id] = day.items.map(item => ({
          instanceId: item.instanceId,
          recipe: item.recipe,
        }));
      });

      const planData = {
        id: planId,
        user_id: null,
        plan_name: `Plan ${new Date().toLocaleDateString('id-ID')}`,
        target_akg_id: activeAkg.id,
        target_akg_nama: activeAkg.namaKelompok,
        target_kalori_mbg: activeAkg.targetKaloriMbg,
        target_protein_mbg: activeAkg.targetProteinMbg,
        batas_hpp_maksimal: activeAkg.batasHppMaksimal,
        is_valid: weekStats.warningDaysCount === 0,
        valid_days_count: weekStats.validDaysCount,
        warning_days_count: weekStats.warningDaysCount,
        avg_kalori: weekStats.avgKalori,
        avg_hpp: weekStats.avgHpp,
        avg_protein: weekStats.avgProtein,
        total_hpp_week: weekStats.totalHppWeek,
        schedule_data: scheduleData,
      };

      const method = planId ? 'PATCH' : 'POST';
      const res = await fetch('/api/menu-planner', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan plan');

      if (!planId && json.data?.id) {
        setPlanId(json.data.id);
      }

      showStatus('success', 'Plan berhasil disimpan ke database!');
    } catch (err: any) {
      console.error('Error saving plan:', err);
      showStatus('error', 'Gagal menyimpan plan ke database');
    } finally {
      setSavingPlan(false);
    }
  };

  // Auto-save saat jadwal berubah (debounced 2 detik)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (planId) {
        savePlanToApi();
      }
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, planId]);

  // Fetch resep dari API route /api/resep (Prisma)
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoadingRecipes(true);
      try {
        const res = await fetch('/api/resep');
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || 'Gagal memuat resep');

        if (json.data && json.data.length > 0) {
          const mapped: StandardRecipe[] = json.data.map((d: any) => ({
            id: d.id,
            nama_resep: d.nama_resep,
            kategori: (d.kategori as StandardRecipe['kategori']) || 'Lainnya',
            kalori: Math.round(Number(d.total_kalori) || 0),
            protein: Math.round((Number(d.total_protein) || 0) * 10) / 10,
            hpp: Math.round(Number(d.hpp_per_porsi) || 0),
            deskripsi: d.deskripsi || undefined,
          }));
          setRecipes(mapped);
        } else {
          setRecipes([]);
        }
      } catch (err) {
        console.warn('Could not fetch recipes:', err);
        setRecipes([]);
      } finally {
        setLoadingRecipes(false);
      }
    };
    fetchRecipes();
  }, []);


  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const recipeData = active.data.current?.recipe as StandardRecipe | undefined;
    if (recipeData) {
      setActiveDragRecipe(recipeData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragRecipe(null);

    if (!over) return;

    const targetDayId = over.id as DayOfWeek;
    const validDays: DayOfWeek[] = ["senin", "selasa", "rabu", "kamis", "jumat"];

    if (!validDays.includes(targetDayId)) return;

    const recipe = active.data.current?.recipe as StandardRecipe | undefined;
    if (!recipe) return;

    // Add to target day column
    const newItem = {
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      recipe,
    };

    setDays((prev) =>
      prev.map((d) => (d.id === targetDayId ? { ...d, items: [...d.items, newItem] } : d))
    );
  };

  // Quick Add via Button
  const handleQuickAdd = (recipe: StandardRecipe, dayId: DayOfWeek) => {
    const newItem = {
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      recipe,
    };
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, items: [...d.items, newItem] } : d))
    );
  };

  // Remove Item
  const handleRemoveItem = (dayId: string, instanceId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, items: d.items.filter((it) => it.instanceId !== instanceId) } : d
      )
    );
  };

  // Clear Single Day
  const handleClearDay = (dayId: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, items: [] } : d)));
  };

  // Reset All
  const handleResetAll = () => {
    setDays(INITIAL_DAYS);
    setPlanId(null);
  };

  // Clear Entire Week
  const handleClearEntireWeek = () => {
    setDays((prev) => prev.map((d) => ({ ...d, items: [] })));
  };

  // Weekly Overall Validation Stats
  const weekStats = React.useMemo(() => {
    let validDaysCount = 0;
    let warningDaysCount = 0;
    let totalKaloriWeek = 0;
    let totalHppWeek = 0;
    let totalProteinWeek = 0;

    days.forEach((day) => {
      const k = day.items.reduce((acc, it) => acc + it.recipe.kalori, 0);
      const h = day.items.reduce((acc, it) => acc + it.recipe.hpp, 0);
      const p = day.items.reduce((acc, it) => acc + it.recipe.protein, 0);

      totalKaloriWeek += k;
      totalHppWeek += h;
      totalProteinWeek += p;

      if (day.items.length > 0) {
        if (k < activeAkg.targetKaloriMbg || h > activeAkg.batasHppMaksimal) {
          warningDaysCount++;
        } else {
          validDaysCount++;
        }
      }
    });

    const activeDaysCount = days.filter((d) => d.items.length > 0).length || 1;

    return {
      validDaysCount,
      warningDaysCount,
      avgKalori: Math.round(totalKaloriWeek / activeDaysCount),
      avgHpp: Math.round(totalHppWeek / activeDaysCount),
      avgProtein: Math.round((totalProteinWeek / activeDaysCount) * 10) / 10,
      totalHppWeek,
    };
  }, [days, activeAkg]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* AKG Target Selector & Status Bar */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <CardHeader className="pb-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Target Standar MBG (Badan Gizi Nasional)
                </CardTitle>
                <CardDescription className="text-xs">
                  Kalender mingguan secara otomatis memvalidasi komposisi gizi dan batas anggaran harian.
                </CardDescription>
              </div>

              {/* Selector Kelompok Sasaran */}
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="akg-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sasaran Siswa:
                </Label>
                <select
                  id="akg-select"
                  value={selectedAkgId}
                  onChange={(e) => setSelectedAkgId(e.target.value)}
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {TARGET_AKG_PRESETS.map((akg) => (
                    <option key={akg.id} value={akg.id} className="dark:bg-slate-900">
                      {akg.namaKelompok} • Target: {akg.targetKaloriMbg} kkal • Maks: Rp {akg.batasHppMaksimal.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="text-xs gap-1 h-8"
                  title="Muat contoh jadwal rekomendasi"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  Muat Contoh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadPlanFromApi}
                  className="text-xs gap-1 h-8 text-blue-600 hover:bg-blue-50 hover:border-blue-200 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:border-blue-900/60"
                  title="Muat plan terakhir dari database"
                >
                  <BookOpen className="h-3 w-3" />
                  Muat Plan
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={savePlanToApi}
                  disabled={savingPlan}
                  className="text-xs gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Simpan plan saat ini ke database"
                >
                  <Sparkles className="h-3 w-3" />
                  {savingPlan ? 'Menyimpan...' : 'Simpan Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearEntireWeek}
                  className="text-xs gap-1 h-8 text-red-600 hover:bg-red-50 hover:border-red-200 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:border-red-900/60"
                  title="Kosongkan jadwal 1 minggu"
                >
                  Kosongkan Kalender
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Save Status Notification */}
          {saveStatus.type && (
            <div className={`mx-4 -mt-2 mb-3 p-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
              saveStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : saveStatus.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
            }`}>
              {saveStatus.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {saveStatus.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {saveStatus.type === 'info' && <Sparkles className="h-4 w-4" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <CardContent className="pt-0">
            {/* 4 Cards Summary Validation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                  <span>Status Kepatuhan MBG</span>
                  <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {weekStats.validDaysCount} / 5
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Hari Lolos</span>
                </div>
                {weekStats.warningDaysCount > 0 ? (
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {weekStats.warningDaysCount} hari perlu koreksi
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Semua hari sesuai standar
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-orange-50/60 dark:bg-orange-950/30 p-3 border border-orange-100 dark:border-orange-900/40">
                <div className="text-[11px] text-orange-800 dark:text-orange-400 font-medium flex items-center justify-between">
                  <span>Rata-rata Kalori / Hari</span>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xl font-black text-orange-950 dark:text-orange-300">
                    {weekStats.avgKalori.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-orange-700 dark:text-orange-400">kkal</span>
                </div>
                <div className="text-[10px] text-orange-600/90 dark:text-orange-400/90 mt-0.5">
                  Target min: {activeAkg.targetKaloriMbg} kkal (30% AKG)
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium flex items-center justify-between">
                  <span>Rata-rata HPP / Porsi</span>
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xl font-black text-emerald-950 dark:text-emerald-300">
                    Rp {weekStats.avgHpp.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Batas maks: Rp {activeAkg.batasHppMaksimal.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-900/40">
                <div className="text-[11px] text-blue-800 dark:text-blue-400 font-medium flex items-center justify-between">
                  <span>Total Anggaran Mingguan</span>
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xl font-black text-blue-950 dark:text-blue-300">
                    Rp {weekStats.totalHppWeek.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">/siswa</span>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                  5 porsi makan siang bergizi
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main DND Area: Sidebar (Left) + Weekly Calendar Columns (Right) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Sidebar: Standard Recipes */}
          <RecipeSidebar
            recipes={recipes}
            onQuickAdd={handleQuickAdd}
            isLoading={loadingRecipes}
          />

          {/* Right Area: Weekly Calendar (Senin - Jumat) */}
          <div className="flex-1 min-w-0 w-full overflow-x-auto pb-4">
            <div className="flex flex-row gap-3.5 min-w-[1300px] w-full">
              {days.map((day) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  akg={activeAkg}
                  onRemoveItem={handleRemoveItem}
                  onClearDay={handleClearDay}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay for smooth visual dragging */}
      <DragOverlay>
        {activeDragRecipe ? (
          <div className="w-64 rounded-xl border-2 border-emerald-500 bg-white p-3 shadow-2xl ring-4 ring-emerald-100 opacity-95">
            <h5 className="font-bold text-xs text-slate-900">
              {activeDragRecipe.nama_resep}
            </h5>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="text-orange-600 font-bold">{activeDragRecipe.kalori} kkal</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Rp {activeDragRecipe.hpp.toLocaleString("id-ID")}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
