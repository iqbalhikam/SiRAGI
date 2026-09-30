import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function formatFullHariTanggal(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = new Date(year, month - 1, day);
      const hari = NAMA_HARI[d.getDay()] || "";
      const bulan = NAMA_BULAN[month - 1] || "";
      return `${hari}, ${day} ${bulan} ${year}`;
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatTanggalUpper(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const bulan = (NAMA_BULAN[month - 1] || "").toUpperCase();
      return `${day} ${bulan} ${year}`;
    }
    return dateStr.toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
}

export function formatIndoNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toLocaleString("id-ID");
  }
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}
