export interface MasterBahan {
  id: string;
  nama_bahan: string;
  kategori: "Makanan Pokok" | "Lauk Hewani" | "Lauk Nabati" | "Sayuran" | "Buah" | "Bumbu & Minyak" | "Lainnya";
  bdd_persen: number; // Persentase Bagian Dapat Dimakan (0 - 100)
  kalori_100g: number; // kkal per 100g berat bersih
  protein_100g: number; // gram per 100g berat bersih
  harga_per_kg: number; // Harga beli dalam Rupiah per 1000 gram kotor
  satuan?: string;
}

export type BatchSatuan = "kg" | "liter" | "gram" | "ml" | "pcs" | "kotak";

export interface BatchInputState {
  total_porsi: number | "";
  jumlah_bahan: number | "";
  satuan: BatchSatuan;
}

export interface BatchConversionResult {
  gramasi_kotor: number;
  label: string; // Teks helper konversi, misal: "120 kg / 1.938 porsi = 61,92 gram/porsi"
  isPcs: boolean; // true jika satuan pcs/kotak (nilai pecahan, bukan gram)
}

export interface ResepKomposisiItem {
  tempId: string;
  bahan_id: string;
  nama_bahan: string;
  kategori?: string;
  bdd_persen: number;
  kalori_100g: number;
  protein_100g: number;
  harga_per_kg: number;
  gramasi_kotor: number | ""; // Input user dalam gram
  // Hasil perhitungan otomatis
  berat_bersih: number;
  kalori: number;
  protein: number;
  harga: number;
}

export interface ResepSummary {
  totalBeratKotor: number;
  totalBeratBersih: number;
  totalKalori: number;
  totalProtein: number;
  totalHpp: number;
  kaloriPerPorsi: number;
  proteinPerPorsi: number;
  hppPerPorsi: number;
}

export interface ResepInsertPayload {
  nama_resep: string;
  kategori?: string;
  deskripsi?: string;
  porsi: number;
  total_kalori: number;
  total_protein: number;
  total_hpp: number;
  hpp_per_porsi: number;
}

export interface ResepKomposisiInsertPayload {
  resep_id: string;
  bahan_id?: string | null;
  nama_bahan: string;
  gramasi_kotor: number;
  bdd_persen: number;
  berat_bersih: number;
  kalori: number;
  protein: number;
  harga: number;
}

/**
 * 16+ Bahan Pangan Standar TKPI / DKBM Indonesia
 */
export const MOCK_MASTER_BAHAN: MasterBahan[] = [
  {
    id: "mb-01",
    nama_bahan: "Beras Putih Giling",
    kategori: "Makanan Pokok",
    bdd_persen: 100,
    kalori_100g: 360,
    protein_100g: 6.8,
    harga_per_kg: 14500,
    satuan: "kg",
  },
  {
    id: "mb-02",
    nama_bahan: "Daging Ayam Karkas (Utuh)",
    kategori: "Lauk Hewani",
    bdd_persen: 58,
    kalori_100g: 298,
    protein_100g: 18.2,
    harga_per_kg: 38000,
    satuan: "kg",
  },
  {
    id: "mb-03",
    nama_bahan: "Daging Dada Ayam Fillet",
    kategori: "Lauk Hewani",
    bdd_persen: 100,
    kalori_100g: 150,
    protein_100g: 31.0,
    harga_per_kg: 52000,
    satuan: "kg",
  },
  {
    id: "mb-04",
    nama_bahan: "Daging Sapi Murni",
    kategori: "Lauk Hewani",
    bdd_persen: 100,
    kalori_100g: 201,
    protein_100g: 18.8,
    harga_per_kg: 135000,
    satuan: "kg",
  },
  {
    id: "mb-05",
    nama_bahan: "Telur Ayam Ras (dengan Cangkang)",
    kategori: "Lauk Hewani",
    bdd_persen: 89,
    kalori_100g: 154,
    protein_100g: 12.4,
    harga_per_kg: 28000,
    satuan: "kg",
  },
  {
    id: "mb-06",
    nama_bahan: "Ikan Kembung Segar",
    kategori: "Lauk Hewani",
    bdd_persen: 80,
    kalori_100g: 112,
    protein_100g: 21.4,
    harga_per_kg: 42000,
    satuan: "kg",
  },
  {
    id: "mb-07",
    nama_bahan: "Tempe Kedelai Murni",
    kategori: "Lauk Nabati",
    bdd_persen: 100,
    kalori_100g: 193,
    protein_100g: 20.8,
    harga_per_kg: 16000,
    satuan: "kg",
  },
  {
    id: "mb-08",
    nama_bahan: "Tahu Putih Segar",
    kategori: "Lauk Nabati",
    bdd_persen: 100,
    kalori_100g: 80,
    protein_100g: 10.9,
    harga_per_kg: 12000,
    satuan: "kg",
  },
  {
    id: "mb-09",
    nama_bahan: "Wortel Segar",
    kategori: "Sayuran",
    bdd_persen: 88,
    kalori_100g: 36,
    protein_100g: 1.0,
    harga_per_kg: 15000,
    satuan: "kg",
  },
  {
    id: "mb-10",
    nama_bahan: "Kentang Segar",
    kategori: "Makanan Pokok",
    bdd_persen: 85,
    kalori_100g: 89,
    protein_100g: 2.1,
    harga_per_kg: 18000,
    satuan: "kg",
  },
  {
    id: "mb-11",
    nama_bahan: "Bayam Hijau Segar",
    kategori: "Sayuran",
    bdd_persen: 71,
    kalori_100g: 16,
    protein_100g: 0.9,
    harga_per_kg: 12000,
    satuan: "kg",
  },
  {
    id: "mb-12",
    nama_bahan: "Brokoli Segar",
    kategori: "Sayuran",
    bdd_persen: 63,
    kalori_100g: 34,
    protein_100g: 2.8,
    harga_per_kg: 28000,
    satuan: "kg",
  },
  {
    id: "mb-13",
    nama_bahan: "Kacang Panjang Segar",
    kategori: "Sayuran",
    bdd_persen: 92,
    kalori_100g: 39,
    protein_100g: 2.7,
    harga_per_kg: 14000,
    satuan: "kg",
  },
  {
    id: "mb-14",
    nama_bahan: "Minyak Kelapa Sawit (Goreng)",
    kategori: "Bumbu & Minyak",
    bdd_persen: 100,
    kalori_100g: 884,
    protein_100g: 0,
    harga_per_kg: 18500,
    satuan: "kg",
  },
  {
    id: "mb-15",
    nama_bahan: "Bawang Merah Lokal",
    kategori: "Bumbu & Minyak",
    bdd_persen: 90,
    kalori_100g: 39,
    protein_100g: 1.5,
    harga_per_kg: 35000,
    satuan: "kg",
  },
  {
    id: "mb-16",
    nama_bahan: "Bawang Putih Impor",
    kategori: "Bumbu & Minyak",
    bdd_persen: 88,
    kalori_100g: 112,
    protein_100g: 4.5,
    harga_per_kg: 40000,
    satuan: "kg",
  },
  {
    id: "mb-17",
    nama_bahan: "Pisang Ambon",
    kategori: "Buah",
    bdd_persen: 75,
    kalori_100g: 99,
    protein_100g: 1.2,
    harga_per_kg: 20000,
    satuan: "kg",
  },
  {
    id: "mb-18",
    nama_bahan: "Susu Sapi Segar (Full Cream)",
    kategori: "Lainnya",
    bdd_persen: 100,
    kalori_100g: 61,
    protein_100g: 3.2,
    harga_per_kg: 22000,
    satuan: "kg",
  },
];

