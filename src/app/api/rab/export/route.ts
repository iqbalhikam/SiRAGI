import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  exportFormattedRabReport,
  getOrCreateMasterSpreadsheet,
} from "@/lib/google-sheets";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan atau belum login." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tanggal, mode = "single", startDate, endDate } = body;
    let spreadsheetId = body.spreadsheetId;

    if (mode === "single" && !tanggal) {
      return NextResponse.json(
        { error: "Parameter tanggal wajib diisi untuk generate laporan tanggal tunggal." },
        { status: 400 }
      );
    }

    if (!spreadsheetId) {
      const db = await getOrCreateMasterSpreadsheet(session.accessToken);
      spreadsheetId = db.spreadsheetId;
    }

    const result = await exportFormattedRabReport(
      session.accessToken,
      spreadsheetId,
      {
        targetDate: tanggal?.trim(),
        mode,
        startDate: startDate?.trim(),
        endDate: endDate?.trim(),
      }
    );

    return NextResponse.json({
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      title: result.title,
      rowCount: result.rowCount,
      datesCount: result.datesCount,
      message: `Laporan Food Cost berhasil dibuat di Google Drive Anda (${result.rowCount} item bahan dari ${result.datesCount} hari).`,
    });
  } catch (error: any) {
    console.error("POST /api/rab/export error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal membuat spreadsheet Laporan Food Cost di Google Drive." },
      { status: 500 }
    );
  }
}
