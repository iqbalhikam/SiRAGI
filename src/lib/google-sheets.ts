import { google, sheets_v4 } from "googleapis";
import { SheetRowRecord, RabHistoryDocument, RabHistoryMenu } from "@/types/rab";
import {
  formatFullHariTanggal,
  formatTanggalUpper,
  formatIndoNumber,
  normalizeDateToYMD,
} from "@/lib/utils";

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
    normalizeDateToYMD(r.tanggal),
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
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const rows = res.data.values || [];
  const records: SheetRowRecord[] = rows
    .filter((row) => row && row.length >= 5)
    .map((row) => ({
      id: row[0] || "",
      tanggal: normalizeDateToYMD(row[1] || ""),
      lokasiSppg: row[2] || "",
      namaMenu: row[3] || "",
      uraianBahan: row[4] || "",
      kuantitasAngka: Number(row[5]) || 0,
      satuan: row[6] || "",
      keterangan: row[7] || "",
    }));

  if (filterDate) {
    const target = normalizeDateToYMD(filterDate);
    return records.filter((r) => r.tanggal === target);
  }

  return records;
}

export interface ExportOptions {
  targetDate?: string;
  mode?: "single" | "all" | "range";
  startDate?: string;
  endDate?: string;
}

/**
 * Export RAB Report matching the exact Food Cost layout:
 * - Top Banner: "FOOD COST (KEBUTUHAN BAHAN BAKU) HARIAN [RENTANG TANGGAL]" & "SPPG [LOKASI]"
 *   (Merged A1:E1 and A2:E2, medium blue background, bold white text)
 * - For each date:
 *   - "Hari/Tanggal : [NamaHari], [d MMMM yyyy]"
 *   - "Menu : [Menu1, Menu2, Menu3, ...]"
 *   - Table Header: No | Menu | Uraian Bahan | Banyaknya | Keterangan
 *     (Medium blue background, bold white text)
 *   - Data Rows:
 *     - No & Menu only printed on the first row of each menu, blank below
 *     - Full solid black borders for all cells
 *   - 1 blank row separator between dates
 */
