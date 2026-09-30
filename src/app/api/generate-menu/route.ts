import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const VALID_UNITS = ["kg", "liter", "pcs", "pouch", "kotak", "ball"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model: requestedModel, apiKey: userApiKey } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Instruksi/prompt wajib diisi." },
        { status: 400 }
      );
    }

    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API Key belum tersedia. Silakan masukkan API Key di modal atau konfigurasikan GEMINI_API_KEY di file .env.local",
        },
        { status: 400 }
      );
    }

    // Default model to gemini-2.5-flash or user-selected model
    const selectedModel = requestedModel?.trim() || "gemini-2.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      systemInstruction: `Anda adalah asisten ahli nutrisi dan gizi profesional yang bertugas merancang Rencana Anggaran Biaya (RAB) Makanan dan Menu Gizi.
Instruksi ketat:
1. HANYA kembalikan data dalam format JSON murni (array of objects), TANPA markdown wrap seperti \`\`\`json.
2. Satuan bahan WAJIB salah satu dari 6 pilihan ini saja: "kg", "liter", "pcs", "pouch", "kotak", "ball".
3. "kuantitas" WAJIB berupa angka (number), bukan string.
4. "uraian" adalah nama bahan spesifik.
5. "keterangan" berisi keterangan spesifikasi bahan, ukuran potong, atau kemasan.

STRUKTUR OUTPUT JSON:
[
  {
    "namaMenu": "Nama Menu Masakan",
    "bahan": [
      {
        "uraian": "Nama Bahan",
        "kuantitas": 1.5,
        "satuan": "kg",
        "keterangan": "Keterangan spesifikasi"
      }
    ]
  }
]`,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Buatkan rancangan menu dan rincian bahan RAB gizi untuk instruksi berikut: "${prompt.trim()}". Berikan porsi realistis dengan minimal 2-4 menu dan beberapa bahan pokok per menu.`,
            },
          ],
        },
      ],
    });

    const responseText = result.response.text();

    // Clean any accidental markdown code fences
    let cleanedJson = responseText.trim();
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsedMenus: any[];
    try {
      parsedMenus = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Gagal parse JSON Gemini:", responseText);
      return NextResponse.json(
        {
          error: "Gemini tidak mengembalikan format JSON yang valid. Silakan coba ulangi instruksi.",
          raw: responseText,
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedMenus)) {
      return NextResponse.json(
        { error: "Format respons Gemini bukan berupa array menu." },
        { status: 500 }
      );
    }

    // Sanitize and normalize items
    const sanitizedMenus = parsedMenus.map((m: any, mIdx: number) => {
      const namaMenu = m.namaMenu || `Menu #${mIdx + 1}`;
      const rawBahanList = Array.isArray(m.bahan) ? m.bahan : [];

      const bahan = rawBahanList.map((b: any) => {
        let satuan = String(b.satuan || "kg").toLowerCase().trim();
        if (!VALID_UNITS.includes(satuan)) {
          satuan = "kg"; // fallback to valid unit
        }

        return {
          uraian: String(b.uraian || "Bahan Makanan").trim(),
          kuantitas: typeof b.kuantitas === "number" ? b.kuantitas : Number(b.kuantitas) || 1,
          satuan,
          keterangan: String(b.keterangan || "").trim(),
        };
      });

      return {
        namaMenu,
        bahan,
      };
    });

    return NextResponse.json({
      success: true,
      modelUsed: selectedModel,
      menuList: sanitizedMenus,
    });
  } catch (error: any) {
    console.error("Error in /api/generate-menu:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Terjadi kesalahan saat memproses permintaan ke Gemini API.",
      },
      { status: 500 }
    );
  }
}
