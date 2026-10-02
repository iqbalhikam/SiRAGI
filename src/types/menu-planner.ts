export interface StandardRecipe {
  id: string;
  nama_resep: string;
  /**
   * Kategori harus kompatibel dengan semua nilai yang bisa disimpan Recipe Builder.
   * Gunakan string agar tidak ada data yang hilang saat dipetakan dari tabel `resep`.
   */
  kategori:
    | "Menu Lengkap"
    | "Makanan Pokok"
    | "Lauk Hewani"
    | "Lauk Nabati"
    | "Sayuran"
    | "Buah & Susu"
    | "Buah"
    | "Snack / Camilan"
    | "Menu Utama (Komplit)"
    | "Lainnya"
    | string; // fallback untuk kategori custom di masa depan
  kalori: number; // kkal
  protein: number; // gram
  hpp: number; // Rupiah per porsi
  deskripsi?: string;
}

export interface DayPlanItem {
  instanceId: string; // Unique ID for each item placed on calendar
  recipe: StandardRecipe;
}

export type DayOfWeek = "senin" | "selasa" | "rabu" | "kamis" | "jumat";

export interface DayColumnData {
  id: DayOfWeek;
  namaHari: string;
  subTitle: string;
  items: DayPlanItem[];
}

export interface MasterAKG {
  id: string;
  namaKelompok: string;
  targetKaloriHarian: number; // e.g. 2100 kkal
  persenAkgMbg: number; // e.g. 33.3%
  targetKaloriMbg: number; // Batas minimal kalori (misal 700 kkal)
  targetProteinMbg: number; // Batas target protein (misal 20-25 g)
  batasHppMaksimal: number; // Batas maksimal biaya (misal Rp 15.000)
}

export const TARGET_AKG_PRESETS: MasterAKG[] = [
  {
    id: "akg-sd-b",
    namaKelompok: "SD Kelas 4-6 (Standar Utama MBG)",
    targetKaloriHarian: 2100,
    persenAkgMbg: 33.3,
    targetKaloriMbg: 700,
    targetProteinMbg: 22,
    batasHppMaksimal: 15000,
  },
  {
    id: "akg-smp-sma",
    namaKelompok: "SMP / MTs & SMA / Remaja",
    targetKaloriHarian: 2400,
    persenAkgMbg: 33.3,
    targetKaloriMbg: 780,
    targetProteinMbg: 25,
    batasHppMaksimal: 15000,
  },
  {
    id: "akg-sd-a",
    namaKelompok: "SD Kelas 1-3 (Porsi Ringan)",
    targetKaloriHarian: 1800,
    persenAkgMbg: 33.3,
    targetKaloriMbg: 600,
    targetProteinMbg: 18,
    batasHppMaksimal: 13500,
  },
];
