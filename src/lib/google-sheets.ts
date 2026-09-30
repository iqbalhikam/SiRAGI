import { google, sheets_v4 } from "googleapis";
import { SheetRowRecord } from "@/types/rab";

const MASTER_DB_NAME = "Master_DB_RAB_Gizi";
const TAB_INPUT_HARIAN = "Tab_Input_Harian";

const HEADER_COLUMNS = [
  "ID",
  "Tanggal",
  "Lokasi SPPG",
  "Nama Menu",
  "Uraian Bahan",
  "Kuantitas_Angka",
  "Satuan",
  "Keterangan",
];

export function getGoogleClients(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  return { drive, sheets };
}

/**
 * 1. Provisioning: Check if Master_DB_RAB_Gizi exists in user's Drive.
 * If not, create it and initialize Tab_Input_Harian with proper headers.
 */
export async function getOrCreateMasterSpreadsheet(accessToken: string) {
  const { drive, sheets } = getGoogleClients(accessToken);

  // Search user's Drive for Master_DB_RAB_Gizi
  const listRes = await drive.files.list({
    q: `name = '${MASTER_DB_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id, name, webViewLink)",
    spaces: "drive",
  });

  const existingFile = listRes.data.files?.[0];

  if (existingFile && existingFile.id) {
    const spreadsheetId = existingFile.id;
    // Verify that Tab_Input_Harian sheet exists
    await ensureTabInputHarianExists(sheets, spreadsheetId);

    return {
      spreadsheetId,
      spreadsheetUrl: existingFile.webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      isNew: false,
    };
  }

  // Not found: Create new Master_DB_RAB_Gizi
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: MASTER_DB_NAME,
      },
      sheets: [
        {
          properties: {
            title: TAB_INPUT_HARIAN,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    },
  });

  const newSpreadsheetId = createRes.data.spreadsheetId;
  if (!newSpreadsheetId) {
    throw new Error("Gagal membuat file Master_DB_RAB_Gizi di Google Drive");
  }

  // Populate header row in Tab_Input_Harian
  await sheets.spreadsheets.values.update({
    spreadsheetId: newSpreadsheetId,
    range: `'${TAB_INPUT_HARIAN}'!A1:H1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [HEADER_COLUMNS],
    },
  });

  // Style header row (slate background, bold text)
  const sheetId = createRes.data.sheets?.[0]?.properties?.sheetId ?? 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: newSpreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 8,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 }, // Slate 100
                textFormat: { bold: true, fontSize: 10 },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        },
      ],
    },
  });

  const fileDetail = await drive.files.get({
    fileId: newSpreadsheetId,
    fields: "id, name, webViewLink",
  });

  return {
    spreadsheetId: newSpreadsheetId,
    spreadsheetUrl: fileDetail.data.webViewLink || `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`,
    isNew: true,
  };
}

/**
 * Ensure Tab_Input_Harian exists inside the spreadsheet
 */
async function ensureTabInputHarianExists(sheets: sheets_v4.Sheets, spreadsheetId: string) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  const existingSheet = metadata.data.sheets?.find(
    (s) => s.properties?.title === TAB_INPUT_HARIAN
  );

  if (!existingSheet) {
    // Add sheet Tab_Input_Harian
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: TAB_INPUT_HARIAN,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          },
        ],
      },
    });

    const newSheetId = addRes.data.replies?.[0]?.addSheet?.properties?.sheetId;

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB_INPUT_HARIAN}'!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [HEADER_COLUMNS],
      },
    });

    if (newSheetId !== undefined && newSheetId !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: newSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 8,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 },
                    textFormat: { bold: true },
                    horizontalAlignment: "CENTER",
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
              },
            },
          ],
        },
      });
    }
  }
}

/**
 * Append rows to Tab_Input_Harian
 */
export async function appendDailyRabEntries(
  accessToken: string,
  spreadsheetId: string,
  records: SheetRowRecord[]
) {
  const { sheets } = getGoogleClients(accessToken);

  const values = records.map((r) => [
    r.id,
    r.tanggal,
    r.lokasiSppg,
    r.namaMenu,
    r.uraianBahan,
    r.kuantitasAngka,
    r.satuan,
    r.keterangan,
  ]);

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${TAB_INPUT_HARIAN}'!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values,
    },
  });

  return res.data;
}

/**
 * Retrieve entries from Tab_Input_Harian, optionally filtered by date
 */