export async function exportFormattedRabReport(
  accessToken: string,
  masterSpreadsheetId: string,
  targetOrOptions: string | ExportOptions
) {
  const { drive, sheets } = getGoogleClients(accessToken);

  const options: ExportOptions =
    typeof targetOrOptions === "string"
      ? { targetDate: targetOrOptions, mode: "single" }
      : targetOrOptions;

  // 1. Fetch entries from Tab_Input_Harian
  let records: SheetRowRecord[] = [];
  if (options.mode === "all") {
    records = await getDailyRabEntries(accessToken, masterSpreadsheetId);
  } else if (options.mode === "range" && options.startDate && options.endDate) {
    const start = normalizeDateToYMD(options.startDate);
    const end = normalizeDateToYMD(options.endDate);
    const all = await getDailyRabEntries(accessToken, masterSpreadsheetId);
    records = all.filter((r) => r.tanggal >= start && r.tanggal <= end);
  } else {
    // Single date mode
    const dateToFetch = normalizeDateToYMD(
      options.targetDate || new Date().toISOString().split("T")[0]
    );
    records = await getDailyRabEntries(accessToken, masterSpreadsheetId, dateToFetch);
  }

  if (records.length === 0) {
    throw new Error(
      "Tidak ditemukan data RAB untuk tanggal atau rentang yang dipilih. Silakan input data terlebih dahulu."
    );
  }

  // Sort chronologically by date
  records.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Determine unique dates and SPPG location
  const uniqueDates = Array.from(new Set(records.map((r) => r.tanggal)));
  const lokasiSppg = records[0]?.lokasiSppg || "KALIANYAR KERTOSONO NGANJUK";

  // Build Banner Title
  let dateBannerText = "";
  if (uniqueDates.length === 1) {
    dateBannerText = formatTanggalUpper(uniqueDates[0]);
  } else {
    dateBannerText = `${formatTanggalUpper(uniqueDates[0])} - ${formatTanggalUpper(
      uniqueDates[uniqueDates.length - 1]
    )}`;
  }

  const row1Banner = `FOOD COST (KEBUTUHAN BAHAN BAKU) HARIAN ${dateBannerText}`;
  const row2Banner = `SPPG ${lokasiSppg.toUpperCase()}`;

  const spreadsheetTitle = `Laporan Food Cost RAB ${dateBannerText}`;

  // 2. Create NEW spreadsheet in user's Drive
  const newSheetRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: spreadsheetTitle,
      },
      sheets: [
        {
          properties: {
            title: "Laporan Food Cost",
            gridProperties: {
              rowCount: Math.max(150, records.length * 3 + 50),
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
    throw new Error("Gagal membuat file spreadsheet baru di Google Drive.");
  }

  const sheetId = newSheetRes.data.sheets?.[0]?.properties?.sheetId ?? 0;

  // 3. Assemble sheet values & track layout sections
  const sheetValues: (string | number)[][] = [
    [row1Banner, "", "", "", ""],
    [row2Banner, "", "", "", ""],
  ];

  interface TableSection {
    headerRowIndex: number;
    startDataRowIndex: number;
    endDataRowIndex: number;
    hariTanggalRowIndex: number;
    menuSummaryRowIndex: number;
  }

  const tableSections: TableSection[] = [];

  for (const date of uniqueDates) {
    const dayRecords = records.filter((r) => r.tanggal === date);

    // Group items by Menu
    const menuMap = new Map<string, SheetRowRecord[]>();
    for (const r of dayRecords) {
      const list = menuMap.get(r.namaMenu) || [];
      list.push(r);
      menuMap.set(r.namaMenu, list);
    }

    const menuNamesJoined = Array.from(menuMap.keys()).join(", ");

    // Day Header
    const hariTanggalRowIndex = sheetValues.length;
    sheetValues.push([`Hari/Tanggal : ${formatFullHariTanggal(date)}`, "", "", "", ""]);

    const menuSummaryRowIndex = sheetValues.length;
    sheetValues.push([`Menu : ${menuNamesJoined}`, "", "", "", ""]);

    // Table Header
    const headerRowIndex = sheetValues.length;
    sheetValues.push(["No", "Menu", "Uraian Bahan", "Banyaknya", "Keterangan"]);

    const startDataRowIndex = sheetValues.length;

    let menuNumber = 1;
    for (const [menuName, items] of menuMap.entries()) {
      items.forEach((item, idx) => {
        const isFirst = idx === 0;
        const banyaknyaFormatted = `${formatIndoNumber(item.kuantitasAngka)} ${item.satuan}`;

        sheetValues.push([
          isFirst ? menuNumber : "",
          isFirst ? menuName : "",
          item.uraianBahan,
          banyaknyaFormatted,
          item.keterangan || "",
        ]);
      });
      menuNumber++;
    }

    const endDataRowIndex = sheetValues.length;

    tableSections.push({
      headerRowIndex,
      startDataRowIndex,
      endDataRowIndex,
      hariTanggalRowIndex,
      menuSummaryRowIndex,
    });

    // 1 blank row between days
    sheetValues.push(["", "", "", "", ""]);
  }

  // 4. Write data to sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: newFileId,
    range: `'Laporan Food Cost'!A1:E` + sheetValues.length,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: sheetValues,
    },
  });

  // 5. BatchUpdate styling requests to match user's screenshot
  // Medium blue hex #4a86e8 -> RGB: { red: 0.29, green: 0.525, blue: 0.91 }
  const MEDIUM_BLUE = { red: 0.29, green: 0.525, blue: 0.91 };
  const WHITE = { red: 1, green: 1, blue: 1 };
  const BLACK = { red: 0, green: 0, blue: 0 };

  const requests: sheets_v4.Schema$Request[] = [];

  // A. Merges for Top Banner (Row 0 & Row 1 across Col A to E)
  requests.push({
    mergeCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    mergeCells: {
      range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 5 },
      mergeType: "MERGE_ALL",
    },
  });

  // Style Top Banner (Blue background, White bold text, centered, middle)
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 5 },
      cell: {
        userEnteredFormat: {
          backgroundColor: MEDIUM_BLUE,
          textFormat: { bold: true, fontSize: 11, foregroundColor: WHITE },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
    },
  });

  // Banner Borders
  requests.push({
    updateBorders: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 5 },
      top: { style: "SOLID", color: BLACK },
      bottom: { style: "SOLID", color: BLACK },
      left: { style: "SOLID", color: BLACK },
      right: { style: "SOLID", color: BLACK },
      innerHorizontal: { style: "SOLID", color: BLACK },
    },
  });

  // B. Style each Date section
  for (const section of tableSections) {
    // Style Hari/Tanggal row
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.hariTanggalRowIndex,
          endRowIndex: section.hariTanggalRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 10, foregroundColor: BLACK },
            horizontalAlignment: "LEFT",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)",
      },
    });

    // Style Menu : ... row
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.menuSummaryRowIndex,
          endRowIndex: section.menuSummaryRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 10, foregroundColor: BLACK },
            horizontalAlignment: "LEFT",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)",
      },
    });

    // Style Table Header (Medium Blue background, White bold text, Centered)
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.headerRowIndex,
          endRowIndex: section.headerRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: MEDIUM_BLUE,
            textFormat: { bold: true, fontSize: 10, foregroundColor: WHITE },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    });

    // Style Data Rows
    // Base style: 10pt font, Middle vertical alignment
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { fontSize: 10, foregroundColor: BLACK },
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(textFormat,verticalAlignment)",
      },
    });

    // Col A (No): Center
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: { horizontalAlignment: "CENTER" },
        },
        fields: "userEnteredFormat(horizontalAlignment)",
      },
    });

    // Col B (Menu): Left
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: { horizontalAlignment: "LEFT" },
        },
        fields: "userEnteredFormat(horizontalAlignment)",
      },
    });

    // Col C (Uraian Bahan): Left
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: { horizontalAlignment: "LEFT" },
        },
        fields: "userEnteredFormat(horizontalAlignment)",
      },
    });

    // Col D (Banyaknya): Center
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 3,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: { horizontalAlignment: "CENTER" },
        },
        fields: "userEnteredFormat(horizontalAlignment)",
      },
    });

    // Col E (Keterangan): Left
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: section.startDataRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 4,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: { horizontalAlignment: "LEFT" },
        },
        fields: "userEnteredFormat(horizontalAlignment)",
      },
    });

    // Full Solid Borders for Header + Data Rows of this day
    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: section.headerRowIndex,
          endRowIndex: section.endDataRowIndex,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        top: { style: "SOLID", color: BLACK },
        bottom: { style: "SOLID", color: BLACK },
        left: { style: "SOLID", color: BLACK },
        right: { style: "SOLID", color: BLACK },
        innerHorizontal: { style: "SOLID", color: BLACK },
        innerVertical: { style: "SOLID", color: BLACK },
      },
    });
  }

  // C. Set Column Widths (matching screenshot proportions)
  const columnWidths = [50, 190, 260, 140, 260];
  columnWidths.forEach((width, colIdx) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: colIdx,
          endIndex: colIdx + 1,
        },
        properties: { pixelSize: width },
        fields: "pixelSize",
      },
    });
  });

  // Execute batchUpdate
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: newFileId,
    requestBody: { requests },
  });

  // Get file webViewLink
  const fileDetail = await drive.files.get({
    fileId: newFileId,
    fields: "id, name, webViewLink",
  });

  return {
    success: true,
    spreadsheetId: newFileId,
    spreadsheetUrl:
      fileDetail.data.webViewLink ||
      `https://docs.google.com/spreadsheets/d/${newFileId}/edit`,
    title: spreadsheetTitle,
    rowCount: records.length,
    datesCount: uniqueDates.length,
  };
}

