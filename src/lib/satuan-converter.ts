/**
 * lib/satuan-converter.ts
 * Konversi cerdas satuan pembelian (kg, gram, liter, ml, kotak, pcs, bungkus, butir, ikat, sdm, sdt)
 * Membantu kalkulasi otomatis kebutuhan massal (misal: 323 kotak tahu, 5 pcs garam)
 */

export interface SatuanOption {
  value: string;
  label: string;
  defaultGram: number;
  isDiscrete?: boolean; // satuan kemasan / lepasan yang bisa disesuaikan bobot gram per satuannya
  hint?: string;
  getGramPerUnit?: (namaBahan?: string) => number;
}

export const SATUAN_LIST: SatuanOption[] = [
  { value: "kg", label: "kg", defaultGram: 1000 },
  { value: "gram", label: "gram", defaultGram: 1 },
  { value: "liter", label: "liter", defaultGram: 1000 },
  { value: "ml", label: "ml", defaultGram: 1 },
  {
    value: "kotak",
    label: "kotak",
    defaultGram: 50,
    isDiscrete: true,
    hint: "Tahu biasanya ~50g/kotak",
    getGramPerUnit: (nama?: string) => {
      const n = (nama || "").toLowerCase();
      if (n.includes("tahu")) return 50; // 1 kotak/potong tahu standar ~50g
      if (n.includes("tempe")) return 100;
      return 50;
    },
  },
  {
    value: "pcs",
    label: "pcs",
    defaultGram: 100,
    isDiscrete: true,
    hint: "Garam biasanya ~250g/pcs",
    getGramPerUnit: (nama?: string) => {
      const n = (nama || "").toLowerCase();
      if (n.includes("garam")) return 250; // 1 pcs garam dapur bata / bungkus ~250g
      if (n.includes("telur")) return 60;
      if (n.includes("royco") || n.includes("masako") || n.includes("kaldu")) return 100;
      return 100;
    },
  },
  {
    value: "bungkus",
    label: "bungkus",
    defaultGram: 250,
    isDiscrete: true,
    hint: "Garam ~250g / bihun ~200g",
    getGramPerUnit: (nama?: string) => {
      const n = (nama || "").toLowerCase();
      if (n.includes("garam")) return 250;
      if (n.includes("bihun") || n.includes("mie")) return 200;
      return 250;
    },
  },
  {
    value: "butir",
    label: "butir",
    defaultGram: 60,
    isDiscrete: true,
    hint: "1 butir telur ~60g",
    getGramPerUnit: () => 60,
  },
  {
    value: "ikat",
    label: "ikat",
    defaultGram: 150,
    isDiscrete: true,
    hint: "1 ikat kangkung/bayam ~150g",
    getGramPerUnit: () => 150,
  },
  {
    value: "sdm",
    label: "sdm",
    defaultGram: 15,
    hint: "1 sdm ~15g",
  },
  {
    value: "sdt",
    label: "sdt",
    defaultGram: 5,
    hint: "1 sdt ~5g",
  },
];

/**
 * Mengambil nilai gram per unit berdasarkan satuan dan nama bahan
 */
export function getGramPerUnit(
  satuan: string,
  namaBahan?: string,
  customGram?: number
): number {
  if (typeof customGram === "number" && customGram > 0) {
    return customGram;
  }
  const found = SATUAN_LIST.find((s) => s.value === satuan);
  if (!found) return 1;
  if (found.getGramPerUnit) {
    return found.getGramPerUnit(namaBahan);
  }
  return found.defaultGram;
}