export async function getDailyRabEntries(
  accessToken: string,
  spreadsheetId: string,
  filterDate?: string
): Promise<SheetRowRecord[]> {
  const { sheets } = getGoogleClients(accessToken);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB_INPUT_HARIAN}'!A2:H`,
  });

  const rows = res.data.values || [];
  const records: SheetRowRecord[] = rows
    .filter((row) => row && row.length >= 5)
    .map((row) => ({
      id: row[0] || "",
      tanggal: row[1] || "",
      lokasiSppg: row[2] || "",
      namaMenu: row[3] || "",
      uraianBahan: row[4] || "",
      kuantitasAngka: Number(row[5]) || 0,
      satuan: row[6] || "",
      keterangan: row[7] || "",
    }));

  if (filterDate) {
    return records.filter((r) => r.tanggal === filterDate);
  }

  return records;
}

/**
 * Export RAB Report:
 * Reads entries for the given date, creates a NEW spreadsheet named "Laporan RAB [Tanggal]",
 * formats cells with cell merging, corporate blue header, and borders.
 */
export async function exportFormattedRabReport(
  accessToken: string,
  masterSpreadsheetId: string,
  targetDate: string
) {
  const { drive, sheets } = getGoogleClients(accessToken);

  // 1. Fetch entries for target date
  const records = await getDailyRabEntries(accessToken, masterSpreadsheetId, targetDate);

  if (records.length === 0) {
    throw new Error(`Tidak ditemukan data RAB untuk tanggal ${targetDate}. Silakan input data terlebih dahulu.`);
  }

  const lokasi = records[0]?.lokasiSppg || "Unit SPPG";
  const reportTitle = `Laporan RAB ${targetDate}`;

  // 2. Create NEW spreadsheet in user's Drive
  const newSheetRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: reportTitle,
      },
      sheets: [
        {
          properties: {
            title: "Laporan Cetak",
            gridProperties: {
              rowCount: Math.max(100, records.length + 30),
              columnCount: 10,
              hideGridlines: false,
            },
          },
        },
      ],
    },
  });

  const newFileId = newSheetRes.data.spreadsheetId;
  if (!newFileId) {
    throw new Error("Gagal membuat file Laporan baru di Google Drive");
  }

  const sheetId = newSheetRes.data.sheets?.[0]?.properties?.sheetId ?? 0;

  // 3. Organize rows & calculate cell merging
  // Header block:
  // Row 0: RENCANA ANGGARAN BIAYA (RAB) GIZI
  // Row 1: Lokasi / SPPG : ...
  // Row 2: Tanggal       : ...
  // Row 3: [Blank]
  // Row 4: Table Header: No | Menu | Uraian Bahan | Banyaknya | Keterangan
  // Row 5+: Data rows
  const titleRow = ["RENCANA ANGGARAN BIAYA (RAB) GIZI", "", "", "", ""];
  const lokasiRow = [`Lokasi / SPPG : ${lokasi}`, "", "", "", ""];
  const tanggalRow = [`Tanggal       : ${targetDate}`, "", "", "", ""];
  const blankRow = ["", "", "", "", ""];
  const tableHeader = ["No", "Menu", "Uraian Bahan", "Banyaknya", "Keterangan"];

  const sheetValues: (string | number)[][] = [
    titleRow,
    lokasiRow,
    tanggalRow,
    blankRow,
    tableHeader,
  ];

  // Group records by Menu
  const menuMap = new Map<string, SheetRowRecord[]>();
  for (const r of records) {
    const list = menuMap.get(r.namaMenu) || [];
    list.push(r);
    menuMap.set(r.namaMenu, list);
  }

  interface MergeDefinition {
    startRowIndex: number;
    endRowIndex: number;
    startColumnIndex: number;
    endColumnIndex: number;
  }

  const mergeRanges: MergeDefinition[] = [
    // Merge Title Row A1:E1
    { startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
    // Merge Lokasi Row A2:E2
    { startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 5 },
    // Merge Tanggal Row A3:E3
    { startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 5 },
  ];

  let menuNumber = 1;
  const tableStartRowIndex = 4; // index 4 is row 5 (table header)
  let currentRowIndex = 5;      // data starts at index 5 (row 6)

  for (const [menuName, items] of menuMap.entries()) {
    const menuStartRow = currentRowIndex;
    const itemsCount = items.length;

    items.forEach((item, index) => {
      const isFirst = index === 0;
      sheetValues.push([
        isFirst ? menuNumber : "",
        isFirst ? menuName : "",
        item.uraianBahan,
        `${item.kuantitasAngka} ${item.satuan}`,
        item.keterangan || "-",
      ]);
      currentRowIndex++;
    });

    // If menu has multiple bahan, merge No (Col 0) and Menu (Col 1)
    if (itemsCount > 1) {
      mergeRanges.push({
        startRowIndex: menuStartRow,
        endRowIndex: menuStartRow + itemsCount,
        startColumnIndex: 0,
        endColumnIndex: 1, // Merge Col A (No)
      });
      mergeRanges.push({
        startRowIndex: menuStartRow,
        endRowIndex: menuStartRow + itemsCount,
        startColumnIndex: 1,
        endColumnIndex: 2, // Merge Col B (Menu)
      });
    }

    menuNumber++;
  }

  const tableEndRowIndex = currentRowIndex;

  // Add summary / signature block
  sheetValues.push(blankRow);
  sheetValues.push(["", "", "", `Dicetak secara otomatis oleh SiRAGI`, ""]);
  sheetValues.push(["", "", "", `Tanggal cetak: ${new Date().toLocaleDateString("id-ID")}`, ""]);

  // 4. Write data to sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: newFileId,
    range: "'Laporan Cetak'!A1:E" + sheetValues.length,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: sheetValues,
    },
  });

  // 5. Build batchUpdate requests for formatting:
  // - Background color: Corporate Blue for table header (#1e40af -> R: 0.118, G: 0.251, B: 0.686)
  // - White text, bold, centered for table header
  // - Borders for table: SOLID black/dark gray borders
  // - Column widths:
  //   Col A: 50px
  //   Col B: 180px
  //   Col C: 260px
  //   Col D: 130px
  //   Col E: 200px
  const requests: sheets_v4.Schema$Request[] = [];

  // A. Merges
  for (const m of mergeRanges) {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: m.startRowIndex,
          endRowIndex: m.endRowIndex,
          startColumnIndex: m.startColumnIndex,
          endColumnIndex: m.endColumnIndex,
        },
        mergeType: "MERGE_ALL",
      },
    });
  }

  // B. Style Title (Row 0)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 14, foregroundColor: { red: 0.1, green: 0.2, blue: 0.45 } },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)",
    },
  });

  // C. Style Metadata (Rows 1-2)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: 3,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
          horizontalAlignment: "LEFT",
        },
      },
      fields: "userEnteredFormat(textFormat,horizontalAlignment)",
    },
  });

  // D. Style Table Header (Row 4: Blue background, White Bold text)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: tableStartRowIndex,
        endRowIndex: tableStartRowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.118, green: 0.251, blue: 0.686 }, // Deep Corporate Blue (#1e40af)
          textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
    },
  });

  // E. Style Table Data Rows (Vertical Alignment Middle, Text Alignment)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: tableStartRowIndex + 1,
        endRowIndex: tableEndRowIndex,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { fontSize: 10 },
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(textFormat,verticalAlignment)",
    },
  });

  // Center align No (Col A) and Banyaknya (Col D)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: tableStartRowIndex + 1,
        endRowIndex: tableEndRowIndex,
        startColumnIndex: 0,
        endColumnIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "CENTER",
        },
      },
      fields: "userEnteredFormat(horizontalAlignment)",
    },
  });

  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: tableStartRowIndex + 1,
        endRowIndex: tableEndRowIndex,
        startColumnIndex: 3,
        endColumnIndex: 4,
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "CENTER",
        },
      },
      fields: "userEnteredFormat(horizontalAlignment)",
    },
  });

  // F. Table Borders (Header + Data)
  requests.push({
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: tableStartRowIndex,
        endRowIndex: tableEndRowIndex,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      top: { style: "SOLID_MEDIUM", color: { red: 0, green: 0, blue: 0 } },
      bottom: { style: "SOLID_MEDIUM", color: { red: 0, green: 0, blue: 0 } },
      left: { style: "SOLID_MEDIUM", color: { red: 0, green: 0, blue: 0 } },
      right: { style: "SOLID_MEDIUM", color: { red: 0, green: 0, blue: 0 } },
      innerHorizontal: { style: "SOLID", color: { red: 0.6, green: 0.6, blue: 0.6 } },
      innerVertical: { style: "SOLID", color: { red: 0.6, green: 0.6, blue: 0.6 } },
    },
  });

  // G. Set Column Widths
  const columnWidths = [50, 180, 260, 130, 200];
  columnWidths.forEach((width, colIndex) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: colIndex,
          endIndex: colIndex + 1,
        },
        properties: {
          pixelSize: width,
        },
        fields: "pixelSize",
      },
    });
  });

  // Execute batchUpdate formatting
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: newFileId,
    requestBody: { requests },
  });

  // Retrieve file URL from Drive
  const fileDetail = await drive.files.get({
    fileId: newFileId,
    fields: "id, name, webViewLink",
  });

  return {
    success: true,
    spreadsheetId: newFileId,
    spreadsheetUrl: fileDetail.data.webViewLink || `https://docs.google.com/spreadsheets/d/${newFileId}/edit`,
    title: reportTitle,
    rowCount: records.length,
  };
}