/**
 * Retrieve and group historical data from Tab_Input_Harian by Tanggal and Lokasi SPPG
 */
export async function getGroupedRabHistory(
  accessToken: string,
  spreadsheetId: string,
  filter?: { startDate?: string; endDate?: string; keyword?: string }
): Promise<RabHistoryDocument[]> {
  const allRecords = await getDailyRabEntries(accessToken, spreadsheetId);

  // Filter records
  let filtered = allRecords;

  if (filter?.startDate) {
    const start = normalizeDateToYMD(filter.startDate);
    filtered = filtered.filter((r) => r.tanggal >= start);
  }
  if (filter?.endDate) {
    const end = normalizeDateToYMD(filter.endDate);
    filtered = filtered.filter((r) => r.tanggal <= end);
  }
  if (filter?.keyword && filter.keyword.trim()) {
    const kw = filter.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.lokasiSppg.toLowerCase().includes(kw) ||
        r.namaMenu.toLowerCase().includes(kw) ||
        r.uraianBahan.toLowerCase().includes(kw) ||
        r.tanggal.includes(kw)
    );
  }

  // Group by composite key: `${tanggal}___${lokasiSppg}`
  const groupMap = new Map<string, SheetRowRecord[]>();
  for (const r of filtered) {
    const key = `${r.tanggal}___${r.lokasiSppg}`;
    const list = groupMap.get(key) || [];
    list.push(r);
    groupMap.set(key, list);
  }

  const documents: RabHistoryDocument[] = [];

  for (const [key, rows] of groupMap.entries()) {
    const [tanggal, lokasiSppg] = key.split("___");

    // Group items within this document by namaMenu
    const menuMap = new Map<string, SheetRowRecord[]>();
    for (const r of rows) {
      const list = menuMap.get(r.namaMenu) || [];
      list.push(r);
      menuMap.set(r.namaMenu, list);
    }

    const menus: RabHistoryMenu[] = [];
    for (const [namaMenu, items] of menuMap.entries()) {
      menus.push({
        namaMenu,
        bahanList: items.map((item) => ({
          id: item.id,
          uraianBahan: item.uraianBahan,
          kuantitasAngka: item.kuantitasAngka,
          satuan: item.satuan,
          keterangan: item.keterangan,
        })),
      });
    }

    const menuSummary = Array.from(menuMap.keys()).join(", ");

    documents.push({
      id: `DOC-${tanggal}-${lokasiSppg.replace(/\s+/g, "_")}`,
      tanggal,
      tanggalFormatted: formatFullHariTanggal(tanggal),
      lokasiSppg,
      totalMenu: menus.length,
      totalBahan: rows.length,
      menuSummary,
      menus,
    });
  }

  // Sort newest dates first (descending)
  documents.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return documents;
}
