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

/**
 * Normalizes various date inputs (ISO YYYY-MM-DD, DD/MM/YYYY, Excel/Google Sheets serial date numbers like 46295)
 * into a canonical "YYYY-MM-DD" string.
 */
export function normalizeDateToYMD(val: any): string {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val).trim();

  // 1. Check if it's an Excel/Google Sheets serial date number (e.g. 46295 for 2026-09-30)
  const num = Math.floor(Number(str));
  if (!isNaN(num) && num >= 20000 && num <= 100000) {
    // Days since Jan 1 1900 with Excel leap year bug: offset is 25569 to Unix epoch (1970-01-01)
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 3. Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 4. Fallback for date strings
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      if (y > 1970 && y < 3000) {
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    }
  } catch {}

  return str;
}

export function formatFullHariTanggal(dateStr: string): string {
  try {
    const normalized = normalizeDateToYMD(dateStr);
    const parts = normalized.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = new Date(year, month - 1, day);
      const hari = NAMA_HARI[d.getDay()] || "";
      const bulan = NAMA_BULAN[month - 1] || "";
      return `${hari}, ${day} ${bulan} ${year}`;
    }
    const d = new Date(normalized);
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
    const normalized = normalizeDateToYMD(dateStr);
    const parts = normalized.split("-").map(Number);
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
