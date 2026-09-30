import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  appendDailyRabEntries,
  getDailyRabEntries,
  getOrCreateMasterSpreadsheet,
} from "@/lib/google-sheets";
import { SheetRowRecord } from "@/types/rab";

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
    const filterDate = searchParams.get("tanggal") || undefined;
    let spreadsheetId = searchParams.get("spreadsheetId");

    if (!spreadsheetId) {
      const dbInfo = await getOrCreateMasterSpreadsheet(session.accessToken);
      spreadsheetId = dbInfo.spreadsheetId;
    }

    const records = await getDailyRabEntries(
      session.accessToken,
      spreadsheetId,
      filterDate
    );

    return NextResponse.json({
      success: true,
      records,
      totalCount: records.length,
    });
  } catch (error: any) {
    console.error("GET /api/rab error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat data RAB dari Google Sheet." },
      { status: 500 }
    );
  }
}

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
    const { tanggal, lokasiSppg, menuList } = body;
    let spreadsheetId = body.spreadsheetId;

    if (!tanggal || !lokasiSppg || !Array.isArray(menuList) || menuList.length === 0) {
      return NextResponse.json(
        { error: "Data input tidak lengkap. Tanggal, Lokasi, dan minimal 1 Menu dengan Bahan wajib diisi." },
        { status: 400 }
      );
    }

    // Auto discover/provision spreadsheet if not provided
    if (!spreadsheetId) {
      const db = await getOrCreateMasterSpreadsheet(session.accessToken);
      spreadsheetId = db.spreadsheetId;
    }

    // Flatten nested Menu -> Bahan structure into rows for Tab_Input_Harian
    const rowsToAppend: SheetRowRecord[] = [];
    const timestamp = Date.now();
    let counter = 1;

    for (const menu of menuList) {
      const menuName = (menu.namaMenu || "Menu Tanpa Nama").trim();
      if (!Array.isArray(menu.bahanList) || menu.bahanList.length === 0) continue;

      for (const bahan of menu.bahanList) {
        if (!bahan.uraianBahan) continue;

        rowsToAppend.push({
          id: `RAB-${timestamp}-${counter++}`,
          tanggal: tanggal.trim(),
          lokasiSppg: lokasiSppg.trim(),
          namaMenu: menuName,
          uraianBahan: bahan.uraianBahan.trim(),
          kuantitasAngka: Number(bahan.kuantitas) || 0,
          satuan: bahan.satuan || "pcs",
          keterangan: (bahan.keterangan || "").trim(),
        });
      }
    }

    if (rowsToAppend.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada bahan valid yang siap disimpan." },
        { status: 400 }
      );
    }

    await appendDailyRabEntries(session.accessToken, spreadsheetId, rowsToAppend);

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${rowsToAppend.length} baris bahan ke Google Sheet Tab_Input_Harian!`,
      rowCount: rowsToAppend.length,
      spreadsheetId,
    });
  } catch (error: any) {
    console.error("POST /api/rab error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan data ke Google Sheet pengguna." },
      { status: 500 }
    );
  }
}
