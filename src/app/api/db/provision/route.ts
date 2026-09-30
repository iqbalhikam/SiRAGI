import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrCreateMasterSpreadsheet } from "@/lib/google-sheets";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan atau belum terautentikasi. Silakan login." },
        { status: 401 }
      );
    }

    const { spreadsheetId, spreadsheetUrl, isNew } = await getOrCreateMasterSpreadsheet(
      session.accessToken
    );

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      isNew,
      message: isNew
        ? "Berhasil menginisialisasi database baru 'Master_DB_RAB_Gizi' di Google Drive Anda."
        : "Database 'Master_DB_RAB_Gizi' ditemukan dan siap digunakan.",
    });
  } catch (error: any) {
    console.error("Provisioning error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Gagal menghubungkan atau menginisialisasi Google Spreadsheet di Drive pengguna.",
      },
      { status: 500 }
    );
  }
}
