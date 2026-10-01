export interface StandardRecipe {
  id: string;
  nama_resep: string;
  kategori: "Menu Lengkap" | "Makanan Pokok" | "Lauk Hewani" | "Lauk Nabati" | "Sayuran" | "Buah & Susu";
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

export const MOCK_STANDARD_RECIPES: StandardRecipe[] = [
  {
    id: "rec-01",
    nama_resep: "Nasi Ayam Bakar Madu Komplit",
    kategori: "Menu Lengkap",
    kalori: 680,
    protein: 26.5,
    hpp: 14200,
    deskripsi: "Nasi pulen, ayam bakar madu 1 potong, lalapan timun selada",
  },
  {
    id: "rec-02",
    nama_resep: "Nasi Rolade Daging Sapi & Sup Sayur",
    kategori: "Menu Lengkap",
    kalori: 710,
    protein: 23.0,
    hpp: 14800,
    deskripsi: "Nasi, rolade daging sapi 2 iris, sup wortel buncis brokoli",
  },
  {
    id: "rec-03",
    nama_resep: "Nasi Ikan Kembung Goreng & Sayur Bening",
    kategori: "Menu Lengkap",
    kalori: 640,
    protein: 24.8,
    hpp: 12500,
    deskripsi: "Nasi, ikan kembung segar goreng garing, sayur bening bayam jagung",
  },
  {
    id: "rec-04",
    nama_resep: "Nasi Putih Pulen (150g)",
    kategori: "Makanan Pokok",
    kalori: 260,
    protein: 4.5,
    hpp: 2200,
    deskripsi: "Beras putih premium pandan wangi pulen",
  },
  {
    id: "rec-05",
    nama_resep: "Ayam Goreng Lengkuas Gurih",
    kategori: "Lauk Hewani",
    kalori: 320,
    protein: 22.4,
    hpp: 7800,
    deskripsi: "Ayam ungkep bumbu kuning tabur kremes serundeng",
  },
  {
    id: "rec-06",
    nama_resep: "Semur Telur Bulat & Tahu Cokelat",
    kategori: "Lauk Hewani",
    kalori: 240,
    protein: 15.2,
    hpp: 5500,
    deskripsi: "Telur ayam 1 butir dan tahu sutra dalam kuah semur manis",
  },
  {
    id: "rec-07",
    nama_resep: "Tempe Goreng Tepung Daun Bawang",
    kategori: "Lauk Nabati",
    kalori: 145,
    protein: 8.5,
    hpp: 1800,
    deskripsi: "Tempe kedelai murni balut adonan renyah bumbu ketumbar",
  },
  {
    id: "rec-08",
    nama_resep: "Tumis Buncis Jagung Pipil & Wortel",
    kategori: "Sayuran",
    kalori: 85,
    protein: 2.5,
    hpp: 2400,
    deskripsi: "Sayuran segar ditumis dengan bawang putih & minyak tiris",
  },
  {
    id: "rec-09",
    nama_resep: "Sup Bayam Jagung Manis Bening",
    kategori: "Sayuran",
    kalori: 55,
    protein: 2.1,
    hpp: 1800,
    deskripsi: "Bayam hijau segar dan jagung manis kaya zat besi",
  },
  {
    id: "rec-10",
    nama_resep: "Pisang Ambon / Cavendish Segar (1 Buah)",
    kategori: "Buah & Susu",
    kalori: 105,
    protein: 1.2,
    hpp: 2000,
    deskripsi: "Buah pisang matang pohon kaya kalium dan serat",
  },
  {
    id: "rec-11",
    nama_resep: "Susu Sapi Segar Pasteur / UHT (125ml)",
    kategori: "Buah & Susu",
    kalori: 90,
    protein: 4.2,
    hpp: 3500,
    deskripsi: "Susu sapi murni kalsium tinggi untuk pertumbuhan",
  },
  {
    id: "rec-12",
    nama_resep: "Semangka Merah Potong Dingin",
    kategori: "Buah & Susu",
    kalori: 45,
    protein: 0.8,
    hpp: 1500,
    deskripsi: "Potongan semangka segar manis pencuci mulut",
  },
];
