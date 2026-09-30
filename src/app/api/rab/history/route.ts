import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGroupedRabHistory,
  getOrCreateMasterSpreadsheet,
} from "@/lib/google-sheets";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan atau belum login." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const keyword = searchParams.get("keyword") || undefined;
    let spreadsheetId = searchParams.get("spreadsheetId");
    let spreadsheetUrl: string | undefined;

    if (!spreadsheetId) {
      const dbInfo = await getOrCreateMasterSpreadsheet(session.accessToken);
      spreadsheetId = dbInfo.spreadsheetId;
      spreadsheetUrl = dbInfo.spreadsheetUrl;
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    }

    const history = await getGroupedRabHistory(
      session.accessToken,
      spreadsheetId,
      { startDate, endDate, keyword }
    );

    return NextResponse.json({
      success: true,
      history,
      totalDocuments: history.length,
      spreadsheetId,
      spreadsheetUrl,
    });
  } catch (error: any) {
    console.error("GET /api/rab/history error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat riwayat data RAB dari Google Sheet." },
      { status: 500 }
    );
  }
}