/**
 * Rumus Perhitungan Gizi & Biaya Bahan Real-Time:
 * 1. Berat Bersih = gramasi_kotor * (bdd_persen / 100)
 * 2. Kalori Bahan = (Berat Bersih / 100) * kalori_100g
 * 3. Protein Bahan = (Berat Bersih / 100) * protein_100g
 * 4. Harga Bahan = (gramasi_kotor / 1000) * harga_per_kg
 */
export function calculateItemValues(
  gramasiKotorInput: number | "",
  bddPersen: number,
  kalori100g: number,
  protein100g: number,
  hargaPerKg: number
): {
  berat_bersih: number;
  kalori: number;
  protein: number;
  harga: number;
} {
  const gramasiKotor = typeof gramasiKotorInput === "number" && !isNaN(gramasiKotorInput)
    ? Math.max(0, gramasiKotorInput)
    : 0;

  const berat_bersih = gramasiKotor * (bddPersen / 100);
  const kalori = (berat_bersih / 100) * kalori100g;
  const protein = (berat_bersih / 100) * protein100g;
  const harga = (gramasiKotor / 1000) * hargaPerKg;

  return {
    berat_bersih: Math.round(berat_bersih * 10) / 10,
    kalori: Math.round(kalori * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    harga: Math.round(harga),
  };
}

/**
 * Konversi input Batch / Belanja Massal ke gramasi_kotor per 1 porsi (gram).
 * Rumus:
 * - kg     : (jumlah_bahan * 1000) / total_porsi
 * - liter  : (jumlah_bahan * 1000) / total_porsi  (1 ml ≈ 1 g untuk cairan umum)
 * - gram   : jumlah_bahan / total_porsi
 * - ml     : jumlah_bahan / total_porsi
 * - pcs/kotak: jumlah_bahan / total_porsi  (nilai pecahan per porsi)
 */
export function calculateGramasiKotorFromBatch(
  jumlahBahan: number | "",
  totalPorsi: number | "",
  satuan: BatchSatuan
): BatchConversionResult {
  const jml = typeof jumlahBahan === "number" && !isNaN(jumlahBahan) ? jumlahBahan : 0;
  const porsi = typeof totalPorsi === "number" && !isNaN(totalPorsi) && totalPorsi > 0 ? totalPorsi : 1;

  let gramasi_kotor = 0;
  let isPcs = false;

  switch (satuan) {
    case "kg":
      gramasi_kotor = (jml * 1000) / porsi;
      break;
    case "liter":
      gramasi_kotor = (jml * 1000) / porsi;
      break;
    case "gram":
    case "ml":
      gramasi_kotor = jml / porsi;
      break;
    case "pcs":
    case "kotak":
      gramasi_kotor = jml / porsi;
      isPcs = true;
      break;
    default:
      gramasi_kotor = jml / porsi;
  }

  // Pembulatan 4 desimal untuk presisi
  gramasi_kotor = Math.round(gramasi_kotor * 10000) / 10000;

  // Format label helper yang ramah pengguna
  const satuanLabel = satuan === "pcs" || satuan === "kotak" ? satuan : satuan;
  const unitDisplay = satuan === "pcs" || satuan === "kotak" ? "pcs/porsi" : "gram/porsi";
  const jmlDisplay = jml.toLocaleString("id-ID");
  const porsiDisplay = porsi.toLocaleString("id-ID");
  const hasilDisplay = gramasi_kotor.toLocaleString("id-ID", { maximumFractionDigits: 4 });

  const label = `${jmlDisplay} ${satuanLabel} ÷ ${porsiDisplay} porsi = ${hasilDisplay} ${unitDisplay}`;

  return { gramasi_kotor, label, isPcs };
}
