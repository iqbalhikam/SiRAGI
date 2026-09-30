"use client";

import React, { useState } from "react";
import { BahanInput, MenuInput } from "@/types/rab";
import { MenuItemCard } from "./menu-item-card";
import {
  Calendar,
  Building2,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FolderSync,
} from "lucide-react";

interface RabFormProps {
  spreadsheetId?: string | null;
  onSuccessSubmit?: (tanggal: string) => void;
}

const createInitialBahan = (): BahanInput => ({
  id: `b-${Math.random().toString(36).substring(2, 9)}`,
  uraianBahan: "",
  kuantitas: "",
  satuan: "kg",
  keterangan: "",
});

const createInitialMenu = (nama = ""): MenuInput => ({
  id: `m-${Math.random().toString(36).substring(2, 9)}`,
  namaMenu: nama,
  bahanList: [createInitialBahan()],
});

export function RabForm({ spreadsheetId, onSuccessSubmit }: RabFormProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [tanggal, setTanggal] = useState<string>(todayStr);
  const [lokasiSppg, setLokasiSppg] = useState<string>("SPPG Unit Pusat");
  const [menuList, setMenuList] = useState<MenuInput[]>([
    createInitialMenu("Menu Pagi - Nasi & Lauk Sehat"),
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add new Menu block
  const handleAddMenu = () => {
    setMenuList((prev) => [...prev, createInitialMenu()]);
  };

  // Delete Menu block
  const handleDeleteMenu = (menuIndex: number) => {
    if (menuList.length <= 1) return;
    setMenuList((prev) => prev.filter((_, idx) => idx !== menuIndex));
  };

  // Update Menu Name
  const handleUpdateMenuName = (menuIndex: number, name: string) => {
    setMenuList((prev) => {
      const next = [...prev];
      next[menuIndex] = { ...next[menuIndex], namaMenu: name };
      return next;
    });
  };

  // Add Bahan inside a Menu
  const handleAddBahan = (menuIndex: number) => {
    setMenuList((prev) => {
      const next = [...prev];
      const targetMenu = next[menuIndex];
      next[menuIndex] = {
        ...targetMenu,
        bahanList: [...targetMenu.bahanList, createInitialBahan()],
      };
      return next;
    });
  };

  // Update Bahan inside a Menu
  const handleUpdateBahan = (
    menuIndex: number,
    bahanIndex: number,
    updated: BahanInput
  ) => {
    setMenuList((prev) => {
      const next = [...prev];
      const targetMenu = next[menuIndex];
      const nextBahan = [...targetMenu.bahanList];
      nextBahan[bahanIndex] = updated;
      next[menuIndex] = { ...targetMenu, bahanList: nextBahan };
      return next;
    });
  };

  // Delete Bahan inside a Menu
  const handleDeleteBahan = (menuIndex: number, bahanIndex: number) => {
    setMenuList((prev) => {
      const next = [...prev];
      const targetMenu = next[menuIndex];
      if (targetMenu.bahanList.length <= 1) return prev;
      next[menuIndex] = {
        ...targetMenu,
        bahanList: targetMenu.bahanList.filter((_, idx) => idx !== bahanIndex),
      };
      return next;
    });
  };

  // Preset example for immediate testing
  const handleLoadSample = () => {
    setTanggal(todayStr);
    setLokasiSppg("SPPG RSUD Graha Husada");
    setMenuList([
      {
        id: `m-1`,
        namaMenu: "Sayur Sop Daging & Wortel",
        bahanList: [
          {
            id: `b-11`,
            uraianBahan: "Daging Sapi Segar (Has Luar)",
            kuantitas: 8.5,
            satuan: "kg",
            keterangan: "Dipotong dadu 2 cm",
          },
          {
            id: `b-12`,
            uraianBahan: "Wortel Manis Berastagi",
            kuantitas: 5.0,
            satuan: "kg",
            keterangan: "Kualitas super",
          },
          {
            id: `b-13`,
            uraianBahan: "Buncis Hijau",
            kuantitas: 3.0,
            satuan: "kg",
            keterangan: "Segar tanpa serat",
          },
          {
            id: `b-14`,
            uraianBahan: "Bawang Goreng Tabur",
            kuantitas: 2,
            satuan: "pouch",
            keterangan: "Kemasan kedap udara",
          },
        ],
      },
      {
        id: `m-2`,
        namaMenu: "Ayam Panggang Bumbu Rujak",
        bahanList: [
          {
            id: `b-21`,
            uraianBahan: "Ayam Broiler Karkas",
            kuantitas: 12,
            satuan: "pcs",
            keterangan: "Ukuran 1.2 kg per ekor",
          },
          {
            id: `b-22`,
            uraianBahan: "Minyak Goreng Sawit",
            kuantitas: 4.0,
            satuan: "liter",
            keterangan: "Kemasan pouch 2L",
          },
          {
            id: `b-23`,
            uraianBahan: "Gula Merah Aren",
            kuantitas: 2.5,
            satuan: "kg",
            keterangan: "Grade A murni",
          },
        ],
      },
      {
        id: `m-3`,
        namaMenu: "Pencuci Mulut & Buah Potong",
        bahanList: [
          {
            id: `b-31`,
            uraianBahan: "Melon Orange Fresh",
            kuantitas: 10.0,
            satuan: "kg",
            keterangan: "Kematangan pas",
          },
          {
            id: `b-32`,
            uraianBahan: "Susu UHT Full Cream",
            kuantitas: 1,
            satuan: "kotak",
            keterangan: "Isi 24 kotak kecil",
          },
        ],
      },
    ]);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (!tanggal || !lokasiSppg.trim()) {
      setFeedback({
        type: "error",
        message: "Tanggal dan Lokasi SPPG wajib diisi.",
      });
      return;
    }

    const totalBahanCount = menuList.reduce(
      (sum, m) => sum + m.bahanList.length,
      0
    );
    if (totalBahanCount === 0) {
      setFeedback({
        type: "error",
        message: "Silakan masukkan minimal 1 bahan makanan.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/rab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId,
          tanggal,
          lokasiSppg,
          menuList,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan data ke Google Sheet.");
      }

      setFeedback({
        type: "success",
        message:
          data.message ||
          "Data RAB berhasil ditambahkan ke Tab_Input_Harian di Google Sheet Anda!",
      });

      if (onSuccessSubmit) {
        onSuccessSubmit(tanggal);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.message ||
          "Terjadi kegagalan saat menulis ke Google Sheet pengguna.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalMenus = menuList.length;
  const totalBahan = menuList.reduce((acc, m) => acc + m.bahanList.length, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Header Input RAB Harian
            </h2>
            <p className="text-xs text-slate-500">
              Tentukan tanggal pelaksanaan dan unit penyedia makanan (SPPG).
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Muat Contoh Menu Gizi
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tanggal */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              Tanggal Pelaksanaan
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Lokasi / SPPG */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              Lokasi / SPPG (Satuan Pelayanan Pengadaan Gizi)
            </label>
            <input
              type="text"
              value={lokasiSppg}
              onChange={(e) => setLokasiSppg(e.target.value)}
              placeholder="Contoh: SPPG Dapur Utama RSUD, Katering Mitra..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Repeater Section: Menu & Bahan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rincian Menu & Bahan Makanan
            </h3>
            <p className="text-xs text-slate-500">
              Kelompokkan bahan berdasarkan nama menu. Bahan akan otomatis masuk ke{" "}
              <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                Tab_Input_Harian
              </code>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddMenu}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Plus className="h-4 w-4" />
            Tambah Menu Baru
          </button>
        </div>

        {/* List of Menu Cards */}
        <div className="space-y-4">
          {menuList.map((menu, mIdx) => (
            <MenuItemCard
              key={menu.id}
              menu={menu}
              menuIndex={mIdx}
              canDeleteMenu={menuList.length > 1}
              onUpdateMenuName={(name) => handleUpdateMenuName(mIdx, name)}
              onDeleteMenu={() => handleDeleteMenu(mIdx)}
              onAddBahan={() => handleAddBahan(mIdx)}
              onUpdateBahan={(bIdx, updated) =>
                handleUpdateBahan(mIdx, bIdx, updated)
              }
              onDeleteBahan={(bIdx) => handleDeleteBahan(mIdx, bIdx)}
            />
          ))}
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>
            Total Menu: <strong className="text-slate-900">{totalMenus}</strong>
          </span>
          <span className="h-3 w-px bg-slate-300"></span>
          <span>
            Total Bahan: <strong className="text-slate-900">{totalBahan}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan ke Google Sheet...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Simpan ke Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
