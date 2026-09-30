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
    const { tanggal } = body;
    let spreadsheetId = body.spreadsheetId;

    if (!tanggal) {
      return NextResponse.json(
        { error: "Parameter tanggal wajib diisi untuk generate laporan." },
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
      tanggal.trim()
    );

    return NextResponse.json({
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      title: result.title,
      rowCount: result.rowCount,
      message: `Laporan berhasil dibuat di Google Drive Anda dengan ${result.rowCount} item bahan.`,
    });
  } catch (error: any) {
    console.error("POST /api/rab/export error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal membuat spreadsheet Laporan RAB di Google Drive." },
      { status: 500 }
    );
  }
}
